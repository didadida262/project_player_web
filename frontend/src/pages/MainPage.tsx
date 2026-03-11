import { useResources } from "../provider/resource-context";
import CategoryContainer from "../components/CategoryContainer";
import FileList from "../components/FileList";
import VideoContainer from "../components/VideoContainer";
import ImgContainer from "../components/ImgContainer";
import AudioContainer from "../components/AudioContainer";
import PdfContainer from "../components/PdfContainer";
import EmptyPlayer from "../components/EmptyPlayer";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronLeft } from "react-icons/hi";
import { isVideoFile, isImageFile, isAudioFile, isDocumentFile } from "../utils/mimeTypes";

interface IProps {}

export default function MainPage(props: IProps) {
  const { currentFile } = useResources();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(true);

  return (
    <div className="flex justify-between flex-col items-center w-full h-full text-[white] px-[5px]">
      <div className="content w-full h-[calc(100%_-_16px)] px-0 py-[5px] flex items-stretch gap-0">
        {/* 左侧文件夹容器 */}
        <AnimatePresence>
          {!isLeftCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 190, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full markBorderT backdrop-blur-sm bg-black/20 overflow-hidden"
            >
              <CategoryContainer />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 收起/展开按钮 */}
        <div 
          className="w-[20px] h-full flex items-center justify-center cursor-pointer hover:bg-[#383b45] transition-colors"
          onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
        >
          <motion.div
            animate={{ rotate: isLeftCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <HiChevronLeft className="text-white text-[16px]" />
          </motion.div>
        </div>

        {/* 中间视频区 */}
        <div className="flex-1 h-full flex flex-col justify-between items-center markBorderT backdrop-blur-sm bg-black/20 min-w-0">
          <div className="w-full px-[8px] py-[8px] flex-1">
            {currentFile.type && isVideoFile(currentFile.type) && (
              <VideoContainer />
            )}
            {currentFile.type && isImageFile(currentFile.type) && (
              <ImgContainer />
            )}
            {currentFile.type && isAudioFile(currentFile.type) && (
              <AudioContainer />
            )}
            {currentFile.type && isDocumentFile(currentFile.type) && (
              <PdfContainer />
            )}
            {(!currentFile.type || !currentFile.name) && (
              <EmptyPlayer />
            )}
          </div>
        </div>

        {/* 右侧显示/隐藏控制 */}
        <div 
          className="w-[20px] h-full flex items-center justify-center cursor-pointer hover:bg-[#383b45] transition-colors"
          onClick={() => setIsRightCollapsed(!isRightCollapsed)}
        >
          <motion.div
            animate={{ rotate: isRightCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <HiChevronLeft className="text-white text-[16px]" />
          </motion.div>
        </div>

        {/* 右侧文件列表 */}
        <AnimatePresence>
          {!isRightCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 230, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full markBorderT backdrop-blur-sm bg-black/10 overflow-hidden pl-[6px] pr-0 py-[5px]"
          >
              <FileList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
