use std::path::Path;

pub const DIRECTORY: &str = "inode/directory";
pub const OCTET_STREAM: &str = "application/octet-stream";

pub fn get_mime_type_from_extension(filename: &str) -> String {
    let ext = Path::new(filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    match ext.as_str() {
        "mp4" => "video/mp4",
        "avi" => "video/x-msvideo",
        "mov" => "video/quicktime",
        "wmv" => "video/x-ms-wmv",
        "flv" => "video/x-flv",
        "mkv" => "video/x-matroska",
        "webm" => "video/webm",
        "m4v" => "video/x-m4v",
        "3gp" => "video/3gpp",
        "mpg" | "mpeg" => "video/mpeg",
        "m3u8" => "application/vnd.apple.mpegurl",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "flac" => "audio/flac",
        "aac" => "audio/aac",
        "ogg" => "audio/ogg",
        "m4a" => "audio/x-m4a",
        "wma" => "audio/x-ms-wma",
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "tiff" => "image/tiff",
        "pdf" => "application/pdf",
        _ => OCTET_STREAM,
    }
    .to_string()
}

pub fn is_video_file(mime: &str) -> bool {
    mime.to_ascii_lowercase().starts_with("video/")
        || mime.eq_ignore_ascii_case("application/vnd.apple.mpegurl")
        || mime.eq_ignore_ascii_case("application/x-mpegURL")
}

pub fn is_audio_file(mime: &str) -> bool {
    mime.to_ascii_lowercase().starts_with("audio/")
}

pub fn is_directory(mime: &str) -> bool {
    mime.eq_ignore_ascii_case(DIRECTORY) || mime.eq_ignore_ascii_case("directory")
}

pub fn is_media_or_dir(mime: &str) -> bool {
    is_directory(mime) || is_video_file(mime) || is_audio_file(mime)
}
