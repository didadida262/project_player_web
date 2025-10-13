import { useEffect } from 'react'
import { useResources } from '../provider/resource-context'
import { motion } from 'framer-motion'

export default function ImgContainer() {
  const { currentfileurl } = useResources()

  return (
    <div className="w-full h-full flex justify-center items-center rounded-lg overflow-hidden border border-white/10 bg-black/40">
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
  )
}
