import { motion } from "framer-motion";
import { useState } from "react";
import { HiInformationCircle } from "react-icons/hi";
import { useResources } from "../provider/resource-context";
import SelectDir from "./SelectDir";
import logoIsshin from "../../assets/logo_isshin_agent.png";

export default function HeaderComponent() {
  const { currentpath } = useResources();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="relative w-full h-14 overflow-visible">
      <div className="absolute inset-0 bg-gray-800"></div>

      <div className="relative z-10 flex items-center px-common h-full">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="h-9 w-9 shrink-0 rounded-lg overflow-hidden border border-cyan-400/40 bg-black/60 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <img
              src={logoIsshin}
              alt="Isshin Player"
              className="h-full w-full object-cover select-none"
              draggable={false}
            />
          </motion.div>
          <motion.span
            className="text-[18px] font-semibold text-white/90 tracking-wide"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Isshin Player
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
        </div>

        <div className="ml-auto flex items-center gap-x-3 relative">
          <SelectDir />
          <div
            className="relative"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
          >
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 text-white hover:text-cyan-200 transition-colors focus:outline-none"
              aria-label="路径与快捷键说明"
            >
              <HiInformationCircle className="w-6 h-6" />
            </button>
            {showInfo && (
              <div className="absolute top-[calc(100%+6px)] right-[calc(100%+8px)] w-[360px] bg-black/85 border border-white/20 rounded shadow-xl p-3 text-[13px] text-white font-mono backdrop-blur-md space-y-2">
                <div>
                  <div className="text-cyan-400 mb-1">当前路径</div>
                  <div className="truncate text-gray-200">
                    {currentpath || "未选择路径"}
                  </div>
                </div>
                <div>
                  <div className="text-cyan-400 mb-1">快捷键</div>
                  <ul className="space-y-1 text-gray-200">
                    <li>空格：播放 / 暂停</li>
                    <li>PageDown / ↓ ：下一首</li>
                    <li>PageUp / ↑ ：上一首</li>
                    <li>M ：切换播放模式</li>
                    <li>F ：全屏 / 退出全屏</li>
                    <li>双击视频：全屏</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
