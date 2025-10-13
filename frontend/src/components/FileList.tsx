import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import cn from 'classnames'
import { useEffect, useRef } from 'react'

export default function FileList() {
  const { sourcelist, currentFile } = useResources()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 当currentFile变化时，滚动到选中的文件
  useEffect(() => {
    if (currentFile.name && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedIndex = sourcelist.findIndex(file => file.name === currentFile.name)
      
      if (selectedIndex !== -1) {
        // 计算每个文件项的宽度（120px + 16px margin）
        const itemWidth = 136
        const scrollLeft = selectedIndex * itemWidth
        
        // 平滑滚动到选中项
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [currentFile.name, sourcelist])

  return (
    <div className="w-full h-full">
      <div
        ref={scrollContainerRef}
        className={cn('w-full h-full', 'overflow-x-auto')}
        style={{ 
          whiteSpace: 'nowrap',
          overflowY: 'visible' // 允许垂直方向显示悬浮卡片
        }}
      >
        {sourcelist.map((file: any, index: number) => (
          <FileItem file={file} key={index}></FileItem>
        ))}
      </div>
    </div>
  )
}
