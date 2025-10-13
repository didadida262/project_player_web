import { motion } from "framer-motion";
import { HiPlay, HiMusicNote, HiPhotograph, HiDocument } from "react-icons/hi";

interface IProps {}

export default function EmptyPlayer(props: IProps) {
  return (
    <motion.div 
      className="w-full h-full flex flex-col justify-center items-center bg-gradient-to-br from-gray-900/50 to-black/50 rounded-lg border border-white/10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 主图标 */}
      <motion.div
        className="mb-6"
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/20">
            <HiPlay className="text-4xl text-white/60" />
          </div>
          {/* 装饰性光晕 */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 animate-pulse"></div>
        </div>
      </motion.div>

      {/* 主标题 */}
      <motion.h2 
        className="text-2xl font-bold text-white/80 mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        待播放
      </motion.h2>

      {/* 副标题 */}
      <motion.p 
        className="text-white/50 text-center mb-8 max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        请从下方文件列表中选择一个文件开始播放
      </motion.p>

      {/* 支持的文件类型图标 */}
      <motion.div 
        className="flex gap-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <HiPlay className="text-xl text-red-400" />
          </div>
          <span className="text-xs text-white/40">视频</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <HiMusicNote className="text-xl text-green-400" />
          </div>
          <span className="text-xs text-white/40">音频</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <HiPhotograph className="text-xl text-blue-400" />
          </div>
          <span className="text-xs text-white/40">图片</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
            <HiDocument className="text-xl text-orange-400" />
          </div>
          <span className="text-xs text-white/40">文档</span>
        </div>
      </motion.div>

      {/* 装饰性元素 */}
      <motion.div 
        className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-400/60"
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          delay: 0.5
        }}
      />
      
      <motion.div 
        className="absolute bottom-4 left-4 w-1 h-1 rounded-full bg-purple-400/60"
        animate={{ 
          scale: [1, 2, 1],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          delay: 1
        }}
      />
    </motion.div>
  );
}
