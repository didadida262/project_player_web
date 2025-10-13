import { useEffect } from "react";
import { useResources } from "../provider/resource-context";

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

  const handlePlayMode = () => {
    setPalyerMode(palyerMode === "order" ? "random" : "order");
  };
  const handleNext = () => {
    const nextFile = getNextVideo();
    setCurrentFile(nextFile);
  };

  useEffect(() => {}, [currentfileurl]);

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile]);

  return (
    <div className="w-full h-full flex justify-between items-center flex-col">
      <div className="video w-full h-[calc(100%_-_55px)] selectedG flex justify-center items-center rounded-lg overflow-hidden border border-white/10">
        <video
          muted={false}
          className="w-full h-full object-fit"
          autoPlay
          controls
          src={currentfileurl}
          onEnded={handleNext} // 直接监听结束事件
        />
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
          下一首
        </button>
      </div>
    </div>
  );
}
