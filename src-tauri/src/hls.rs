use std::path::{Path, PathBuf};

const PLAYLIST_MIME: &str = "application/vnd.apple.mpegurl";

#[derive(Clone, Debug)]
struct DirName {
    name: String,
    is_dir: bool,
}

/// 顶层有 m3u8 即视为 HLS 包（下载器目录、迅雷可播的那种），不当普通文件夹。
pub fn find_hls_playlist(dir: &Path) -> Option<PathBuf> {
    let mut names = Vec::new();
    let entries = std::fs::read_dir(dir).ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        names.push(DirName { name, is_dir });
    }
    if !looks_like_hls_package(&names) {
        return None;
    }
    let playlist_name = pick_playlist_name(&names)?;
    let playlist = dir.join(&playlist_name);
    if !playlist.is_file() {
        return None;
    }
    Some(playlist)
}

pub fn playlist_mime() -> &'static str {
    PLAYLIST_MIME
}

pub fn is_m3u8_path(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("m3u8"))
        .unwrap_or(false)
}

pub fn stream_content_type(path: &Path) -> String {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    match ext.as_str() {
        "m3u8" => PLAYLIST_MIME.to_string(),
        "ts" | "m2ts" | "mts" => "video/MP2T".to_string(),
        _ => crate::mime::get_mime_type_from_extension(&path.to_string_lossy()),
    }
}

/// 把清单里的相对 URI 改成 `/video?path=`，否则 hls.js 会按 URL 路径解析，丢掉 query 里的真实目录。
pub fn rewrite_hls_playlist(content: &str, playlist_path: &Path) -> String {
    let base_dir = playlist_path.parent().unwrap_or(Path::new("."));
    let mut out = String::with_capacity(content.len() + 256);
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            out.push_str(line);
        } else if trimmed.starts_with('#') {
            out.push_str(&rewrite_directive_uris(line, base_dir));
        } else {
            out.push_str(&rewrite_uri(trimmed, base_dir));
        }
        out.push('\n');
    }
    out
}

fn looks_like_hls_package(entries: &[DirName]) -> bool {
    let has_m3u8 = entries.iter().any(|e| {
        !e.is_dir && e.name.to_ascii_lowercase().ends_with(".m3u8")
    });
    if !has_m3u8 {
        return false;
    }
    let has_cfg = entries
        .iter()
        .any(|e| e.name.eq_ignore_ascii_case("hls.cfg"));
    let has_ts = entries.iter().any(|e| {
        if e.is_dir {
            return false;
        }
        let lower = e.name.to_ascii_lowercase();
        lower.ends_with(".ts") || lower.ends_with(".m2ts") || lower.ends_with(".mts")
    });
    let has_segment_dir = entries.iter().any(|e| {
        e.is_dir
            && (e.name.eq_ignore_ascii_case("index")
                || e.name.eq_ignore_ascii_case("ts")
                || e.name.eq_ignore_ascii_case("segments")
                || e.name.eq_ignore_ascii_case("video"))
    });
    has_cfg || has_ts || has_segment_dir
}

fn pick_playlist_name(entries: &[DirName]) -> Option<String> {
    let mut m3u8: Vec<String> = entries
        .iter()
        .filter(|e| !e.is_dir && e.name.to_ascii_lowercase().ends_with(".m3u8"))
        .map(|e| e.name.clone())
        .collect();
    if m3u8.is_empty() {
        return None;
    }
    const PREFER: [&str; 3] = ["index.m3u8", "master.m3u8", "playlist.m3u8"];
    for preferred in PREFER {
        if let Some(name) = m3u8
            .iter()
            .find(|n| n.eq_ignore_ascii_case(preferred))
            .cloned()
        {
            return Some(name);
        }
    }
    m3u8.sort_by_key(|s| s.to_ascii_lowercase());
    m3u8.into_iter().next()
}

fn rewrite_directive_uris(line: &str, base_dir: &Path) -> String {
    let lower = line.to_ascii_lowercase();
    if !lower.contains("uri=") {
        return line.to_string();
    }
    let mut result = String::with_capacity(line.len() + 64);
    let mut last = 0usize;
    let mut search_from = 0usize;
    while let Some(rel) = lower[search_from..].find("uri=") {
        let abs = search_from + rel;
        result.push_str(&line[last..abs + 4]);
        let rest = &line[abs + 4..];
        let (uri, consumed) = parse_attr_value(rest);
        result.push('"');
        result.push_str(&rewrite_uri(uri, base_dir));
        result.push('"');
        last = abs + 4 + consumed;
        search_from = last;
    }
    result.push_str(&line[last..]);
    result
}

fn parse_attr_value(rest: &str) -> (&str, usize) {
    let lead = leading_ws_len(rest);
    let body = &rest[lead..];
    if let Some(stripped) = body.strip_prefix('"') {
        if let Some(end) = stripped.find('"') {
            return (&stripped[..end], lead + 1 + end + 1);
        }
    }
    if let Some(stripped) = body.strip_prefix('\'') {
        if let Some(end) = stripped.find('\'') {
            return (&stripped[..end], lead + 1 + end + 1);
        }
    }
    let end = body.find(',').unwrap_or(body.len());
    (body[..end].trim(), lead + end)
}

fn leading_ws_len(s: &str) -> usize {
    s.len() - s.trim_start().len()
}

fn rewrite_uri(uri: &str, base_dir: &Path) -> String {
    let uri = uri.trim();
    if uri.is_empty() {
        return String::new();
    }
    let lower = uri.to_ascii_lowercase();
    if lower.starts_with("http://")
        || lower.starts_with("https://")
        || lower.starts_with("data:")
        || lower.starts_with("/video?")
    {
        return uri.to_string();
    }
    let resolved = resolve_local(base_dir, uri);
    format!("/video?path={}", encode_path_query(&resolved.to_string_lossy()))
}

fn resolve_local(base_dir: &Path, uri: &str) -> PathBuf {
    let normalized = uri.replace('\\', "/");
    let path = PathBuf::from(&normalized);
    if path.is_absolute() {
        if path.exists() {
            return path;
        }
        let rel = normalized.trim_start_matches('/');
        return base_dir.join(rel);
    }
    base_dir.join(path)
}

fn encode_path_query(path: &str) -> String {
    let mut out = String::with_capacity(path.len() * 3);
    for &b in path.as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => out.push_str(&format!("%{b:02X}")),
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_n_m3u8dl_layout() {
        let entries = vec![
            DirName {
                name: "hls.cfg".into(),
                is_dir: false,
            },
            DirName {
                name: "index".into(),
                is_dir: true,
            },
            DirName {
                name: "index.m3u8".into(),
                is_dir: false,
            },
        ];
        assert!(looks_like_hls_package(&entries));
        assert_eq!(
            pick_playlist_name(&entries).as_deref(),
            Some("index.m3u8")
        );
    }

    #[test]
    fn ignores_ordinary_folder() {
        let entries = vec![
            DirName {
                name: "clips".into(),
                is_dir: true,
            },
            DirName {
                name: "readme.txt".into(),
                is_dir: false,
            },
        ];
        assert!(!looks_like_hls_package(&entries));
    }

    #[test]
    fn rewrites_relative_segments_and_key() {
        let playlist = PathBuf::from("/Movies/show/index.m3u8");
        let src = "#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key.key\"\n#EXTINF:4.0,\nindex/000.ts\n#EXT-X-ENDLIST\n";
        let out = rewrite_hls_playlist(src, &playlist);
        assert!(out.contains("/video?path="));
        assert!(out.contains("%2Findex%2F000.ts") || out.contains("index%2F000.ts"));
        assert!(out.contains("URI=\"/video?path="));
        assert!(!out.contains("\nindex/000.ts\n"));
    }

    #[test]
    fn keeps_remote_http_uri() {
        let playlist = PathBuf::from("/tmp/index.m3u8");
        let src = "#EXTM3U\nhttps://cdn.example.com/a.ts\n";
        let out = rewrite_hls_playlist(src, &playlist);
        assert!(out.contains("https://cdn.example.com/a.ts"));
    }
}
