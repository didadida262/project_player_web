import { useEffect, useRef, useState, useCallback } from "react";
import { useResources } from "../provider/resource-context";

export default function AudioContainer() {
  const { currentfileurl, currentFile, selectFile } = useResources();
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile, selectFile]);


  // 清理音频上下文
  const cleanupAudioContext = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // 忽略断开连接错误
      }
      sourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // 初始化音频分析器
  const initAudioContext = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return false;

    // 如果已经初始化，先清理
    if (analyserRef.current) {
      cleanupAudioContext();
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaElementSource(audio);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      sourceRef.current = source;

      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }, [cleanupAudioContext]);

  // URL 改变时清理并重置
  useEffect(() => {
    cleanupAudioContext();
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [currentfileurl, cleanupAudioContext]);

  // 设置音频事件监听
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = async () => {
      setIsPlaying(true);
      // 恢复音频上下文（如果被暂停）
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      // 初始化音频上下文（如果还没有初始化）
      if (!analyserRef.current) {
        initAudioContext();
      }
    };

    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = async () => {
      setDuration(audio.duration);
      // 自动播放
      try {
        await audio.play();
      } catch (error) {
        // 自动播放可能被浏览器阻止，这是正常的
        console.log("Auto-play prevented by browser:", error);
      }
    };
    const handleVolumeChange = () => setVolume(audio.volume);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("volumechange", handleVolumeChange);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentfileurl, initAudioContext]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupAudioContext();
    };
  }, [cleanupAudioContext]);

  // 绘制音频可视化
  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const audio = audioRef.current;

    if (!canvas || !analyser || !audio) {
      return;
    }

    // 检查音频是否在播放
    if (audio.paused || audio.ended) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = 100; // 增加条形数量，让波动更细腻
    const barWidth = 2; // 固定条形宽度（更细）
    const barGap = 1.5; // 条形间距（更紧凑）
    const maxBarHeight = canvas.height * 0.35; // 最大条形高度（进一步减小）
    const centerY = canvas.height / 2;

    // 计算总宽度，居中显示
    const totalWidth = barCount * (barWidth + barGap) - barGap;
    const startX = (canvas.width - totalWidth) / 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * bufferLength);
      const barHeight = (dataArray[dataIndex] / 255) * maxBarHeight;
      
      const x = startX + i * (barWidth + barGap);
      const height = Math.max(1, barHeight); // 最小高度为1

      // 使用渐变的对应位置的颜色
      const gradientPos = i / barCount;
      let color;
      if (gradientPos < 0.4) {
        const t = gradientPos / 0.4;
        color = `rgb(${Math.floor(29 + (30 - 29) * t)}, ${Math.floor(185 + (215 - 185) * t)}, ${Math.floor(84 + (96 - 84) * t)})`;
      } else if (gradientPos < 0.7) {
        const t = (gradientPos - 0.4) / 0.3;
        color = `rgb(${Math.floor(30 + (255 - 30) * t)}, ${Math.floor(215 + (107 - 215) * t)}, ${Math.floor(96 + (107 - 96) * t)})`;
      } else {
        const t = (gradientPos - 0.7) / 0.3;
        color = `rgb(${Math.floor(255 + (78 - 255) * t)}, ${Math.floor(107 + (205 - 107) * t)}, ${Math.floor(107 + (196 - 107) * t)})`;
      }

      ctx.fillStyle = color;
      // 绘制条形（从上到下）
      ctx.fillRect(x, centerY - height, barWidth, height);
      // 绘制条形（从下到上，镜像效果）
      ctx.fillRect(x, centerY, barWidth, height);
    }

    animationFrameRef.current = requestAnimationFrame(drawVisualization);
  }, []);

  // 当播放状态改变时开始/停止可视化
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      drawVisualization();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // 清空画布
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, drawVisualization]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 处理进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = percentage * duration;
  };

  // 处理音量变化
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = parseFloat(e.target.value);
      setVolume(audio.volume);
    }
  };

  // 调整画布大小
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = Math.min(100, window.innerHeight * 0.12); // 进一步减小高度
    };

    resizeCanvas();
    
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(container);

    window.addEventListener("resize", resizeCanvas);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const displayFileName = currentFile.name
    ? currentFile.name.replace(/\.[^/.]+$/, "")
    : "";

  return (
    <div className="w-full h-full flex flex-col">
      {/* 文件名显示区域 - 与视频保持一致 */}
      {currentFile.name && (
        <div className="w-full px-4 py-2">
          <p 
            className="text-[16px] font-semibold bg-gradient-to-r from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            title={currentFile.name}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100%",
              letterSpacing: "0.5px",
            }}
          >
            {displayFileName}
          </p>
        </div>
      )}

      {/* 音频可视化区域 */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-4 py-4 sm:py-6 relative overflow-hidden min-h-0"
      >
        {/* 背景光效 - 减小 */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-1/3 left-1/4 w-24 h-24 sm:w-40 sm:h-40 bg-[#1DB954] rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 sm:w-40 sm:h-40 bg-[#FF6B6B] rounded-full blur-2xl"></div>
        </div>

        {/* Canvas 可视化 */}
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full"
        />
      </div>

      {/* 音频控制区域 */}
      <div className="flex-shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
        {/* 进度条 */}
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-white/70 text-[16px] w-12 sm:w-14 text-right font-mono flex-shrink-0">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-[#1DB954] to-[#1ED760] rounded-full transition-all duration-300 relative"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
          <span className="text-white/70 text-[16px] w-12 sm:w-14 text-left font-mono flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
          {/* 音量控制 */}
          <div className="flex items-center gap-1.5 sm:gap-2 w-20 sm:w-24 flex-shrink-0 mr-[50px]">
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {volume === 0 ? (
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
              ) : volume < 0.5 ? (
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
              ) : (
                <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.383 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.383l4-3.617a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" />
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 h-0.5 sm:h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#1DB954]"
            />
          </div>

          {/* 播放/暂停按钮 */}
          <button
            onClick={async () => {
              const audio = audioRef.current;
              if (audio) {
                if (audio.paused) {
                  try {
                    await audio.play();
                  } catch (error) {
                    console.error("Play error:", error);
                  }
                } else {
                  audio.pause();
                }
              }
            }}
            className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-[#1DB954] hover:bg-[#1ED760] flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg shadow-[#1DB954]/50 flex-shrink-0"
          >
            {isPlaying ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 隐藏的 audio 元素 */}
      <audio
        ref={audioRef}
        src={currentfileurl}
        style={{ display: "none" }}
        crossOrigin="anonymous"
      />
    </div>
  );
}
