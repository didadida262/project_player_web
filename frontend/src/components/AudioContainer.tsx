import { useEffect } from "react";
import { useResources } from "../provider/resource-context";

export default function AudioContainer() {
  const { currentfileurl, currentFile, selectFile } = useResources();

  useEffect(() => {
    if (!currentFile.name) return;
    selectFile(currentFile);
  }, [currentFile]);

  return (
    <div className="w-full h-full flex justify-center items-center">
      <audio src={currentfileurl} controls />
    </div>
  );
}
