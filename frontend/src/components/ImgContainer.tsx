import { useEffect } from 'react'
import { useResources } from '../provider/resource-context'
import { motion } from 'framer-motion'

export default function ImgContainer() {
  const { currentfileurl, currentFile } = useResources()

  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-lg overflow-hidden border border-white/10 bg-black/40">
      {/* 文件名显示区域 - 移到图片上方 */}
      {currentFile.name && (
        <div className="w-full h-[40px] px-4 py-2 bg-black/40 backdrop-blur-sm flex items-center rounded-t-lg overflow-hidden">
          <p className="text-white text-[14px] truncate w-full block" title={currentFile.name}>
            {currentFile.name}
          </p>
        </div>
      )}
      <div className="w-full h-[calc(100%_-_40px)] flex justify-center items-center">
        <motion.img
          src={currentfileurl}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain', // 关键属性：控制图片填充方式
          }}
          className="rounded-lg"
        />
      </div>
    </div>
  )
}
