import { useEffect, useState } from 'react'
import { useResources } from '../provider/resource-context'
// import { Document, Page } from 'react-pdf'
// import { pdfjs } from 'react-pdf'
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css'

// // 配置PDF.js worker（必须）
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function PdfContainer() {
  const { currentfileurl } = useResources()
  const [numPages, setNumPages] = useState<number | null>(null)

  useEffect(() => {
    console.log('pdf_modules>>>', currentfileurl)
  }, [currentfileurl])

  return (
    <div className="w-full h-full flex justify-center items-center overflow-y-auto">
      <iframe
        src={currentfileurl}
        width="100%"
        height="500px"
        title="PDF Viewer"
      />
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
