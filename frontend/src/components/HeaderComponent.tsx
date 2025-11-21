import { motion } from "framer-motion";
import { useResources } from "../provider/resource-context";
import SelectDir from "./SelectDir";

export default function HeaderComponent() {
  const { currentpath } = useResources();

  return (
    <div className="relative w-full h-[80px] overflow-hidden">
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

        <div className="ml-auto flex items-center gap-x-3">
          <SelectDir />
          <div className="flex items-center gap-x-2 text-white text-[16px] font-mono bg-gradient-to-r from-cyan-500/20 to-blue-500/10 px-3 py-1 shadow-[inset_0_0_12px_rgba(0,0,0,0.4)]">
            <span className="text-cyan-400">当前路径：</span>
            <span className="truncate max-w-[280px]">{currentpath || "未选择路径"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
