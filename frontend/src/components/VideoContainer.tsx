import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useResources } from "../provider/resource-context";
import Hls from "hls.js";
import flvjs from "flv.js";
import { isVideoFile } from "../utils/mimeTypes";
import {
  HiOutlineSwitchHorizontal,
  HiOutlineSparkles,
  HiOutlineRefresh,
  HiOutlinePlay,
  HiOutlineFolderOpen,
  HiOutlineTrash,
} from "react-icons/hi";
import { MdFullscreen } from "react-icons/md";
import customToast from "./customToast";
import VideoLoading from "./VideoLoading";

async function getTauriWindow() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return getCurrentWindow();
  } catch {
    return null;
  }
}

/** 尝试系统级窗口全屏；失败时至少 maximize，保证画面尽量占满屏 */
async function setOsFullscreen(on: boolean) {
  const win = await getTauriWindow();
  if (!win) return false;

  try {
    if (on) {
      // macOS 上 simple fullscreen / 标准 fullscreen 兼容性不一，两个都试
      try {
        await (win as any).setSimpleFullscreen?.(true);
      } catch {
        // optional
      }
      await win.setFullscreen(true);
    } else {
      try {
        await (win as any).setSimpleFullscreen?.(false);
      } catch {
        // optional
      }
      await win.setFullscreen(false);
    }
    return true;
    } catch (err) {
    console.error("setFullscreen failed:", err);
    try {
      if (on) await win.maximize();
      // 退出时不要 unmaximize：用户自己拖满/系统最大化的窗口会被打回小窗
      return on;
    } catch (err2) {
      console.error("maximize fallback failed:", err2);
      return false;
    }
  }
}

/**
 * Blink：首帧自动播放时原生阴影控件常用过时的盒宽排版，控制条会「变短」；
 * 点击 video 会触发布局而恢复。这里用亚像素宽度抖动 + 强制 layout 诱发同一条修复路径，避免依赖用户点击。
 */
function nudgeNativeMediaControlsLayout(video: HTMLVideoElement | null) {
  if (!video) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const widthStr = video.style.width;
      const w = parseFloat(widthStr);
      if (Number.isFinite(w) && widthStr.endsWith("px")) {
        video.style.width = `${w - 0.25}px`;
        void video.offsetWidth;
        video.style.width = widthStr;
      }
      void video.offsetWidth;
      void video.getBoundingClientRect();
    });
  });
}

export default function VideoContainer() {
  const {
    currentfileurl,
    palyerMode,
    setPalyerMode,
    currentFile,
    selectFile,
    setCurrentFile,
    setcurrentfileurl,
    getNextVideo,
    sourcelist,
    setSourcelist,
    prevStack,
    setPrevStack,
  } = useResources();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** 当前文件的真实宽高比；换源前为 null，避免沿用旧比例导致框比画面宽、原生控制条与画面不齐 */
  const [videoRatio, setVideoRatio] = useState<number | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isFullscreenRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);
  const flvPlayerRef = useRef<flvjs.Player | null>(null);
  /** 当前已可播的片源 key；与 mediaKey 不一致时视为加载中，换源当帧就能盖住原生控件 */
  const [readyMediaKey, setReadyMediaKey] = useState<string | null>(null);
  const [mediaFailed, setMediaFailed] = useState(false);

  isFullscreenRef.current = isFullscreen;

  const mediaKey = `${currentFile.name || ""}::${currentfileurl || ""}`;
  const isVideoLoading = Boolean(currentfileurl) && readyMediaKey !== mediaKey && !mediaFailed;

  /** 全屏后壳层被 display:none，焦点常留在隐藏搜索框/按钮或原生 video 上，导致快捷键失效 */
  const reclaimKeyboardFocus = () => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && typeof active.blur === "function") {
      active.blur();
    }
    videoRef.current?.blur();
    containerRef.current?.focus({ preventScroll: true });
  };

  const handleToggleFullscreen = async () => {
    const video = videoRef.current;
    const wasPlaying = !!video && !video.paused;
    const next = !isFullscreenRef.current;
    setIsFullscreen(next);
    isFullscreenRef.current = next;
    document.documentElement.classList.toggle("player-fs", next);
    await setOsFullscreen(next);
    // 布局变化后恢复播放（不移动 video 节点，避免断流），并夺回键盘焦点
    requestAnimationFrame(() => {
      nudgeNativeMediaControlsLayout(video);
      const finish = () => {
        if (next) reclaimKeyboardFocus();
      };
      if (wasPlaying && video) {
        video.play().then(finish).catch(finish);
      } else {
        finish();
      }
    });
  };

  const handlePlayMode = () => {
    const next =
      palyerMode === "order"
        ? "random"
        : palyerMode === "random"
        ? "single"
        : "order";
    setPalyerMode(next);
  };
  const handleRevealInFolder = async () => {
    const filePath = currentFile?.path;
    if (!filePath || typeof filePath !== "string") {
      customToast.error("无法获取文件路径");
      return;
    }
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{ ok: boolean; error?: string }>(
        "show_item_in_folder",
        { path: filePath },
      );
      if (!result?.ok) {
        customToast.error(result?.error || "打开文件夹失败");
      }
    } catch {
      customToast.info("请在桌面版（Tauri）中使用此功能");
    }
  };

  const handleDeleteLocalFile = async () => {
    const filePath = currentFile?.path;
    const fileName = currentFile?.name;
    if (!filePath || typeof filePath !== "string") {
      customToast.error("无法获取文件路径");
      return;
    }

    const restoreFile = { ...currentFile };

    // 先释放文件占用，避免删除时被播放器占用（尤其 Windows）
    try {
      const video = videoRef.current;
      video?.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
      if (video) {
        video.removeAttribute("src");
      }
    } catch {
      // ignore cleanup errors
    }

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<{
        ok: boolean;
        cancelled?: boolean;
        error?: string;
      }>("delete_local_file", { path: filePath });

      if (result?.cancelled) {
        // 取消删除：清空后再设回，强制重新挂载片源
        setcurrentfileurl("");
        queueMicrotask(() => selectFile(restoreFile));
        return;
      }

      if (!result?.ok) {
        customToast.error(result?.error || "删除失败");
        setcurrentfileurl("");
        queueMicrotask(() => selectFile(restoreFile));
        return;
      }

      const remaining = sourcelist.filter(
        (item: any) => item.path !== filePath && item.name !== fileName,
      );
      setSourcelist(remaining);
      setPrevStack(
        (prevStack || []).filter(
          (item) => item.path !== filePath && item.name !== fileName,
        ),
      );

      if (remaining.length === 0) {
        setCurrentFile({});
        setcurrentfileurl("");
      } else {
        const deletedIndex = sourcelist.findIndex(
          (item: any) => item.path === filePath || item.name === fileName,
        );
        const nextIndex =
          deletedIndex >= 0
            ? Math.min(deletedIndex, remaining.length - 1)
            : 0;
        setCurrentFile(remaining[nextIndex]);
      }

      customToast.success("已删除本地资源");
    } catch {
      setcurrentfileurl("");
      queueMicrotask(() => selectFile(restoreFile));
      customToast.info("请在桌面版（Tauri）中使用此功能");
    }
  };

  const handleNext = () => {
    if (palyerMode === "single") {
      // 单曲循环：直接重播当前视频
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(console.error);
      }
      return;
    }
    if (currentFile?.name) {
      setPrevStack([...(prevStack || []), currentFile]);
    }
    const nextFile = getNextVideo();
    if (nextFile) {
      setCurrentFile(nextFile);
    }
  };
  const handlePrev = () => {
    if (!prevStack || prevStack.length === 0) {
      if (sourcelist.length === 0) return;
      // 回退栈为空时，顺序回退一首（降级行为）
      const currentIndex = sourcelist.findIndex(
        (item: any) => item.name === currentFile.name,
      );
      let prevIndex = currentIndex - 1;
      if (prevIndex < 0) prevIndex = sourcelist.length - 1;
      const prevFile = sourcelist[prevIndex];
      if (prevFile) {
        setCurrentFile(prevFile);
      }
      return;
    }
    const cloned = [...prevStack];
    const prevFile = cloned.pop();
    setPrevStack(cloned);
    if (prevFile) {
      setCurrentFile(prevFile);
    }
  };

  // 处理HLS流和FLV文件
  useEffect(() => {
    if (!currentfileurl || !videoRef.current) return;

    const video = videoRef.current;
    const isM3u8 = currentFile.type?.includes('mpegurl') || 
                   currentFile.name?.toLowerCase().endsWith('.m3u8') || 
                   currentfileurl.includes('.m3u8');
    const isFlv = currentFile.type === 'video/x-flv' || 
                  currentFile.name?.toLowerCase().endsWith('.flv') || 
                  currentfileurl.includes('.flv');

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }

    setMediaFailed(false);

    // 只摘掉旧 src，不要 video.load()：空 src 的 load 会异步打出 MEDIA_ERR_SRC_NOT_SUPPORTED，
    // 和随后的 HLS 接管抢跑，控制条就会随机出现 Error
    video.pause();
    video.removeAttribute("src");

    if (isM3u8) {
      const nativeHls =
        /Apple Computer/.test(navigator.vendor) &&
        !!video.canPlayType("application/vnd.apple.mpegurl");

      if (nativeHls) {
        video.src = currentfileurl;
        video.play().catch(console.error);
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        hls.loadSource(currentfileurl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (hlsRef.current !== hls) return;
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (hlsRef.current !== hls) return;
          console.error("HLS error:", data);
          if (!data.fatal) return;
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (hlsRef.current === hls) hlsRef.current = null;
              setMediaFailed(true);
              break;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = currentfileurl;
        video.play().catch(console.error);
      } else {
        console.error("HLS is not supported in this browser");
        setMediaFailed(true);
      }
    } else if (isFlv) {
      // 处理FLV文件
      if (flvjs.isSupported()) {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: currentfileurl,
        });
        flvPlayer.attachMediaElement(video);
        flvPlayer.load();
        flvPlayerRef.current = flvPlayer;

        // 播放准备就绪后自动播放
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(console.error);
        });
      } else {
        console.error('FLV is not supported in this browser');
      }
    } else {
      // 普通视频文件（如MP4）
      video.src = currentfileurl;
    }

    // 清理函数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
    };
  }, [currentfileurl, currentFile.name, currentFile.type]);

  useEffect(() => {
    setVideoRatio(null);
  }, [currentfileurl, currentFile.name]);

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile]);

  // 全屏时用视口尺寸排版视频；退出时恢复容器测量
  useEffect(() => {
    if (!isFullscreen) return;
    const update = () => {
      setContainerSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isFullscreen]);

  // 仅在「播放器全屏」态卸载时退出系统全屏；切分类导致 VideoContainer 卸载不应动窗口尺寸
  useEffect(() => {
    return () => {
      const wasPlayerFs = isFullscreenRef.current;
      document.documentElement.classList.remove("player-fs");
      if (wasPlayerFs) {
        void setOsFullscreen(false);
      }
    };
  }, []);

  // 添加键盘快捷键监听
  useEffect(() => {
    const isEditable = (el: HTMLElement | null) => {
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        el.getAttribute("contenteditable") === "true"
      );
    };
    const isVisible = (el: HTMLElement | null) => {
      if (!el) return false;
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      // 焦点落在被全屏 CSS 隐藏的输入框时，先夺回焦点再处理快捷键
      if (isEditable(active) && !isVisible(active)) {
        active?.blur();
        containerRef.current?.focus({ preventScroll: true });
      } else if (isEditable(active) || isEditable(event.target as HTMLElement | null)) {
        // 真正在可见输入框里打字时不抢快捷键
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      const fullscreen = isFullscreenRef.current;
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();

      // Esc 退出应用内全屏
      if (fullscreen && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsFullscreen(false);
        isFullscreenRef.current = false;
        document.documentElement.classList.remove("player-fs");
        void setOsFullscreen(false);
        return;
      }

      // 左右方向键：快进/后退（支持全屏模式）
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        // 非全屏且焦点在 video 上时，交给原生控件；全屏下原生控件易吞键，改为手动处理
        if (!fullscreen && tag === "video") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const seekStep = 10;
        const currentTime = video.currentTime;
        const duration = video.duration;

        if (event.key === "ArrowLeft") {
          video.currentTime = Math.max(0, currentTime - seekStep);
        } else {
          video.currentTime = Math.min(duration, currentTime + seekStep);
        }
        return;
      }

      // 空格：播放/暂停
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        if (video.paused) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
        return;
      }

      // 切换模式：M/m
      if (event.key === "m" || event.key === "M") {
        event.preventDefault();
        handlePlayMode();
        return;
      }

      // 全屏：F/f
      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        void handleToggleFullscreen();
        return;
      }

      // 下一首：PageDown / ArrowDown
      if (event.key === "PageDown" || event.key === "ArrowDown") {
        event.preventDefault();
        event.stopPropagation();
        handleNext();
        return;
      }
      // 上一首：PageUp / ArrowUp
      if (event.key === "PageUp" || event.key === "ArrowUp") {
        event.preventDefault();
        event.stopPropagation();
        handlePrev();
      }
    };

    // 用 window + capture，避免全屏后焦点落在 video/隐藏节点时 document 监听不稳定
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [currentFile, palyerMode, sourcelist, prevStack]);

  const displayFileName = currentFile.name
    ? currentFile.name.replace(/\.[^/.]+$/, "")
    : "";

  useEffect(() => {
    if (!videoRef.current) return;
    const handleLoadedMetadata = () => {
      if (videoRef.current?.videoWidth && videoRef.current.videoHeight) {
        setVideoRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
        // 视频元数据加载后，强制更新一次容器尺寸，确保计算正确
        if (containerRef.current) {
          requestAnimationFrame(() => {
            if (containerRef.current) {
              setContainerSize({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight,
              });
            }
          });
        }
      }
    };

    const videoEl = videoRef.current;
    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentFile]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateContainerSize = () => {
      if (containerRef.current) {
        // 直接获取尺寸，不使用 requestAnimationFrame，确保立即更新
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        // 只有当尺寸有效时才更新，避免设置为 0
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    };
    
    // 立即获取初始尺寸，使用双重 requestAnimationFrame 确保在布局完成后获取
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateContainerSize();
      });
    });
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    resizeObserver.observe(containerRef.current);
    
    // 监听窗口大小变化，确保最大化/最小化/拖拽时都能触发
    // 使用 requestAnimationFrame 确保在布局完成后获取准确尺寸
    let rafId: number | null = null;
    const handleWindowResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          updateContainerSize();
          rafId = null;
        });
      });
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // 盒宽或片源比例变化后，在提交到 DOM 的同一轮末尾推一把原生控件排版（修复首帧截断）
  useLayoutEffect(() => {
    nudgeNativeMediaControlsLayout(videoRef.current);
  }, [
    containerSize.width,
    containerSize.height,
    videoRatio,
    currentfileurl,
  ]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => nudgeNativeMediaControlsLayout(v);
    v.addEventListener("playing", onPlaying);
    return () => v.removeEventListener("playing", onPlaying);
  }, [currentfileurl]);

  // 根据容器尺寸和视频宽高比计算最佳显示尺寸，尽可能填满容器
  const calculateVideoSize = (): CSSProperties => {
    // 未拿到当前片源宽高比或容器未就绪时：只限制最大边，由 object-fit: contain 适配；
    // 固定像素宽高必须在比例正确时再用，否则原生控制条会铺满「错比例的框」，与画面宽度不一致
    if (!containerSize.width || !containerSize.height || videoRatio == null) {
      return {
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain",
        display: "block",
      };
    }
    
    const containerAspectRatio = containerSize.width / containerSize.height;
    
    let width: number;
    let height: number;
    
    // 如果容器比视频更宽（容器宽高比 > 视频宽高比），高度填满，宽度按比例
    if (containerAspectRatio > videoRatio) {
      height = containerSize.height;
      width = height * videoRatio;
    } else {
      // 如果容器比视频更高（容器宽高比 <= 视频宽高比），宽度填满，高度按比例
      width = containerSize.width;
      height = width / videoRatio;
    }
    
    // 确保不超过容器尺寸（双重保险）
    width = Math.min(width, containerSize.width);
    height = Math.min(height, containerSize.height);
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      // 框已与片源比例一致；contain 在比例精确时铺满框，取整略有偏差时比 fill 更不易拉变形
      objectFit: "contain",
      display: "block",
    };
  };

  const videoStyle: CSSProperties = isFullscreen
    ? {
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        display: "block",
        backgroundColor: "#000",
      }
    : calculateVideoSize();

  return (
    <div className="w-full h-full min-w-0 flex flex-col bg-black">
      {currentFile.name && (
        <div className="video-fs-title w-full px-4 py-2 flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1 overflow-hidden flex items-center justify-start">
            <span
              className="inline-block max-w-full truncate text-left text-[16px] font-semibold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
              title={currentFile.name}
              style={{ letterSpacing: "0.5px" }}
            >
              {displayFileName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRevealInFolder}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md text-cyan-200/90 hover:text-cyan-100 hover:bg-white/10 transition-colors focus:outline-none"
            title="在访达/资源管理器中显示此文件"
            aria-label="在文件夹中显示当前视频"
          >
            <HiOutlineFolderOpen className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={handleDeleteLocalFile}
            className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-md text-rose-300/90 hover:text-rose-200 hover:bg-rose-500/15 transition-colors focus:outline-none"
            title="删除本地资源"
            aria-label="删除当前本地资源"
          >
            <HiOutlineTrash className="w-6 h-6" />
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        tabIndex={-1}
        className="video native-video-host w-full min-h-0 min-w-0 flex-1 selectedG relative flex justify-center items-center rounded-lg outline-none"
      >
        {isVideoLoading && <VideoLoading fileName={displayFileName} />}
        {mediaFailed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/85 text-cyan-100/80">
            <span className="text-[14px] tracking-wide">无法播放此资源</span>
            <span className="max-w-[70%] truncate text-[11px] text-white/40">
              {displayFileName}
            </span>
          </div>
        )}
        <video
          ref={videoRef}
          muted={false}
          tabIndex={-1}
          className="outline-none focus:outline-none focus:ring-0 focus:border-0"
          autoPlay={
            !(
              currentFile.type?.includes("mpegurl") ||
              currentFile.name?.toLowerCase().endsWith(".m3u8")
            )
          }
          controls={!isVideoLoading && !mediaFailed}
          playsInline
          style={{
            ...videoStyle,
            opacity: isVideoLoading || mediaFailed ? 0 : 1,
            pointerEvents: isVideoLoading || mediaFailed ? "none" : "auto",
          }}
          onEnded={handleNext}
          onCanPlay={() => {
            if (!videoRef.current?.error) setReadyMediaKey(mediaKey);
          }}
          onPlaying={() => setReadyMediaKey(mediaKey)}
          onLoadedData={() => {
            if (!videoRef.current?.error) setReadyMediaKey(mediaKey);
          }}
          onError={() => {
            const el = videoRef.current;
            const code = el?.error?.code;
            if (!el || !code || code === MediaError.MEDIA_ERR_ABORTED) return;
            if (!el.currentSrc && !hlsRef.current) return;
            setMediaFailed(true);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            void handleToggleFullscreen();
          }}
          onKeyDown={(e) => {
            if (e.code === "Space" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
      </div>
      <div className="video-fs-ops operation w-full h-[50px] flex justify-start items-center gap-x-[10px]">
        <button
          type="button"
          onClick={handlePlayMode}
          className="px-4 py-2 text-[15px] h-9 rounded text-white hover:opacity-90 transition-[background-color,opacity] flex items-center gap-2 justify-center focus:outline-none"
          style={{
            backgroundColor:
              palyerMode === "order"
                ? "#3b82f6"
                : palyerMode === "random"
                ? "#f59e0b"
                : "#8b5cf6",
            "--hover-color":
              palyerMode === "order"
                ? "#2563eb"
                : palyerMode === "random"
                ? "#d97706"
                : "#7c3aed",
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              (e.currentTarget.style as any)["--hover-color"] || "#2563eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              palyerMode === "order"
                ? "#3b82f6"
                : palyerMode === "random"
                ? "#f59e0b"
                : "#8b5cf6";
          }}
        >
          {palyerMode === "order" && <HiOutlineSwitchHorizontal size={18} />}
          {palyerMode === "random" && <HiOutlineSparkles size={18} />}
          {palyerMode === "single" && <HiOutlineRefresh size={18} />}
          {palyerMode === "order" && "顺序播放"}
          {palyerMode === "random" && "随机播放"}
          {palyerMode === "single" && "单曲循环"}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="px-4 py-2 text-[15px] h-9 rounded text-white hover:opacity-90 transition-[background-color,opacity] flex items-center gap-2 justify-center focus:outline-none"
          style={{
            backgroundColor: "#10b981",
            "--hover-color": "#059669",
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#059669";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#10b981";
          }}
        >
          <HiOutlinePlay size={18} />
          下一个
        </button>

        <button
          type="button"
          onClick={() => void handleToggleFullscreen()}
          className="px-4 py-2 text-[15px] h-9 rounded text-white hover:opacity-90 transition-[background-color,opacity] flex items-center gap-2 justify-center focus:outline-none"
          style={{
            backgroundColor: "#0ea5e9",
            "--hover-color": "#0284c7",
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0284c7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0ea5e9";
          }}
          title="全屏播放（快捷键 F，Esc 退出）"
        >
          <MdFullscreen size={18} />
          {isFullscreen ? "退出全屏" : "全屏"}
        </button>
      </div>
    </div>
  );
}
