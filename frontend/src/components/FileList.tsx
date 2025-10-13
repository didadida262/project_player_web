import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import cn from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi'

export default function FileList() {
  const { sourcelist, currentFile } = useResources()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 当currentFile变化时，滚动到选中的文件
  useEffect(() => {
    if (currentFile.name && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedIndex = sourcelist.findIndex(file => file.name === currentFile.name)
      
      if (selectedIndex !== -1) {
        // 计算每个文件项的宽度（100px + 10px margin）
        const itemWidth = 110
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
    <div className="w-full h-full flex flex-col">
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between px-[8px] py-[8px] cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-white text-[14px] font-medium">文件列表</span>
        <motion.div
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <HiChevronDown className="text-white text-[16px]" />
        </motion.div>
      </div>

      {/* 文件列表 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden flex-1"
          >
            <div
              ref={scrollContainerRef}
              className={cn('w-full h-full', 'overflow-x-auto')}
              style={{ whiteSpace: 'nowrap' }}
            >
              {sourcelist.map((file: any, index: number) => (
                <FileItem file={file} key={index}></FileItem>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
