import { useEffect, useRef } from "react";
import { useResources } from "../provider/resource-context";
import Hls from "hls.js";

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
  const hlsRef = useRef<Hls | null>(null);

  const handlePlayMode = () => {
    setPalyerMode(palyerMode === "order" ? "random" : "order");
  };
  const handleNext = () => {
    const nextFile = getNextVideo();
    if (nextFile) {
      setCurrentFile(nextFile);
    }
  };

  // 处理HLS流
  useEffect(() => {
    if (!currentfileurl || !videoRef.current) return;

    const video = videoRef.current;
    const isM3u8 = currentFile.name?.toLowerCase().endsWith('.m3u8') || 
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
          console.log('HLS manifest parsed, starting playback');
          video.play().catch(console.error);
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Fatal network error, trying to recover...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Fatal media error, trying to recover...');
                hls.recoverMediaError();
                break;
              default:
                console.log('Fatal error, destroying HLS...');
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

  return (
    <div className="w-full h-full flex justify-between items-center flex-col">
      <div className="video w-full h-[calc(100%_-_85px)] selectedG flex flex-col justify-center items-center rounded-lg overflow-hidden border border-white/10">
        <video
          ref={videoRef}
          muted={false}
          className="w-full h-full object-fit"
          autoPlay
          controls
          onEnded={handleNext} // 直接监听结束事件
        />
        {/* 文件名显示区域 */}
        {currentFile.name && (
          <div className="w-full px-4 py-2 bg-black/40 backdrop-blur-sm">
            <p className="text-white text-[14px] truncate" title={currentFile.name}>
              {currentFile.name}
            </p>
          </div>
        )}
      </div>
      <div className="operation w-full h-[50px] flex justify-start items-center gap-x-[10px]">
        {palyerMode === "order" ? (
          <button 
            onClick={handlePlayMode}
            className="px-4 py-2 text-[18px] h-8 rounded-none text-white hover:opacity-90 transition-all flex items-center justify-center"
            style={{ 
              backgroundColor: "#3b82f6", // 蓝色
              '--hover-color': "#2563eb"
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f6";
            }}
          >
            顺序播放
          </button>
        ) : (
          <button 
            onClick={handlePlayMode}
            className="px-4 py-2 text-[18px] h-8 rounded-none text-white hover:opacity-90 transition-all flex items-center justify-center"
            style={{ 
              backgroundColor: "#f59e0b", // 橙色
              '--hover-color': "#d97706"
            } as React.CSSProperties}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#d97706";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f59e0b";
            }}
          >
            随机播放
          </button>
        )}

        <button 
          onClick={handleNext}
          className="px-4 py-2 text-[18px] h-8 rounded-none text-white hover:opacity-90 transition-all flex items-center justify-center"
          style={{ 
            backgroundColor: "#10b981", // 绿色
            '--hover-color': "#059669"
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#059669";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#10b981";
          }}
        >
          下一个
        </button>
      </div>
    </div>
  );
}
