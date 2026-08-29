import { useEffect, useRef, useState, type RefObject } from "react";
import cn from "classnames";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const pad = (n: number) => String(n).padStart(2, "0");
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

interface VideoProgressProps {
  videoRef: RefObject<HTMLVideoElement>;
  /** 换源标识：变化时把进度显示清零，避免残留上一个片源的位置 */
  mediaKey: string;
  onScrubbingChange: (scrubbing: boolean) => void;
}

export default function VideoProgress({
  videoRef,
  mediaKey,
  onScrubbingChange,
}: VideoProgressProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const seekRafRef = useRef<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(Number.NaN);
  const [bufferedEnd, setBufferedEnd] = useState(0);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncTime = () => setCurrentTime(video.currentTime);
    const syncDuration = () => setDuration(video.duration);
    const syncBuffered = () => {
      const { buffered } = video;
      setBufferedEnd(buffered.length > 0 ? buffered.end(buffered.length - 1) : 0);
    };
    const reset = () => {
      setCurrentTime(0);
      setDuration(Number.NaN);
      setBufferedEnd(0);
    };

    syncTime();
    syncDuration();
    syncBuffered();

    video.addEventListener("timeupdate", syncTime);
    video.addEventListener("seeking", syncTime);
    video.addEventListener("seeked", syncTime);
    video.addEventListener("durationchange", syncDuration);
    video.addEventListener("loadedmetadata", syncDuration);
    video.addEventListener("progress", syncBuffered);
    video.addEventListener("emptied", reset);
    return () => {
      video.removeEventListener("timeupdate", syncTime);
      video.removeEventListener("seeking", syncTime);
      video.removeEventListener("seeked", syncTime);
      video.removeEventListener("durationchange", syncDuration);
      video.removeEventListener("loadedmetadata", syncDuration);
      video.removeEventListener("progress", syncBuffered);
      video.removeEventListener("emptied", reset);
    };
  }, [videoRef, mediaKey]);

  useEffect(
    () => () => {
      if (seekRafRef.current !== null) cancelAnimationFrame(seekRafRef.current);
    },
    [],
  );

  const seekable = Number.isFinite(duration) && duration > 0;
  const playedRatio = dragRatio ?? (seekable ? currentTime / duration : 0);
  const bufferedRatio = seekable ? Math.min(1, bufferedEnd / duration) : 0;
  const displayTime = dragRatio !== null ? dragRatio * duration : currentTime;

  const ratioFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  // 拖拽时按帧节流写 currentTime：每次写入都会触发一次 Range 请求，逐事件写会卡
  const seekToRatio = (ratio: number) => {
    if (!seekable) return;
    if (seekRafRef.current !== null) return;
    seekRafRef.current = requestAnimationFrame(() => {
      seekRafRef.current = null;
      const video = videoRef.current;
      if (!video) return;
      try {
        video.currentTime = ratio * duration;
      } catch {
        // 元数据尚未就绪，忽略这次跳转
      }
    });
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!seekable) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const ratio = ratioFromClientX(event.clientX);
    setDragRatio(ratio);
    onScrubbingChange(true);
    seekToRatio(ratio);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const ratio = ratioFromClientX(event.clientX);
    setHoverRatio(ratio);
    if (dragRatio === null) return;
    setDragRatio(ratio);
    seekToRatio(ratio);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRatio === null) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragRatio(null);
    onScrubbingChange(false);
  };

  const toPercent = (ratio: number) => `${Math.min(1, Math.max(0, ratio)) * 100}%`;

  return (
    <div className="flex items-center gap-3 px-1">
      <span className="w-[52px] shrink-0 text-right text-[11px] tabular-nums text-white/55">
        {formatTime(displayTime)}
      </span>

      <div
        ref={trackRef}
        role="slider"
        aria-label="播放进度"
        aria-valuemin={0}
        aria-valuemax={seekable ? Math.floor(duration) : 0}
        aria-valuenow={Math.floor(displayTime) || 0}
        className={cn(
          "group/track relative flex h-4 flex-1 items-center touch-none select-none",
          seekable ? "cursor-pointer" : "cursor-default"
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setHoverRatio(null)}
      >
        <div className="relative h-[3px] w-full overflow-visible rounded-full bg-white/15 transition-[height] duration-150 group-hover/track:h-[5px]">
          {/* 已缓冲 */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/20"
            style={{ width: toPercent(bufferedRatio) }}
          />
          {/* 已播放 */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#5fdcff] to-[#7c5cff] shadow-[0_0_10px_rgba(10,202,255,0.55)]"
            style={{ width: toPercent(playedRatio) }}
          />
          {/* 拖拽手柄：静默时收起，hover 或拖拽时浮出 */}
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "bg-white shadow-[0_0_12px_rgba(10,202,255,0.9)] transition-transform duration-150",
              dragRatio !== null
                ? "scale-110"
                : "scale-0 group-hover/track:scale-100"
            )}
            style={{ left: toPercent(playedRatio) }}
          />
        </div>

        {hoverRatio !== null && seekable && (
          <span
            className="pointer-events-none absolute bottom-[calc(100%+6px)] -translate-x-1/2 rounded-md border border-white/10 bg-[#0a0f18]/95 px-1.5 py-0.5 text-[10px] tabular-nums text-white/80 shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
            style={{ left: toPercent(hoverRatio) }}
          >
            {formatTime(hoverRatio * duration)}
          </span>
        )}
      </div>

      <span className="w-[52px] shrink-0 text-[11px] tabular-nums text-white/40">
        {formatTime(duration)}
      </span>
    </div>
  );
}
