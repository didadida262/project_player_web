import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export const AuroraBackground = ({ className }: { className?: string }) => {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* 基础渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
      
      {/* 动态光晕层 */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 80% 20%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 40% 80%, #0891b2 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 20% 80%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 60% 20%, #0891b2 0%, transparent 50%)",
            "radial-gradient(circle at 40% 20%, #0891b2 0%, transparent 50%), radial-gradient(circle at 60% 80%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 90% 40%, #1e3a8a 0%, transparent 50%)",
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* 流动的光带 */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        animate={{
          background: [
            "linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
            "linear-gradient(225deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)",
            "linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
          ],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* 闪烁的星光 */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
