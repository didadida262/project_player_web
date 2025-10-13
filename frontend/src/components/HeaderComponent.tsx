import { motion } from "framer-motion";
import { BackgroundBeams } from "./ui/background-beams";

export default function HeaderComponent() {
  return (
    <div className="relative w-full h-[80px] overflow-hidden">
      {/* 深灰色背景 */}
      <div className="absolute inset-0 bg-gray-800"></div>
      
      {/* 动态光效 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
      </div>
      
      {/* 内容 */}
      <div className="relative z-10 flex items-center px-common h-full">
        <motion.span 
          className="text-[35px] font-bold text-white"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          Player
        </motion.span>
        
        {/* 装饰性元素 */}
        <motion.div 
          className="ml-4 w-2 h-2 bg-cyan-400 rounded-full"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="ml-1 w-1 h-1 bg-purple-400 rounded-full"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>
    </div>
  );
}
