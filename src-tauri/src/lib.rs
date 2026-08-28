mod hls;
mod media;
mod mime;
mod server;

use std::path::{Path, PathBuf};

use serde::Serialize;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize)]
pub struct RevealResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[derive(Serialize)]
pub struct DeleteResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    cancelled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// HLS 包路径指向包内 m3u8 时，应删除整个包目录，而不是只删清单文件。
fn resolve_delete_target(path: &Path) -> PathBuf {
    if let Some(parent) = path.parent() {
        if let Some(playlist) = hls::find_hls_playlist(parent) {
            if playlist == path {
                return parent.to_path_buf();
            }
        }
    }
    path.to_path_buf()
}

#[tauri::command]
async fn pick_directory(app: tauri::AppHandle) -> Option<String> {
    // async command runs off the main thread; blocking_pick_folder is safe here.
    // Sync commands deadlock the event loop when the native dialog opens.
    app.dialog()
        .file()
        .set_title("选择文件夹")
        .blocking_pick_folder()
        .map(|path| path.to_string())
}

#[tauri::command]
fn show_item_in_folder(app: tauri::AppHandle, path: String) -> RevealResult {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return RevealResult {
            ok: false,
            error: Some("无效的文件路径".into()),
        };
    }

    let normalized = PathBuf::from(trimmed);
    if !normalized.is_absolute() {
        return RevealResult {
            ok: false,
            error: Some("路径必须为绝对路径".into()),
        };
    }
    if !normalized.exists() {
        return RevealResult {
            ok: false,
            error: Some("文件不存在".into()),
        };
    }

    match app.opener().reveal_item_in_dir(&normalized) {
        Ok(()) => RevealResult {
            ok: true,
            error: None,
        },
        Err(e) => RevealResult {
            ok: false,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
async fn delete_local_file(app: tauri::AppHandle, path: String) -> DeleteResult {
    // async command runs off the main thread; blocking_show is safe here.
    let trimmed = path.trim();
    if trimmed.is_empty() {
        return DeleteResult {
            ok: false,
            cancelled: None,
            error: Some("无效的文件路径".into()),
        };
    }

    let normalized = PathBuf::from(trimmed);
    if !normalized.is_absolute() {
        return DeleteResult {
            ok: false,
            cancelled: None,
            error: Some("路径必须为绝对路径".into()),
        };
    }
    if !normalized.exists() {
        return DeleteResult {
            ok: false,
            cancelled: None,
            error: Some("文件不存在".into()),
        };
    }

    let target = resolve_delete_target(&normalized);
    let label = target
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(trimmed);

    let confirmed = app
        .dialog()
        .message(format!("确定删除本地资源「{label}」？\n此操作不可恢复。"))
        .title("删除确认")
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "删除".into(),
            "取消".into(),
        ))
        .blocking_show();

    if !confirmed {
        return DeleteResult {
            ok: false,
            cancelled: Some(true),
            error: None,
        };
    }

    let remove_result = if target.is_dir() {
        std::fs::remove_dir_all(&target)
    } else {
        std::fs::remove_file(&target)
    };

    match remove_result {
        Ok(()) => DeleteResult {
            ok: true,
            cancelled: None,
            error: None,
        },
        Err(e) => DeleteResult {
            ok: false,
            cancelled: None,
            error: Some(format!("删除失败: {e}")),
        },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let port: u16 = std::env::var("PLAYER_API_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(3001);

    let default_path = std::env::var("PLAYER_API_DEFAULT_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |_app| {
            let default_path = default_path.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(err) = server::start_server(port, default_path).await {
                    eprintln!("Failed to start API server: {err}");
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            pick_directory,
            show_item_in_folder,
            delete_local_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
