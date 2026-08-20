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
import {
  getFileCategory,
  FILE_TYPE_CATEGORIES,
} from "../utils/mimeTypes";
import { isFlatSubfoldersDir } from "../utils/flatSubfolders";

interface IProps {
  file: any;
}

/** cate_p 平铺资源的标识：叠层卡片，避免和普通视频的圆形 Play 搞混 */
function HlsPackageLogo() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="h-[36px] w-[36px] drop-shadow-[0_0_8px_rgba(34,211,238,0.45)]"
      aria-hidden
    >
      <rect x="6" y="4" width="20" height="14" rx="3" fill="#164e63" />
      <rect x="4" y="8" width="20" height="14" rx="3" fill="#0e7490" />
      <rect x="2" y="12" width="22" height="16" rx="3" fill="#22d3ee" />
      <polygon points="11,17 11,25 19,21" fill="#041016" />
    </svg>
  );
}

function isCatePHlsItem(file: any, cateName?: string) {
  const type = String(file?.type || "").toLowerCase();
  return isFlatSubfoldersDir(cateName) && type.includes("mpegurl");
}

const renderIcon = (file: any, cateName?: string) => {
  if (isCatePHlsItem(file, cateName)) {
    return <HlsPackageLogo />;
  }

  const category = getFileCategory(file?.type);

  const mapIcon: Record<string, React.ReactElement> = {
    [FILE_TYPE_CATEGORIES.DIRECTORY]: <HiFolder className="text-white" />,
    [FILE_TYPE_CATEGORIES.VIDEO]: <HiPlay className="text-white" />,
    [FILE_TYPE_CATEGORIES.AUDIO]: <HiMusicNote className="text-white" />,
    [FILE_TYPE_CATEGORIES.IMAGE]: <HiPhotograph className="text-white" />,
    [FILE_TYPE_CATEGORIES.DOCUMENT]: <HiDocumentText className="text-white" />,
    [FILE_TYPE_CATEGORIES.ARCHIVE]: <HiDocument className="text-white" />,
    [FILE_TYPE_CATEGORIES.UNKNOWN]: <HiQuestionMarkCircle className="text-gray-400" />,
  };

  return mapIcon[category] || <HiQuestionMarkCircle className="text-gray-400" />;
};

export default function FileItem(props: IProps) {
  const { currentFile, setCurrentFile, currentCate } = useResources();
  const { file } = props;

  const handleClick = () => {
    setCurrentFile(file);
  };

  return (
    <div
      data-name={file.name}
      className={cn(
        "w-full h-[110px] flex flex-col justify-between items-center hover:cursor-pointer",
        "hover:border-[#0acaff] hover:border-[3px]",
        currentFile.name === file.name
          ? "border-[#0acaff] border-[3px] border-solid"
          : "border-[1px] border-solid border-[#383b45]",
        "px-3"
      )}
      onClick={handleClick}
    >
      <div className="w-full h-[calc(100%_-_35px)] flex justify-center items-center text-[30px]">
        {renderIcon(file, currentCate?.name)}
      </div>
      <div className="w-full h-[35px] flex justify-center items-center px-1">
        <span className="text-[11px] text-white text-center leading-tight break-words">
          {file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name}
        </span>
      </div>
    </div>
  );
}
