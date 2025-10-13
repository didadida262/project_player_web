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
      <div className="w-full h-[calc(100%_-_40px)] flex justify-center items-center">
        <audio src={currentfileurl} controls />
      </div>
      {/* 文件名显示区域 */}
      {currentFile.name && (
        <div className="w-full h-[40px] px-4 py-2 bg-black/40 backdrop-blur-sm flex items-center">
          <p className="text-white text-[14px] truncate w-full" title={currentFile.name}>
            {currentFile.name}
          </p>
        </div>
      )}
    </div>
  );
}
