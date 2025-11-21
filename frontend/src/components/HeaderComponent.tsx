import { motion } from "framer-motion";
import { useState } from "react";
import { HiInformationCircle } from "react-icons/hi";
import { useResources } from "../provider/resource-context";
import SelectDir from "./SelectDir";

export default function HeaderComponent() {
  const { currentpath } = useResources();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative w-full h-[80px] overflow-visible">
      <div className="absolute inset-0 bg-gray-800"></div>

      <div className="relative z-10 flex items-center px-common h-full">
        <div className="flex items-center gap-2">
          <motion.span
            className="text-[35px] font-bold text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            Player
          </motion.span>
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="w-1 h-1 bg-purple-400 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
        </div>

        <div className="ml-auto flex items-center gap-x-3 relative">
          <SelectDir />
          <button
            onClick={() => setShowInfo((prev) => !prev)}
            className="flex items-center justify-center w-8 h-8 text-white hover:text-cyan-200 transition-colors focus:outline-none"
            aria-label="切换路径提示"
          >
            <HiInformationCircle className="w-6 h-6" />
          </button>
          {showInfo && (
            <div className="absolute bottom-[-70px] right-0 w-[320px] bg-black/80 border border-white/20 rounded shadow-xl p-3 text-[14px] text-white font-mono">
              <div className="text-cyan-400 mb-1">当前路径</div>
              <div className="truncate">{currentpath || "未选择路径"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
