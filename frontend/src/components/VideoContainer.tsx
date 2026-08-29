import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useResources } from "../provider/resource-context";
import Hls from "hls.js";
import flvjs from "flv.js";
import { HiOutlineFolderOpen, HiOutlineTrash } from "react-icons/hi";
import customToast from "./customToast";
import VideoLoading from "./VideoLoading";
import VideoControls from "./VideoControls";

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
 * currentTime 是 restricted double：写入 NaN/Infinity 会直接抛 TypeError。
 * 换源瞬间 duration/currentTime 可能还不是有限值，不兜住的话整个快捷键分支会中断，
 * 全屏下又没有原生控件兜底，表现就是左右键完全没反应。
 */
function seekBy(video: HTMLVideoElement, deltaSeconds: number): boolean {
  const current = video.currentTime;
  if (!Number.isFinite(current)) return false;

  const duration = video.duration;
  // 直播/时长未知的片源退而用 seekable 的末端做上界
  const upper = Number.isFinite(duration)
    ? duration
    : video.seekable.length > 0
      ? video.seekable.end(video.seekable.length - 1)
      : Number.NaN;

  let next = Math.max(0, current + deltaSeconds);
  if (Number.isFinite(upper)) {
    next = Math.min(next, upper);
  }
  if (!Number.isFinite(next)) return false;

  try {
    video.currentTime = next;
  } catch {
    return false;
  }
  return true;
}

/** 鼠标在画面上静止多久后隐藏控件栏 */
const CONTROLS_HIDE_DELAY = 2600;

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
  /** 当前已可播的片源 key；与 mediaKey 不一致时视为加载中，换源当帧就能盖住画面 */
  const [readyMediaKey, setReadyMediaKey] = useState<string | null>(null);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  /** 换源后 WebKit 会把 playbackRate 复位成 1，需要在元数据就绪时重新写回 */
  const playbackRateRef = useRef(1);
  const [pointerOverVideo, setPointerOverVideo] = useState(false);
  const [controlsHeld, setControlsHeld] = useState(false);
  /** 鼠标在画面上静止一段时间后为 true；全屏时整屏都算悬停，靠它才能藏控件 */
  const [controlsIdle, setControlsIdle] = useState(true);
  const hideControlsTimerRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);

  isFullscreenRef.current = isFullscreen;

  // 悬停显示；静止后淡出。拖拽进度 / 展开菜单期间靠 controlsHeld 锁住
  const controlsVisible =
    controlsHeld || (pointerOverVideo && !controlsIdle);

  const bumpControlsActivity = useCallback(() => {
    setPointerOverVideo(true);
    setControlsIdle(false);
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      hideControlsTimerRef.current = null;
      setControlsIdle(true);
    }, CONTROLS_HIDE_DELAY);
  }, []);

  useEffect(
    () => () => {
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
      }
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
      }
    },
    [],
  );

  // 拖拽 / 菜单结束后：指针还在画面上就重新计时，否则立刻藏
  useEffect(() => {
    if (controlsHeld) {
      if (hideControlsTimerRef.current !== null) {
        window.clearTimeout(hideControlsTimerRef.current);
        hideControlsTimerRef.current = null;
      }
      setControlsIdle(false);
      return;
    }
    if (!pointerOverVideo) {
      setControlsIdle(true);
      return;
    }
    if (hideControlsTimerRef.current !== null) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = window.setTimeout(() => {
      hideControlsTimerRef.current = null;
      setControlsIdle(true);
    }, CONTROLS_HIDE_DELAY);
  }, [controlsHeld, pointerOverVideo]);

  /** 尺寸没有实质变化就不写 state，避免 ResizeObserver → 重排 → ResizeObserver 的抖动 */
  const applyContainerSize = useCallback((width: number, height: number) => {
    if (!(width > 0 && height > 0)) return;
    setContainerSize((prev) =>
      Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);

  const measureContainer = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    applyContainerSize(el.clientWidth, el.clientHeight);
  }, [applyContainerSize]);

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

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  // 单击播放/暂停、双击全屏：双击会先派发两次 click，用短延时把它让给 dblclick
  const handleVideoClick = () => {
    if (clickTimerRef.current !== null) return;
    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      handleTogglePlay();
    }, 220);
  };
  const handleVideoDoubleClick = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    void handleToggleFullscreen();
  };

  const handleChangeRate = (rate: number) => {
    const video = videoRef.current;
    // ref 只跟随用户选择：load() 复位倍速时触发的 ratechange 不能污染它，
    // 否则换源后会把用户选的倍速写回成 1
    playbackRateRef.current = rate;
    if (video) video.playbackRate = rate;
    setPlaybackRate(rate);
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
        video.load();
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
        video.load();
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
      // 换源后显式 load()：只改 src 时 WebKit 原生控制条会留着上一个片源的进度，
      // 表现为切换后进度条卡在中间、当前时间显示 --:--
      video.load();
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

  // 全屏时用视口尺寸排版视频；退出时立刻按真实容器重测，
  // 否则会继续沿用视口高度算尺寸，把画面撑出播放区
  useEffect(() => {
    if (!isFullscreen) {
      const rafId = requestAnimationFrame(() => measureContainer());
      return () => cancelAnimationFrame(rafId);
    }
    const update = () => {
      applyContainerSize(window.innerWidth, window.innerHeight);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isFullscreen, applyContainerSize, measureContainer]);

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

      // 左右方向键：快进/后退
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        // 元数据未就绪时 seekBy 会拒绝写入非有限值，静默跳过即可
        seekBy(video, event.key === "ArrowLeft" ? -10 : 10);
        return;
      }

      // 空格：播放/暂停
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        handleTogglePlay();
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
      const el = videoRef.current;
      if (!el) return;
      // load() 会把倍速复位，换源后按用户选择写回
      el.playbackRate = playbackRateRef.current;
      if (el.videoWidth && el.videoHeight) {
        setVideoRatio(el.videoWidth / el.videoHeight);
        // 视频元数据加载后，强制更新一次容器尺寸，确保计算正确
        requestAnimationFrame(() => measureContainer());
      }
    };

    const videoEl = videoRef.current;
    videoEl.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      videoEl.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [currentFile, measureContainer]);

  useEffect(() => {
    if (!containerRef.current) return;

    // 立即获取初始尺寸，使用双重 requestAnimationFrame 确保在布局完成后获取
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        measureContainer();
      });
    });
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (isFullscreenRef.current) return;
      applyContainerSize(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(containerRef.current);
    
    // 监听窗口大小变化，确保最大化/最小化/拖拽时都能触发
    // 使用 requestAnimationFrame 确保在布局完成后获取准确尺寸
    let rafId: number | null = null;
    const handleWindowResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(() => {
          if (!isFullscreenRef.current) measureContainer();
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
  }, [applyContainerSize, measureContainer]);

  // 换源时回到播放态默认值，避免上一个片源的播放状态残留在控件上
  useEffect(() => {
    setIsPlaying(false);
  }, [currentfileurl]);

  // 画面盒尺寸：控件栏叠在这个盒子底部，所以它必须和画面严格同框。
  // 全屏时铺满视口，画面靠 object-fit 居中，控件栏自然贴在屏幕底部
  const videoBoxRect = (() => {
    if (
      isFullscreen ||
      !containerSize.width ||
      !containerSize.height ||
      videoRatio == null
    ) {
      // 比例未知时先铺满容器，由 object-fit: contain 兜住画面
      return { width: containerSize.width, height: containerSize.height, fill: true };
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

    // 确保不超过容器尺寸（双重保险）；向下取整避免亚像素反复触发 ResizeObserver
    return {
      width: Math.floor(Math.min(width, containerSize.width)),
      height: Math.floor(Math.min(height, containerSize.height)),
      fill: false,
    };
  })();

  const videoBoxStyle: CSSProperties = videoBoxRect.fill
    ? { width: "100%", height: "100%" }
    : {
        width: `${videoBoxRect.width}px`,
        height: `${videoBoxRect.height}px`,
        // 测量值可能短暂过期（换源、退出全屏、侧栏动画），用百分比上限兜底，绝不撑出容器
        maxWidth: "100%",
        maxHeight: "100%",
      };

  return (
    <div className="w-full h-full min-w-0 min-h-0 flex flex-col bg-black">
      {currentFile.name && (
        <div className="video-fs-title w-full shrink-0 px-4 py-2 flex items-center gap-2 min-w-0">
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
        className="video w-full min-h-0 min-w-0 flex-1 selectedG relative flex justify-center items-center rounded-lg outline-none"
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
        {/* 控件栏叠在这个盒子上，盒子与画面同尺寸，控件才不会飘到黑边里 */}
        <div
          className="relative shrink-0"
          style={videoBoxStyle}
          onMouseEnter={bumpControlsActivity}
          onMouseMove={bumpControlsActivity}
          onMouseLeave={() => {
            setPointerOverVideo(false);
            setControlsIdle(true);
            if (hideControlsTimerRef.current !== null) {
              window.clearTimeout(hideControlsTimerRef.current);
              hideControlsTimerRef.current = null;
            }
          }}
        >
          <video
            ref={videoRef}
            muted={false}
            tabIndex={-1}
            className="block h-full w-full outline-none focus:outline-none focus:ring-0 focus:border-0"
            autoPlay={
              !(
                currentFile.type?.includes("mpegurl") ||
                currentFile.name?.toLowerCase().endsWith(".m3u8")
              )
            }
            playsInline
            style={{
              objectFit: "contain",
              backgroundColor: "#000",
              opacity: isVideoLoading || mediaFailed ? 0 : 1,
            }}
            onEnded={handleNext}
            onCanPlay={() => {
              if (!videoRef.current?.error) setReadyMediaKey(mediaKey);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
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
            onClick={handleVideoClick}
            onDoubleClick={(e) => {
              e.preventDefault();
              handleVideoDoubleClick();
            }}
            onKeyDown={(e) => {
              if (e.code === "Space" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
          />
          <VideoControls
            videoRef={videoRef}
            mediaKey={mediaKey}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            playMode={palyerMode}
            isFullscreen={isFullscreen}
            visible={controlsVisible}
            compact={videoBoxRect.width > 0 && videoBoxRect.width < 460}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrev}
            onNext={handleNext}
            onChangeRate={handleChangeRate}
            onTogglePlayMode={handlePlayMode}
            onToggleFullscreen={() => void handleToggleFullscreen()}
            onHoldVisibleChange={setControlsHeld}
          />
        </div>
      </div>
    </div>
  );
}
