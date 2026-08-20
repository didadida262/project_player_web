mod hls;
mod media;
mod mime;
mod server;

use std::path::PathBuf;

use serde::Serialize;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize)]
pub struct RevealResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
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
        .invoke_handler(tauri::generate_handler![pick_directory, show_item_in_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
