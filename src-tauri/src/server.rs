use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

use axum::body::Body;
use axum::extract::{Query, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tower_http::cors::{Any, CorsLayer};

use crate::hls::{find_hls_playlist, is_m3u8_path, playlist_mime, rewrite_hls_playlist, stream_content_type};
use crate::media::is_playable_media_path;
use crate::mime::{
    get_mime_type_from_extension, is_directory, is_media_or_dir, DIRECTORY,
};

#[derive(Clone)]
pub struct AppState {
    pub default_path: PathBuf,
    pub started_at: Instant,
}

#[derive(Deserialize)]
pub struct GetFilesQuery {
    path: Option<String>,
    keyword: Option<String>,
}

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    #[serde(rename = "type")]
    file_type: String,
    path: String,
}

#[derive(Deserialize)]
pub struct VideoQuery {
    path: Option<String>,
}

pub fn create_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health))
        .route("/getFiles", get(get_files))
        .route("/video", get(stream_video))
        .layer(cors)
        .with_state(Arc::new(state))
}

async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    Json(serde_json::json!({
        "status": "ok",
        "timestamp": ts,
        "uptime": state.started_at.elapsed().as_secs_f64(),
    }))
}

async fn get_files(
    State(state): State<Arc<AppState>>,
    Query(query): Query<GetFilesQuery>,
) -> Result<Json<Vec<FileEntry>>, (StatusCode, String)> {
    let scan_path = query
        .path
        .filter(|p| !p.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| state.default_path.clone());

    let keyword = query
        .keyword
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();

    let mut entries = tokio::fs::read_dir(&scan_path)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("读取目录失败: {e}")))?;

    let mut files = Vec::new();
    let flatten_subfolders = scan_path
        .file_name()
        .and_then(|n| n.to_str())
        == Some("cate_p");

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    {
        let name = entry.file_name().to_string_lossy().to_string();
        let full_path = entry.path();
        let file_type = if entry
            .file_type()
            .await
            .map(|t| t.is_dir())
            .unwrap_or(false)
        {
            // 仅 cate_p：子文件夹当成右侧资源（HLS 包指向 m3u8）；其它目录仍返回为文件夹
            if flatten_subfolders {
                if let Some(playlist) = find_hls_playlist(&full_path) {
                    if is_playable_media_path(&playlist)
                        && (keyword.is_empty()
                            || name.to_ascii_lowercase().contains(&keyword))
                    {
                        files.push(FileEntry {
                            name,
                            file_type: playlist_mime().to_string(),
                            path: playlist.to_string_lossy().to_string(),
                        });
                    }
                    continue;
                }
            }
            DIRECTORY.to_string()
        } else {
            get_mime_type_from_extension(&name)
        };

        if !is_media_or_dir(&file_type) {
            continue;
        }
        // 目录照常返回；音视频再探容器头，丢掉截断/假 MP4/TS 冒充等无法播放的文件
        if !is_directory(&file_type) && !is_playable_media_path(&full_path) {
            continue;
        }
        if !keyword.is_empty() && !name.to_ascii_lowercase().contains(&keyword) {
            continue;
        }

        files.push(FileEntry {
            name,
            file_type,
            path: full_path.to_string_lossy().to_string(),
        });
    }

    // 目录优先，其次按文件名自然排序后返回前端
    files.sort_by(|a, b| {
        let a_is_dir = a.file_type == DIRECTORY;
        let b_is_dir = b.file_type == DIRECTORY;
        match (a_is_dir, b_is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => natural_name_cmp(&a.name, &b.name),
        }
    });

    Ok(Json(files))
}

async fn stream_video(
    Query(query): Query<VideoQuery>,
    headers: HeaderMap,
) -> Result<Response, (StatusCode, String)> {
    let video_path = query
        .path
        .filter(|p| !p.trim().is_empty())
        .ok_or((StatusCode::BAD_REQUEST, "path required".to_string()))?;

    let path = PathBuf::from(&video_path);
    let meta = tokio::fs::metadata(&path)
        .await
        .map_err(|e| (StatusCode::NOT_FOUND, format!("文件不存在: {e}")))?;

    if is_m3u8_path(&path) {
        let raw = tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let content = raw.strip_prefix('\u{feff}').unwrap_or(&raw);
        let rewritten = rewrite_hls_playlist(content, &path);
        return Ok(Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, playlist_mime())
            .header(header::CACHE_CONTROL, "no-store")
            .header(header::CONTENT_LENGTH, rewritten.len())
            .body(Body::from(rewritten))
            .unwrap());
    }

    let file_size = meta.len();
    let content_type = stream_content_type(&path);

    let range_header = headers
        .get(header::RANGE)
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    if let Some(range_value) = range_header {
        let range = parse_bytes_range(&range_value, file_size)
            .ok_or((StatusCode::RANGE_NOT_SATISFIABLE, "invalid range".into()))?;
        let (start, end) = range;
        let chunk_size = end - start + 1;

        let mut file = File::open(&path)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        file.seek(std::io::SeekFrom::Start(start))
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let stream = tokio_util::io::ReaderStream::new(file.take(chunk_size));
        let body = Body::from_stream(stream);

        return Ok(Response::builder()
            .status(StatusCode::PARTIAL_CONTENT)
            .header(header::CONTENT_RANGE, format!("bytes {start}-{end}/{file_size}"))
            .header(header::ACCEPT_RANGES, "bytes")
            .header(header::CONTENT_LENGTH, chunk_size)
            .header(header::CONTENT_TYPE, content_type)
            .header(header::CACHE_CONTROL, "no-store")
            .body(body)
            .unwrap());
    }

    let file = File::open(&path)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let stream = tokio_util::io::ReaderStream::new(file);
    let body = Body::from_stream(stream);

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_LENGTH, file_size)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCEPT_RANGES, "bytes")
        .header(header::CACHE_CONTROL, "no-store")
        .body(body)
        .unwrap())
}

fn parse_bytes_range(header: &str, file_size: u64) -> Option<(u64, u64)> {
    let value = header.strip_prefix("bytes=")?;
    let mut parts = value.splitn(2, '-');
    let start: u64 = parts.next()?.parse().ok()?;
    let end = match parts.next()? {
        "" => file_size.saturating_sub(1),
        other => other.parse().ok()?,
    };
    if start > end || end >= file_size {
        return None;
    }
    Some((start, end))
}

/// 按文件名做自然排序：连续数字按数值比较，其余字符按不区分大小写的字典序。
fn natural_name_cmp(a: &str, b: &str) -> std::cmp::Ordering {
    let a_chars: Vec<char> = a.chars().collect();
    let b_chars: Vec<char> = b.chars().collect();
    let mut i = 0;
    let mut j = 0;

    while i < a_chars.len() && j < b_chars.len() {
        let a_is_digit = a_chars[i].is_ascii_digit();
        let b_is_digit = b_chars[j].is_ascii_digit();

        if a_is_digit && b_is_digit {
            let mut a_num = 0u64;
            while i < a_chars.len() && a_chars[i].is_ascii_digit() {
                a_num = a_num
                    .saturating_mul(10)
                    .saturating_add(a_chars[i].to_digit(10).unwrap_or(0) as u64);
                i += 1;
            }
            let mut b_num = 0u64;
            while j < b_chars.len() && b_chars[j].is_ascii_digit() {
                b_num = b_num
                    .saturating_mul(10)
                    .saturating_add(b_chars[j].to_digit(10).unwrap_or(0) as u64);
                j += 1;
            }
            match a_num.cmp(&b_num) {
                std::cmp::Ordering::Equal => continue,
                other => return other,
            }
        }

        let a_lower = a_chars[i].to_ascii_lowercase();
        let b_lower = b_chars[j].to_ascii_lowercase();
        match a_lower.cmp(&b_lower) {
            std::cmp::Ordering::Equal => {
                i += 1;
                j += 1;
            }
            other => return other,
        }
    }

    a_chars.len().cmp(&b_chars.len())
}

pub async fn start_server(port: u16, default_path: PathBuf) -> Result<(), std::io::Error> {
    let state = AppState {
        default_path: default_path.clone(),
        started_at: Instant::now(),
    };
    let app = create_router(state);
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", port)).await?;
    println!("Server running on port {port}");
    println!("Default scan path: {}", default_path.display());
    axum::serve(listener, app).await
}
