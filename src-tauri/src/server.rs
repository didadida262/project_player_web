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

use crate::mime::{
    get_mime_type_from_extension, is_media_or_dir, DIRECTORY,
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
            DIRECTORY.to_string()
        } else {
            get_mime_type_from_extension(&name)
        };

        if !is_media_or_dir(&file_type) {
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
    let file_size = meta.len();
    let content_type = get_mime_type_from_extension(&video_path);

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
