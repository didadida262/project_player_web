const fs = require("fs");
const path = require("path");

const MIN_MEDIA_BYTES = 16;
const MAX_ISO_BOXES = 128;
const MPEG_TS_PACKET = 188;

function isPlayableMediaFile(filePath) {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  if (!ext) return false;

  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const size = fs.fstatSync(fd).size;
    return isPlayableMedia(fd, size, ext);
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }
}

function isPlayableMedia(fd, fileSize, ext) {
  switch (ext) {
    case "m3u8":
      return fileSize >= 7 && startsWith(fd, Buffer.from("#EXTM3U"));
    case "mp4":
    case "m4v":
    case "m4a":
    case "mov":
    case "3gp":
      return (
        fileSize >= MIN_MEDIA_BYTES &&
        !looksLikeMpegTs(fd, fileSize) &&
        isoBmffHasMoov(fd, fileSize)
      );
    case "webm":
    case "mkv":
      return startsWith(fd, Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    case "flv":
      return startsWith(fd, Buffer.from("FLV"));
    case "avi":
      return peekRiff(fd, Buffer.from("AVI "));
    case "wav":
      return peekRiff(fd, Buffer.from("WAVE"));
    case "mp3":
      return looksLikeMp3(fd, fileSize);
    case "ogg":
      return startsWith(fd, Buffer.from("OggS"));
    case "flac":
      return startsWith(fd, Buffer.from("fLaC"));
    case "aac":
      return looksLikeAdts(fd);
    case "wmv":
    case "wma":
      return looksLikeAsf(fd);
    case "mpg":
    case "mpeg":
      return looksLikeMpegPs(fd);
    default:
      return fileSize >= MIN_MEDIA_BYTES;
  }
}

function readAt(fd, offset, length) {
  const buf = Buffer.alloc(length);
  const n = fs.readSync(fd, buf, 0, length, offset);
  return n === length ? buf : null;
}

function startsWith(fd, magic) {
  const buf = readAt(fd, 0, magic.length);
  return buf && buf.equals(magic);
}

function peekRiff(fd, form) {
  const buf = readAt(fd, 0, 12);
  return buf && buf.subarray(0, 4).equals(Buffer.from("RIFF")) && buf.subarray(8, 12).equals(form);
}

function looksLikeMpegTs(fd, fileSize) {
  if (fileSize < MPEG_TS_PACKET * 3) return false;
  for (let i = 0; i < 3; i++) {
    const buf = readAt(fd, i * MPEG_TS_PACKET, 1);
    if (!buf || buf[0] !== 0x47) return false;
  }
  return true;
}

function isoBmffHasMoov(fd, fileSize) {
  let offset = 0;
  for (let i = 0; i < MAX_ISO_BOXES; i++) {
    if (offset + 8 > fileSize) return false;
    const header8 = readAt(fd, offset, 8);
    if (!header8) return false;

    const size32 = header8.readUInt32BE(0);
    const boxType = header8.subarray(4, 8).toString("latin1");

    let headerLen;
    let boxSize;
    if (size32 === 1) {
      if (offset + 16 > fileSize) return false;
      const header16 = readAt(fd, offset, 16);
      if (!header16) return false;
      // JS 精度：用高 32 + 低 32 拼，本地文件不会超过 Number.MAX_SAFE_INTEGER
      const high = header16.readUInt32BE(8);
      const low = header16.readUInt32BE(12);
      boxSize = high * 0x100000000 + low;
      headerLen = 16;
    } else if (size32 === 0) {
      headerLen = 8;
      boxSize = fileSize - offset;
    } else {
      headerLen = 8;
      boxSize = size32;
    }

    if (boxSize < headerLen) return false;
    if (offset + boxSize > fileSize) return false;
    if (boxType === "moov") return true;

    offset += boxSize;
    if (offset >= fileSize) return false;
  }
  return false;
}

function looksLikeMp3(fd, fileSize) {
  if (fileSize < 4) return false;
  const buf = readAt(fd, 0, 3);
  if (!buf) return false;
  if (buf.equals(Buffer.from("ID3"))) return true;
  return buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0;
}

function looksLikeAdts(fd) {
  const buf = readAt(fd, 0, 2);
  return buf && buf[0] === 0xff && (buf[1] & 0xf0) === 0xf0;
}

function looksLikeAsf(fd) {
  const asf = Buffer.from([
    0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce,
    0x6c,
  ]);
  return startsWith(fd, asf);
}

function looksLikeMpegPs(fd) {
  const buf = readAt(fd, 0, 4);
  if (!buf) return false;
  return (
    buf.equals(Buffer.from([0x00, 0x00, 0x01, 0xba])) ||
    buf.equals(Buffer.from([0x00, 0x00, 0x01, 0xb3]))
  );
}

module.exports = {
  isPlayableMediaFile,
};
