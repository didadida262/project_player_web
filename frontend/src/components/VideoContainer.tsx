import { useEffect } from "react";
import { useResources } from "../provider/resource-context";
import ShimmerButton from "./ui/shimmer-button";

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
      <div className="operation w-full h-[50px] flex justify-start items-center gap-x-[20px]">
        {palyerMode === "order" ? (
          <ShimmerButton 
            onClick={handlePlayMode}
            className="px-6 py-2"
            shimmerColor="#60a5fa"
            background="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          >
            顺序播放
          </ShimmerButton>
        ) : (
          <ShimmerButton 
            onClick={handlePlayMode}
            className="px-6 py-2"
            shimmerColor="#f472b6"
            background="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          >
            随机播放
          </ShimmerButton>
        )}

        <ShimmerButton 
          onClick={handleNext}
          className="px-6 py-2"
          shimmerColor="#34d399"
          background="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        >
          下一首
        </ShimmerButton>
      </div>
    </div>
  );
}
