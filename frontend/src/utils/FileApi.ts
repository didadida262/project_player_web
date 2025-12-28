const fs = require('fs')
const path = require('path')

export const getFileType = (filePath: string) => {
  const ext = path.extname(filePath).toLowerCase()
  if (fs.statSync(filePath).isDirectory()) {
    return 'directory'
  }

  switch (ext) {
    case '.pdf':
      return 'pdf'
    case '.doc':
    case '.docx':
      return 'word'
    case '.xls':
    case '.xlsx':
      return 'excel'
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif':
      return 'image'
    case '.mp4':
    case '.avi':
    case '.mov':
    case '.flv':
      return 'video'
    case '.mp3':
      return 'audio'
    default:
      return 'unknown'
  }
}
