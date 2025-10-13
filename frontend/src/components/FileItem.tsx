import {
  HiFolder,
  HiDocumentText,
  HiPhotograph,
  HiPlay,
  HiDocument,
  HiMusicNote,
  HiQuestionMarkCircle,
} from "react-icons/hi";
import cn from "classnames";
import { useResources } from "../provider/resource-context";
import { useState } from "react";

interface IProps {
  file: any;
}
// type FileType = "directory" | "video" | "word" | "pdf" | "image" | "audio";
const renderIcon = (type: string, fileName?: string) => {
  // 处理MIME类型和简单类型
  let fileType = type;
  
  if (type === 'dir') {
    fileType = 'directory';
  } else if (type && type.includes('video')) {
    fileType = 'video';
  } else if (type && type.includes('image')) {
    fileType = 'image';
  } else if (type && type.includes('audio')) {
    fileType = 'audio';
  } else if (type && type.includes('pdf')) {
    fileType = 'pdf';
  } else if (type && (type.includes('word') || type.includes('document'))) {
    fileType = 'word';
  } else if (fileName) {
    // 如果MIME类型无法识别，通过文件扩展名判断
    const ext = fileName.toLowerCase().split('.').pop();
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'mpg', 'mpeg', 'm3u8'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const pdfExts = ['pdf'];
    const docExts = ['doc', 'docx', 'txt', 'rtf'];
    
    if (videoExts.includes(ext || '')) {
      fileType = 'video';
    } else if (imageExts.includes(ext || '')) {
      fileType = 'image';
    } else if (audioExts.includes(ext || '')) {
      fileType = 'audio';
    } else if (pdfExts.includes(ext || '')) {
      fileType = 'pdf';
    } else if (docExts.includes(ext || '')) {
      fileType = 'word';
    }
  }

  const mapIcon = {
    directory: <HiFolder className="text-white" />,
    video: <HiPlay className="text-white" />,
    word: <HiDocumentText className="text-white" />,
    pdf: <HiDocument className="text-white" />,
    image: <HiPhotograph className="text-white" />,
    audio: <HiMusicNote className="text-white" />,
  };
  return mapIcon[fileType as keyof typeof mapIcon] || <HiQuestionMarkCircle className="text-gray-400" />;
};
export default function FileItem(props: IProps) {
  const { currentFile, setCurrentFile } = useResources();
  const { file } = props;
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    console.log("select_file>>>", file);
    setCurrentFile(file);
  };

  return (
    <div
      className={cn(
        "w-[120px] h-[110px] flex flex-col justify-between items-center hover:cursor-pointer relative",
        "hover:border-[#0acaff] hover:border-[3px]",
        currentFile.name === file.name
          ? "border-[#0acaff] border-[3px] border-solid"
          : "border-[1px] border-solid border-[#383b45]",
        "mx-[8px]",
      )}
      style={{ display: "inline-block" }}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="w-full h-[calc(100%_-_35px)] flex justify-center items-center text-[30px]">
        {renderIcon(file.type, file.name)}
      </div>
      <div className="w-full h-[35px] flex justify-center items-center px-1">
        <span className="text-[11px] text-white text-center leading-tight break-words">
          {file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name}
        </span>
      </div>
      
      {/* 悬浮卡片 - 右上方 */}
      {showTooltip && (
        <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 z-[9999]">
          <div className="bg-gray-800 text-white px-2 py-1 rounded-lg shadow-lg border border-gray-600">
            <p className="text-xs whitespace-nowrap">
              {file.name}
            </p>
            {/* 小三角箭头 - 指向左下角 */}
            <div className="absolute bottom-0 left-0 transform translate-x-2 translate-y-2 w-0 h-0 border-r-4 border-t-4 border-transparent border-r-gray-800 border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
}
