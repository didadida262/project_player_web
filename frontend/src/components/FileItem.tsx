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
  FILE_TYPE_CATEGORIES 
} from "../utils/mimeTypes";

interface IProps {
  file: any;
}
const renderIcon = (mimeType: string) => {
  const category = getFileCategory(mimeType);
  
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
  const { currentFile, setCurrentFile } = useResources();
  const { file } = props;

  const handleClick = () => {
    console.log("select_file>>>", file);
    setCurrentFile(file);
  };

  return (
    <div
      className={cn(
        "w-[120px] h-[110px] flex flex-col justify-between items-center hover:cursor-pointer",
        "hover:border-[#0acaff] hover:border-[3px]",
        currentFile.name === file.name
          ? "border-[#0acaff] border-[3px] border-solid"
          : "border-[1px] border-solid border-[#383b45]",
        "mx-[8px]",
      )}
      style={{ display: "inline-block" }}
      onClick={handleClick}
    >
      <div className="w-full h-[calc(100%_-_35px)] flex justify-center items-center text-[30px]">
        {renderIcon(file.type)}
      </div>
      <div className="w-full h-[35px] flex justify-center items-center px-1">
        <span className="text-[11px] text-white text-center leading-tight break-words">
          {file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name}
        </span>
      </div>
    </div>
  );
}
