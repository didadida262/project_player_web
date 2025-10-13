import { useEffect, useState } from 'react'
import { useResources } from '../provider/resource-context'
// import { Document, Page } from 'react-pdf'
// import { pdfjs } from 'react-pdf'
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

// // 配置PDF.js worker（必须）
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PdfContainer() {
  const { currentfileurl, currentFile } = useResources()
  const [numPages, setNumPages] = useState<number | null>(null)

  useEffect(() => {
    console.log('pdf_modules>>>', currentfileurl)
  }, [currentfileurl])

  return (
    <div className="w-full h-full flex flex-col justify-center items-center overflow-y-auto">
      {/* 文件名显示区域 - 移到PDF上方 */}
      {currentFile.name && (
        <div className="w-full h-[40px] px-4 py-2 bg-black/40 backdrop-blur-sm flex items-center rounded-t-lg overflow-hidden">
          <p className="text-white text-[14px] truncate w-full block" title={currentFile.name}>
            {currentFile.name}
          </p>
        </div>
      )}
      <div className="w-full h-[calc(100%_-_40px)] flex justify-center items-center">
        <iframe
          src={currentfileurl}
          width="100%"
          height="100%"
          title="PDF Viewer"
        />
      </div>
      {/* <Document
        file={currentfileurl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      >
        {Array.from({ length: numPages || 0 }, (_, i) => (
          <Page key={`page_${i + 1}`} pageNumber={i + 1} width={800} />
        ))}
      </Document> */}
    </div>
  )
}
