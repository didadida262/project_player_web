use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

/// 空文件、截断文件、TS 冒充 MP4 等：系统/浏览器都解不开，列表阶段直接丢掉。
const MIN_MEDIA_BYTES: u64 = 16;
const MAX_ISO_BOXES: usize = 128;
const MPEG_TS_PACKET: u64 = 188;

pub fn is_playable_media_path(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if ext.is_empty() {
        return false;
    }

    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(_) => return false,
    };
    let file_size = match file.metadata() {
        Ok(m) => m.len(),
        Err(_) => return false,
    };

    is_playable_media(&mut file, file_size, &ext)
}

pub fn is_playable_media<R: Read + Seek>(reader: &mut R, file_size: u64, ext: &str) -> bool {
    match ext {
        "m3u8" => file_size >= 7 && peek_starts_with(reader, b"#EXTM3U"),
        "mp4" | "m4v" | "m4a" | "mov" | "3gp" => {
            file_size >= MIN_MEDIA_BYTES
                && !looks_like_mpeg_ts(reader, file_size)
                && iso_bmff_has_moov(reader, file_size)
        }
        "webm" | "mkv" => peek_starts_with(reader, &[0x1A, 0x45, 0xDF, 0xA3]),
        "flv" => peek_starts_with(reader, b"FLV"),
        "avi" => peek_riff(reader, b"AVI "),
        "wav" => peek_riff(reader, b"WAVE"),
        "mp3" => looks_like_mp3(reader, file_size),
        "ogg" => peek_starts_with(reader, b"OggS"),
        "flac" => peek_starts_with(reader, b"fLaC"),
        "aac" => looks_like_adts(reader),
        "wmv" | "wma" => looks_like_asf(reader),
        "mpg" | "mpeg" => looks_like_mpeg_ps(reader),
        _ => file_size >= MIN_MEDIA_BYTES,
    }
}

fn read_at<R: Read + Seek>(reader: &mut R, offset: u64, buf: &mut [u8]) -> bool {
    if reader.seek(SeekFrom::Start(offset)).is_err() {
        return false;
    }
    reader.read_exact(buf).is_ok()
}

fn peek_starts_with<R: Read + Seek>(reader: &mut R, magic: &[u8]) -> bool {
    let mut buf = vec![0u8; magic.len()];
    read_at(reader, 0, &mut buf) && buf == magic
}

fn peek_riff<R: Read + Seek>(reader: &mut R, form: &[u8; 4]) -> bool {
    let mut buf = [0u8; 12];
    read_at(reader, 0, &mut buf) && &buf[0..4] == b"RIFF" && &buf[8..12] == form
}

/// MPEG-TS：188 字节一包，同步字节 0x47。HLS 下载器常把 TS 存成 .mp4。
fn looks_like_mpeg_ts<R: Read + Seek>(reader: &mut R, file_size: u64) -> bool {
    if file_size < MPEG_TS_PACKET * 3 {
        return false;
    }
    let mut b = [0u8; 1];
    for i in 0..3 {
        if !read_at(reader, i * MPEG_TS_PACKET, &mut b) || b[0] != 0x47 {
            return false;
        }
    }
    true
}

/// 完整可播的 MP4/MOV：顶层必须有 moov（可在文件头或尾）。
/// 只有 ftyp/styp + moof 的 HLS 分片、以及截断下载（mdat 无 moov）都会被拒绝。
fn iso_bmff_has_moov<R: Read + Seek>(reader: &mut R, file_size: u64) -> bool {
    let mut offset: u64 = 0;
    for _ in 0..MAX_ISO_BOXES {
        if offset.saturating_add(8) > file_size {
            return false;
        }

        let mut header = [0u8; 16];
        if !read_at(reader, offset, &mut header[..8]) {
            return false;
        }

        let size32 = u32::from_be_bytes([header[0], header[1], header[2], header[3]]);
        let box_type = [header[4], header[5], header[6], header[7]];

        let (header_len, box_size) = if size32 == 1 {
            if offset.saturating_add(16) > file_size {
                return false;
            }
            if !read_at(reader, offset, &mut header) {
                return false;
            }
            let large = u64::from_be_bytes([
                header[8], header[9], header[10], header[11], header[12], header[13], header[14],
                header[15],
            ]);
            (16u64, large)
        } else if size32 == 0 {
            (8u64, file_size.saturating_sub(offset))
        } else {
            (8u64, u64::from(size32))
        };

        if box_size < header_len {
            return false;
        }
        // 盒子声明长度超出文件：截断/损坏
        if offset.saturating_add(box_size) > file_size {
            return false;
        }

        if &box_type == b"moov" {
            return true;
        }

        offset = offset.saturating_add(box_size);
        if offset >= file_size {
            return false;
        }
    }
    false
}

fn looks_like_mp3<R: Read + Seek>(reader: &mut R, file_size: u64) -> bool {
    if file_size < 4 {
        return false;
    }
    let mut buf = [0u8; 3];
    if !read_at(reader, 0, &mut buf) {
        return false;
    }
    if &buf == b"ID3" {
        return true;
    }
    buf[0] == 0xFF && buf[1] & 0xE0 == 0xE0
}

fn looks_like_adts<R: Read + Seek>(reader: &mut R) -> bool {
    let mut buf = [0u8; 2];
    read_at(reader, 0, &mut buf) && buf[0] == 0xFF && buf[1] & 0xF0 == 0xF0
}

fn looks_like_asf<R: Read + Seek>(reader: &mut R) -> bool {
    const ASF_HEADER: [u8; 16] = [
        0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0xA6, 0xD9, 0x00, 0xAA, 0x00, 0x62, 0xCE,
        0x6C,
    ];
    peek_starts_with(reader, &ASF_HEADER)
}

fn looks_like_mpeg_ps<R: Read + Seek>(reader: &mut R) -> bool {
    let mut buf = [0u8; 4];
    if !read_at(reader, 0, &mut buf) {
        return false;
    }
    buf == [0x00, 0x00, 0x01, 0xBA] || buf == [0x00, 0x00, 0x01, 0xB3]
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn box_of(typ: &[u8; 4], payload: &[u8]) -> Vec<u8> {
        let size = 8 + payload.len() as u32;
        let mut out = Vec::with_capacity(size as usize);
        out.extend_from_slice(&size.to_be_bytes());
        out.extend_from_slice(typ);
        out.extend_from_slice(payload);
        out
    }

    fn play(bytes: &[u8], ext: &str) -> bool {
        let mut cur = Cursor::new(bytes.to_vec());
        is_playable_media(&mut cur, bytes.len() as u64, ext)
    }

    #[test]
    fn rejects_empty_and_tiny() {
        assert!(!play(b"", "mp4"));
        assert!(!play(&[0u8; 8], "mp4"));
    }

    #[test]
    fn accepts_ftyp_plus_moov() {
        let mut data = box_of(b"ftyp", b"isom");
        data.extend_from_slice(&box_of(b"moov", &[0u8; 16]));
        assert!(play(&data, "mp4"));
        assert!(play(&data, "mov"));
        assert!(play(&data, "m4a"));
    }

    #[test]
    fn accepts_moov_after_mdat() {
        let mut data = box_of(b"ftyp", b"isom");
        data.extend_from_slice(&box_of(b"mdat", &[0u8; 64]));
        data.extend_from_slice(&box_of(b"moov", &[0u8; 16]));
        assert!(play(&data, "mp4"));
    }

    #[test]
    fn rejects_mp4_without_moov() {
        let mut data = box_of(b"ftyp", b"isom");
        data.extend_from_slice(&box_of(b"mdat", &[0u8; 64]));
        assert!(!play(&data, "mp4"));
    }

    #[test]
    fn rejects_truncated_mdat() {
        let mut data = box_of(b"ftyp", b"isom");
        // 声明 1MB mdat，实际只有几字节 → 截断下载
        data.extend_from_slice(&1_000_000u32.to_be_bytes());
        data.extend_from_slice(b"mdat");
        data.extend_from_slice(&[0u8; 8]);
        assert!(!play(&data, "mp4"));
    }

    #[test]
    fn rejects_mpeg_ts_named_mp4() {
        let mut ts = vec![0u8; 188 * 3];
        ts[0] = 0x47;
        ts[188] = 0x47;
        ts[376] = 0x47;
        assert!(!play(&ts, "mp4"));
    }

    #[test]
    fn accepts_common_containers() {
        assert!(play(b"#EXTM3U\n", "m3u8"));
        assert!(play(&[0x1A, 0x45, 0xDF, 0xA3, 0, 0, 0, 0], "webm"));
        assert!(play(b"FLV\x01\x00\x00\x00\x00\x00\x00\x00\x00", "flv"));
        let mut riff = Vec::from(*b"RIFF");
        riff.extend_from_slice(&0u32.to_le_bytes());
        riff.extend_from_slice(b"AVI ");
        riff.extend_from_slice(&[0u8; 8]);
        assert!(play(&riff, "avi"));
        assert!(play(b"ID3\x04\x00\x00\x00\x00\x00\x00", "mp3"));
    }

    #[test]
    fn rejects_random_bytes_as_mp4() {
        assert!(!play(b"this is not a video file!!!!", "mp4"));
    }
}
