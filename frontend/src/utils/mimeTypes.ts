/**
 * 通用MIME类型定义
 * 统一前后端文件类型标准
 */

// 视频文件类型
export const VIDEO_MIME_TYPES = {
  MP4: 'video/mp4',
  AVI: 'video/x-msvideo',
  MOV: 'video/quicktime',
  WMV: 'video/x-ms-wmv',
  FLV: 'video/x-flv',
  MKV: 'video/x-matroska',
  WEBM: 'video/webm',
  M4V: 'video/x-m4v',
  '3GP': 'video/3gpp',
  MPG: 'video/mpeg',
  MPEG: 'video/mpeg',
  M3U8: 'application/vnd.apple.mpegurl',
  HLS: 'application/x-mpegURL'
} as const;

// 音频文件类型
export const AUDIO_MIME_TYPES = {
  MP3: 'audio/mpeg',
  WAV: 'audio/wav',
  FLAC: 'audio/flac',
  AAC: 'audio/aac',
  OGG: 'audio/ogg',
  M4A: 'audio/x-m4a',
  WMA: 'audio/x-ms-wma'
} as const;

// 图片文件类型
export const IMAGE_MIME_TYPES = {
  JPEG: 'image/jpeg',
  JPG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  BMP: 'image/bmp',
  WEBP: 'image/webp',
  SVG: 'image/svg+xml',
  TIFF: 'image/tiff'
} as const;

// 文档文件类型
export const DOCUMENT_MIME_TYPES = {
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
  RTF: 'application/rtf',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT: 'application/vnd.ms-powerpoint',
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
} as const;

// 压缩文件类型
export const ARCHIVE_MIME_TYPES = {
  ZIP: 'application/zip',
  RAR: 'application/vnd.rar',
  '7Z': 'application/x-7z-compressed',
  TAR: 'application/x-tar',
  GZ: 'application/gzip'
} as const;

// 所有MIME类型
export const ALL_MIME_TYPES = {
  ...VIDEO_MIME_TYPES,
  ...AUDIO_MIME_TYPES,
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  ...ARCHIVE_MIME_TYPES,
  // 特殊类型
  DIRECTORY: 'inode/directory',
  OCTET_STREAM: 'application/octet-stream'
} as const;

// 文件类型分类
export const FILE_TYPE_CATEGORIES = {
  VIDEO: 'video',
  AUDIO: 'audio',
  IMAGE: 'image',
  DOCUMENT: 'document',
  ARCHIVE: 'archive',
  DIRECTORY: 'directory',
  UNKNOWN: 'unknown'
} as const;

/**
 * 根据MIME类型获取文件分类
 */
export function getFileCategory(mimeType: string): string {
  if (!mimeType) return FILE_TYPE_CATEGORIES.UNKNOWN;
  
  const lowerMimeType = mimeType.toLowerCase();
  
  if (lowerMimeType.startsWith('video/')) {
    return FILE_TYPE_CATEGORIES.VIDEO;
  }
  if (lowerMimeType.startsWith('audio/')) {
    return FILE_TYPE_CATEGORIES.AUDIO;
  }
  if (lowerMimeType.startsWith('image/')) {
    return FILE_TYPE_CATEGORIES.IMAGE;
  }
  if (lowerMimeType.startsWith('text/') || 
      lowerMimeType.includes('document') || 
      lowerMimeType === ALL_MIME_TYPES.PDF) {
    return FILE_TYPE_CATEGORIES.DOCUMENT;
  }
  if (lowerMimeType.includes('zip') || 
      lowerMimeType.includes('rar') || 
      lowerMimeType.includes('7z') || 
      lowerMimeType.includes('tar') || 
      lowerMimeType.includes('gzip')) {
    return FILE_TYPE_CATEGORIES.ARCHIVE;
  }
  if (lowerMimeType === ALL_MIME_TYPES.DIRECTORY.toLowerCase()) {
    return FILE_TYPE_CATEGORIES.DIRECTORY;
  }
  
  return FILE_TYPE_CATEGORIES.UNKNOWN;
}

/**
 * 根据文件扩展名获取MIME类型
 */
export function getMimeTypeFromExtension(filename: string): string {
  if (!filename) return ALL_MIME_TYPES.OCTET_STREAM;
  
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return ALL_MIME_TYPES.OCTET_STREAM;
  
  // 扩展名到MIME类型的映射
  const extensionMap: Record<string, string> = {
    // 视频
    'mp4': VIDEO_MIME_TYPES.MP4,
    'avi': VIDEO_MIME_TYPES.AVI,
    'mov': VIDEO_MIME_TYPES.MOV,
    'wmv': VIDEO_MIME_TYPES.WMV,
    'flv': VIDEO_MIME_TYPES.FLV,
    'mkv': VIDEO_MIME_TYPES.MKV,
    'webm': VIDEO_MIME_TYPES.WEBM,
    'm4v': VIDEO_MIME_TYPES.M4V,
    '3gp': VIDEO_MIME_TYPES['3GP'],
    'mpg': VIDEO_MIME_TYPES.MPG,
    'mpeg': VIDEO_MIME_TYPES.MPEG,
    'm3u8': VIDEO_MIME_TYPES.M3U8,
    
    // 音频
    'mp3': AUDIO_MIME_TYPES.MP3,
    'wav': AUDIO_MIME_TYPES.WAV,
    'flac': AUDIO_MIME_TYPES.FLAC,
    'aac': AUDIO_MIME_TYPES.AAC,
    'ogg': AUDIO_MIME_TYPES.OGG,
    'm4a': AUDIO_MIME_TYPES.M4A,
    'wma': AUDIO_MIME_TYPES.WMA,
    
    // 图片
    'jpg': IMAGE_MIME_TYPES.JPG,
    'jpeg': IMAGE_MIME_TYPES.JPEG,
    'png': IMAGE_MIME_TYPES.PNG,
    'gif': IMAGE_MIME_TYPES.GIF,
    'bmp': IMAGE_MIME_TYPES.BMP,
    'webp': IMAGE_MIME_TYPES.WEBP,
    'svg': IMAGE_MIME_TYPES.SVG,
    'tiff': IMAGE_MIME_TYPES.TIFF,
    
    // 文档
    'pdf': DOCUMENT_MIME_TYPES.PDF,
    'doc': DOCUMENT_MIME_TYPES.DOC,
    'docx': DOCUMENT_MIME_TYPES.DOCX,
    'txt': DOCUMENT_MIME_TYPES.TXT,
    'rtf': DOCUMENT_MIME_TYPES.RTF,
    'xls': DOCUMENT_MIME_TYPES.XLS,
    'xlsx': DOCUMENT_MIME_TYPES.XLSX,
    'ppt': DOCUMENT_MIME_TYPES.PPT,
    'pptx': DOCUMENT_MIME_TYPES.PPTX,
    
    // 压缩文件
    'zip': ARCHIVE_MIME_TYPES.ZIP,
    'rar': ARCHIVE_MIME_TYPES.RAR,
    '7z': ARCHIVE_MIME_TYPES['7Z'],
    'tar': ARCHIVE_MIME_TYPES.TAR,
    'gz': ARCHIVE_MIME_TYPES.GZ
  };
  
  return extensionMap[extension] || ALL_MIME_TYPES.OCTET_STREAM;
}

/**
 * 检查是否为视频文件
 */
export function isVideoFile(mimeType: string): boolean {
  return getFileCategory(mimeType) === FILE_TYPE_CATEGORIES.VIDEO;
}

/**
 * 检查是否为音频文件
 */
export function isAudioFile(mimeType: string): boolean {
  return getFileCategory(mimeType) === FILE_TYPE_CATEGORIES.AUDIO;
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(mimeType: string): boolean {
  return getFileCategory(mimeType) === FILE_TYPE_CATEGORIES.IMAGE;
}

/**
 * 检查是否为文档文件
 */
export function isDocumentFile(mimeType: string): boolean {
  return getFileCategory(mimeType) === FILE_TYPE_CATEGORIES.DOCUMENT;
}

/**
 * 检查是否为目录
 */
export function isDirectory(mimeType: string): boolean {
  return getFileCategory(mimeType) === FILE_TYPE_CATEGORIES.DIRECTORY;
}
