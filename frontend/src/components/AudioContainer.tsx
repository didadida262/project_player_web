import { useEffect } from "react";
import { useResources } from "../provider/resource-context";

export default function AudioContainer() {
  const { currentfileurl, currentFile, selectFile } = useResources();

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile]);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      {/* 文件名显示区域 - 移到音频控件上方 */}
      {currentFile.name && (
        <div className="w-full h-[40px] px-4 py-2 bg-black/40 backdrop-blur-sm flex items-center rounded-t-lg overflow-hidden">
          <p className="text-white text-[14px] truncate w-full block" title={currentFile.name}>
            {currentFile.name}
          </p>
        </div>
      )}
      <div className="w-full h-[calc(100%_-_40px)] flex justify-center items-center">
        <audio src={currentfileurl} controls />
      </div>
    </div>
  );
}
