import { motion } from "framer-motion";

interface VideoLoadingProps {
  fileName?: string;
}

export default function VideoLoading({ fileName }: VideoLoadingProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-lg bg-black"
      role="status"
      aria-live="polite"
      aria-label="视频加载中"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(8,47,73,0.55)_0%,transparent_62%)]" />
      <motion.div
        className="pointer-events-none absolute -left-1/3 top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent"
        animate={{ x: ["0%", "280%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"
        animate={{ top: ["12%", "88%", "12%"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex flex-col items-center gap-5 px-6">
        <div className="relative h-[108px] w-[108px]">
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/20"
            animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.08, 0.35] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-[6px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0%, #22d3ee 38%, transparent 55%, #c084fc 88%, transparent 100%)",
              maskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
              WebkitMaskImage:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[16px] rounded-full border border-purple-400/35"
            animate={{ rotate: -360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            style={{
              borderTopColor: "rgba(192,132,252,0.95)",
              borderRightColor: "transparent",
            }}
          />
          <div className="absolute inset-[28px] flex items-center justify-center rounded-full bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.35)]">
            <motion.div
              className="h-3 w-3 rounded-full bg-gradient-to-br from-cyan-300 to-purple-400"
              animate={{ scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 text-[13px] font-medium tracking-[0.28em] text-cyan-200/90">
            <span>加载中</span>
            <span className="flex w-6 justify-start">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  animate={{ opacity: [0.15, 1, 0.15] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.18,
                  }}
                >
                  .
                </motion.span>
              ))}
            </span>
          </div>
          {fileName ? (
            <div
              className="max-w-[240px] truncate text-[11px] text-white/35"
              title={fileName}
            >
              {fileName}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
