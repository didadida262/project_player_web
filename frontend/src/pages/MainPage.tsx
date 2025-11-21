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
import { HiChevronLeft, HiChevronRight, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { isVideoFile, isImageFile, isAudioFile, isDocumentFile } from "../utils/mimeTypes";

interface IProps {}

export default function MainPage(props: IProps) {
  const { currentFile } = useResources();
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isBottomCollapsed, setIsBottomCollapsed] = useState(true);

  return (
    <div className="flex justify-between flex-col items-center w-full h-full px-[8px] py-[8px] text-[white]">
      <div className="content w-full h-full px-[5px] py-[5px] flex items-center">
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
            animate={{ rotate: isLeftCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            {isLeftCollapsed ? (
              <HiChevronRight className="text-white text-[16px]" />
            ) : (
              <HiChevronLeft className="text-white text-[16px]" />
            )}
          </motion.div>
        </div>

        {/* 右侧内容区域 */}
        <div 
          className="h-full flex flex-col justify-between items-center markBorderT backdrop-blur-sm bg-black/20"
          style={{ 
            width: isLeftCollapsed ? 'calc(100% - 25px)' : 'calc(100% - 215px)' 
          }}
        >
          <div 
            className="w-full px-[8px] py-[8px]"
            style={{ 
              height: isBottomCollapsed ? 'calc(100% - 25px)' : 'calc(100% - 150px)' 
            }}
          >
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

          {/* 底部收起/展开按钮 */}
          <div 
            className="w-full h-[20px] flex items-center justify-center cursor-pointer hover:bg-[#383b45] transition-colors"
            onClick={() => setIsBottomCollapsed(!isBottomCollapsed)}
          >
            <motion.div
              animate={{ rotate: isBottomCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              {isBottomCollapsed ? (
                <HiChevronUp className="text-white text-[16px]" />
              ) : (
                <HiChevronDown className="text-white text-[16px]" />
              )}
            </motion.div>
          </div>

          {/* 底部文件列表 */}
          <AnimatePresence>
            {!isBottomCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 125, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full overflow-hidden"
              >
                <FileList />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
