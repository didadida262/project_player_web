import { useEffect, useRef, useState, type RefObject } from "react";
import {
  HiPlay,
  HiPause,
  HiOutlineSwitchHorizontal,
  HiOutlineSparkles,
  HiOutlineRefresh,
} from "react-icons/hi";
import {
  MdFullscreen,
  MdFullscreenExit,
  MdSkipNext,
  MdSkipPrevious,
} from "react-icons/md";
import cn from "classnames";
import VideoProgress from "./VideoProgress";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

const PLAY_MODE_META: Record<
  string,
  { label: string; icon: React.ReactElement }
> = {
  order: { label: "顺序播放", icon: <HiOutlineSwitchHorizontal size={16} /> },
  random: { label: "随机播放", icon: <HiOutlineSparkles size={16} /> },
  single: { label: "单曲循环", icon: <HiOutlineRefresh size={16} /> },
};

interface VideoControlsProps {
  videoRef: RefObject<HTMLVideoElement>;
  /** 换源标识，透传给进度条用于清零 */
  mediaKey: string;
  isPlaying: boolean;
  playbackRate: number;
  playMode: string;
  isFullscreen: boolean;
  visible: boolean;
  /** 画面较窄时收成纯图标，避免这一排被文字挤爆 */
  compact: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChangeRate: (rate: number) => void;
  onTogglePlayMode: () => void;
  onToggleFullscreen: () => void;
  /** 菜单展开、鼠标停留在控件栏上时置真，父级据此暂停自动隐藏 */
  onHoldVisibleChange: (hold: boolean) => void;
}

/** 幽灵图标按钮：静默时低亮度，hover 亮成主题青并起一圈辉光 */
function GhostButton({
  label,
  active,
  size = "md",
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  size?: "md" | "lg" | "xl";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200",
        "focus:outline-none active:scale-90",
        size === "xl" ? "h-12 w-12" : size === "lg" ? "h-10 w-10" : "h-8 w-8",
        active
          ? "bg-[#0acaff]/15 text-[#0acaff] shadow-[0_0_14px_rgba(10,202,255,0.28)]"
          : "text-white/65 hover:bg-white/10 hover:text-[#7ee7ff] hover:shadow-[0_0_14px_rgba(10,202,255,0.22)]",
      )}
    >
      {children}
    </button>
  );
}

/** 药丸按钮：承载带文字的倍速与播放模式 */
function PillButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3",
        "text-[12px] transition-all duration-200 focus:outline-none active:scale-95",
        active
          ? "border-[#0acaff]/60 bg-[#0acaff]/15 text-[#5fdcff] shadow-[0_0_14px_rgba(10,202,255,0.25)]"
          : "border-white/10 bg-white/5 text-white/70 hover:border-[#0acaff]/40 hover:bg-white/10 hover:text-[#7ee7ff]",
      )}
    >
      {children}
    </button>
  );
}

export default function VideoControls({
  videoRef,
  mediaKey,
  isPlaying,
  playbackRate,
  playMode,
  isFullscreen,
  visible,
  compact,
  onTogglePlay,
  onPrev,
  onNext,
  onChangeRate,
  onTogglePlayMode,
  onToggleFullscreen,
  onHoldVisibleChange,
}: VideoControlsProps) {
  const [rateMenuOpen, setRateMenuOpen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const rateMenuRef = useRef<HTMLDivElement>(null);

  // 控件栏淡出时把菜单一起收掉，否则会留在半透明的栏外面
  useEffect(() => {
    if (!visible) setRateMenuOpen(false);
  }, [visible]);

  // 悬停、拖拽进度、展开菜单期间都不允许父级自动隐藏控件栏
  useEffect(() => {
    onHoldVisibleChange(hovering || scrubbing || rateMenuOpen);
  }, [hovering, scrubbing, rateMenuOpen, onHoldVisibleChange]);

  useEffect(() => {
    if (!rateMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!rateMenuRef.current?.contains(event.target as Node)) {
        setRateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [rateMenuOpen]);

  const mode = PLAY_MODE_META[playMode] || PLAY_MODE_META.order;
  const rateLabel = Number.isInteger(playbackRate)
    ? `${playbackRate}.0x`
    : `${playbackRate}x`;

  return (
    <div
      className={cn(
        "absolute inset-x-0 bottom-0 z-30",
        "bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-12",
        "transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "relative flex flex-col gap-1 overflow-visible",
          "border-t border-white/10 px-3 py-2",
          "bg-[#0a0f18]/85 backdrop-blur-xl",
          "shadow-[0_-8px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]",
        )}
      >
        {/* 顶边一道青紫渐变细线，给整条栏定调 */}
        <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#0acaff]/70 to-transparent" />

        <VideoProgress
          videoRef={videoRef}
          mediaKey={mediaKey}
          onScrubbingChange={setScrubbing}
        />

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          {/* 左：倍速 / 播放模式 */}
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <div className="relative" ref={rateMenuRef}>
              <PillButton
                label="播放速度"
                active={rateMenuOpen || playbackRate !== 1}
                onClick={() => setRateMenuOpen((prev) => !prev)}
              >
                <span className="font-semibold tabular-nums tracking-wide">
                  {rateLabel}
                </span>
              </PillButton>

              {rateMenuOpen && (
                <div className="absolute bottom-[calc(100%+10px)] left-0 min-w-[96px] overflow-hidden rounded-xl border border-white/10 bg-[#0a0f18]/95 py-1 shadow-[0_12px_32px_rgba(0,0,0,0.7)] backdrop-blur-xl">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        onChangeRate(rate);
                        setRateMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-1.5 text-[12px]",
                        "transition-colors focus:outline-none",
                        rate === playbackRate
                          ? "bg-gradient-to-r from-[#0acaff]/25 to-transparent text-[#5fdcff]"
                          : "text-white/65 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <span className="tabular-nums">{rate}x</span>
                      {rate === 1 && (
                        <span className="text-[10px] text-white/30">正常</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {compact ? (
              <GhostButton
                label={`${mode.label}（M）`}
                onClick={onTogglePlayMode}
              >
                {mode.icon}
              </GhostButton>
            ) : (
              <PillButton
                label={`${mode.label}（M）`}
                onClick={onTogglePlayMode}
              >
                {mode.icon}
                <span>{mode.label}</span>
              </PillButton>
            )}
          </div>

          {/* 中：上一个 / 播放暂停 / 下一个 */}
          <div className="flex items-center gap-5 justify-self-center">
            <GhostButton
              label="上一个（↑ / PageUp）"
              size="xl"
              onClick={onPrev}
            >
              <MdSkipPrevious size={32} />
            </GhostButton>

            <GhostButton
              label={isPlaying ? "暂停（空格）" : "播放（空格）"}
              size="xl"
              onClick={onTogglePlay}
            >
              {isPlaying ? (
                <HiPause size={32} />
              ) : (
                <HiPlay size={32} className="ml-0.5" />
              )}
            </GhostButton>

            <GhostButton
              label="下一个（↓ / PageDown）"
              size="xl"
              onClick={onNext}
            >
              <MdSkipNext size={32} />
            </GhostButton>
          </div>

          {/* 右：全屏 */}
          <div className="flex items-center gap-2 justify-self-end">
            <GhostButton
              label={isFullscreen ? "退出全屏（Esc）" : "全屏（F）"}
              size="lg"
              onClick={onToggleFullscreen}
            >
              {isFullscreen ? (
                <MdFullscreenExit size={24} />
              ) : (
                <MdFullscreen size={24} />
              )}
            </GhostButton>
          </div>
        </div>
      </div>
    </div>
  );
}
