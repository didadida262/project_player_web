import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useResources } from "../provider/resource-context";
import Hls from "hls.js";
import { isVideoFile } from "../utils/mimeTypes";
import {
  HiOutlineSwitchHorizontal,
  HiOutlineSparkles,
  HiOutlineRefresh,
  HiOutlinePlay,
} from "react-icons/hi";

export default function VideoContainer() {
  const {
    currentfileurl,
    palyerMode,
    setPalyerMode,
    currentFile,
    selectFile,
    setCurrentFile,
    getNextVideo,
  } = useResources();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoRatio, setVideoRatio] = useState(16 / 9);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const hlsRef = useRef<Hls | null>(null);

  const handlePlayMode = () => {
    const next =
      palyerMode === "order"
        ? "random"
        : palyerMode === "random"
        ? "single"
        : "order";
    setPalyerMode(next);
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
    const nextFile = getNextVideo();
    if (nextFile) {
      setCurrentFile(nextFile);
    }
  };

  // 处理HLS流
  useEffect(() => {
    if (!currentfileurl || !videoRef.current) return;

    const video = videoRef.current;
    const isM3u8 = currentFile.type?.includes('mpegurl') || 
                   currentFile.name?.toLowerCase().endsWith('.m3u8') || 
                   currentfileurl.includes('.m3u8');

    if (isM3u8) {
      // 清理之前的HLS实例
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        
        hls.loadSource(currentfileurl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari原生支持HLS
        video.src = currentfileurl;
        video.play().catch(console.error);
      } else {
        console.error('HLS is not supported in this browser');
      }
    } else {
      // 普通视频文件
      video.src = currentfileurl;
    }

    // 清理函数
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentfileurl, currentFile.name]);

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile]);

  // 添加键盘快捷键监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 避免在输入框等控件里触发快捷键
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isFormInput =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";
      if (isFormInput) return;

      // 空格：播放/暂停
      if (event.code === "Space" || event.key === " ") {
        event.preventDefault();
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
        return;
      }

      // 按下方向键下时，切换到下一首
      if (event.key === 'ArrowDown') {
        event.preventDefault(); // 阻止默认行为
        handleNext();
      }
    };

    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数：组件卸载时移除事件监听器
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentFile]); // 依赖currentFile，确保handleNext函数是最新的

  const displayFileName = currentFile.name
    ? currentFile.name.replace(/\.[^/.]+$/, "")
    : "";

  useEffect(() => {
    if (!videoRef.current) return;
    const handleLoadedMetadata = () => {
      if (videoRef.current?.videoWidth && videoRef.current.videoHeight) {
        setVideoRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
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
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const maxWidth = containerSize.width
    ? Math.min(containerSize.width, containerSize.height * videoRatio)
    : "100%";
  const maxHeight = containerSize.height
    ? Math.min(containerSize.height, containerSize.width / videoRatio)
    : "100%";

  const videoStyle: CSSProperties = {
    width: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth,
    height: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* 文件名显示区域 - 移到视频上方 */}
      {currentFile.name && (
        <div className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm rounded-t-lg">
            <p 
            className="text-white text-[14px]" 
            title={currentFile.name}
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}
            >
              {displayFileName}
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        className="video w-full flex-1 selectedG flex justify-center items-center rounded-lg overflow-hidden "
      >
        <video
          ref={videoRef}
          muted={false}
          className="object-contain"
          autoPlay
          controls
          style={{
            ...videoStyle,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          onEnded={handleNext} // 直接监听结束事件
        />
      </div>
      <div className="operation w-full h-[50px] flex justify-start items-center gap-x-[10px]">
        <button
          onClick={handlePlayMode}
          className="px-4 py-2 text-[15px] h-9 rounded text-white hover:opacity-90 transition-all flex items-center gap-2 justify-center"
          style={{
            backgroundColor:
              palyerMode === "order"
                ? "#3b82f6" // 蓝
                : palyerMode === "random"
                ? "#f59e0b" // 橙
                : "#8b5cf6", // 紫 单曲循环
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
          onClick={handleNext}
          className="px-4 py-2 text-[15px] h-9 rounded text-white hover:opacity-90 transition-all flex items-center gap-2 justify-center"
          style={{
            backgroundColor: "#10b981", // 绿色
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
      </div>
    </div>
  );
}
