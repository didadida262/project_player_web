const fs = require("fs");
const path = require("path");

const PLAYLIST_MIME = "application/vnd.apple.mpegurl";
const PREFERRED_PLAYLISTS = ["index.m3u8", "master.m3u8", "playlist.m3u8"];

function findHlsPlaylist(dirPath) {
  let names;
  try {
    names = fs.readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      isDir: entry.isDirectory(),
    }));
  } catch {
    return null;
  }
  if (!looksLikeHlsPackage(names)) return null;
  const playlistName = pickPlaylistName(names);
  if (!playlistName) return null;
  const playlist = path.join(dirPath, playlistName);
  try {
    if (!fs.statSync(playlist).isFile()) return null;
  } catch {
    return null;
  }
  return playlist;
}

function looksLikeHlsPackage(entries) {
  const hasM3u8 = entries.some(
    (e) => !e.isDir && e.name.toLowerCase().endsWith(".m3u8"),
  );
  if (!hasM3u8) return false;
  const hasCfg = entries.some((e) => e.name.toLowerCase() === "hls.cfg");
  const hasTs = entries.some((e) => {
    if (e.isDir) return false;
    const lower = e.name.toLowerCase();
    return lower.endsWith(".ts") || lower.endsWith(".m2ts") || lower.endsWith(".mts");
  });
  const hasSegmentDir = entries.some(
    (e) =>
      e.isDir &&
      ["index", "ts", "segments", "video"].includes(e.name.toLowerCase()),
  );
  return hasCfg || hasTs || hasSegmentDir;
}

function pickPlaylistName(entries) {
  const m3u8 = entries
    .filter((e) => !e.isDir && e.name.toLowerCase().endsWith(".m3u8"))
    .map((e) => e.name);
  if (m3u8.length === 0) return null;
  for (const preferred of PREFERRED_PLAYLISTS) {
    const hit = m3u8.find((n) => n.toLowerCase() === preferred);
    if (hit) return hit;
  }
  m3u8.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  return m3u8[0];
}

function isM3u8Path(filePath) {
  return path.extname(filePath).toLowerCase() === ".m3u8";
}

function streamContentType(filePath) {
  const ext = path.extname(filePath).replace(".", "").toLowerCase();
  if (ext === "m3u8") return PLAYLIST_MIME;
  if (ext === "ts" || ext === "m2ts" || ext === "mts") return "video/MP2T";
  return null;
}

function rewriteHlsPlaylist(content, playlistPath) {
  const baseDir = path.dirname(playlistPath);
  return content
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) return rewriteDirectiveUris(line, baseDir);
      return rewriteUri(trimmed, baseDir);
    })
    .join("\n") + (content.endsWith("\n") ? "" : "");
}

function rewriteDirectiveUris(line, baseDir) {
  if (!line.toLowerCase().includes("uri=")) return line;
  let result = "";
  let last = 0;
  const lower = line.toLowerCase();
  let searchFrom = 0;
  while (true) {
    const rel = lower.indexOf("uri=", searchFrom);
    if (rel < 0) break;
    result += line.slice(last, rel + 4);
    const rest = line.slice(rel + 4);
    const { uri, consumed } = parseAttrValue(rest);
    result += `"${rewriteUri(uri, baseDir)}"`;
    last = rel + 4 + consumed;
    searchFrom = last;
  }
  result += line.slice(last);
  return result;
}

function parseAttrValue(rest) {
  const leadMatch = rest.match(/^\s*/);
  const lead = leadMatch ? leadMatch[0].length : 0;
  const body = rest.slice(lead);
  if (body.startsWith('"')) {
    const end = body.indexOf('"', 1);
    if (end >= 0) {
      return { uri: body.slice(1, end), consumed: lead + end + 1 };
    }
  }
  if (body.startsWith("'")) {
    const end = body.indexOf("'", 1);
    if (end >= 0) {
      return { uri: body.slice(1, end), consumed: lead + end + 1 };
    }
  }
  const comma = body.indexOf(",");
  const end = comma >= 0 ? comma : body.length;
  return { uri: body.slice(0, end).trim(), consumed: lead + end };
}

function rewriteUri(uri, baseDir) {
  const trimmed = String(uri || "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("data:") ||
    lower.startsWith("/video?")
  ) {
    return trimmed;
  }
  const resolved = resolveLocal(baseDir, trimmed);
  return `/video?path=${encodeURIComponent(resolved)}`;
}

function resolveLocal(baseDir, uri) {
  const normalized = uri.replace(/\\/g, "/");
  if (path.isAbsolute(normalized)) {
    if (fs.existsSync(normalized)) return normalized;
    return path.join(baseDir, normalized.replace(/^\/+/, ""));
  }
  return path.join(baseDir, normalized);
}

module.exports = {
  PLAYLIST_MIME,
  findHlsPlaylist,
  isM3u8Path,
  streamContentType,
  rewriteHlsPlaylist,
};
