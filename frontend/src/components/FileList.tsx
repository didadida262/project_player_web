import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import { useEffect, useRef } from 'react'

export default function FileList() {
  const { sourcelist, currentFile } = useResources()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (currentFile.name && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedElement = Array.from(container.children).find(
        (child) => (child as HTMLElement).dataset?.name === currentFile.name
      ) as HTMLElement | undefined

      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentFile.name, sourcelist])

  return (
    <div className="w-full h-full">
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto flex flex-col gap-3 pr-2"
      >
        {sourcelist.map((file: any, index: number) => (
          <FileItem file={file} key={index}></FileItem>
        ))}
      </div>
    </div>
  )
}
