import {
  HiFolder,
  HiDocumentText,
  HiPhotograph,
  HiVideoCamera,
  HiDocument,
  HiMusicNote,
  HiQuestionMarkCircle,
} from "react-icons/hi";
import cn from "classnames";
import { useResources } from "../provider/resource-context";

interface IProps {
  file: any;
}
type FileType = "directory" | "video" | "word" | "pdf" | "image" | "audio";
const renderIcon = (type: FileType) => {
  const mapIcon = {
    directory: <HiFolder className="text-yellow-400" />,
    video: <HiVideoCamera className="text-blue-400" />,
    word: <HiDocumentText className="text-blue-500" />,
    pdf: <HiDocument className="text-red-400" />,
    image: <HiPhotograph className="text-green-400" />,
    audio: <HiMusicNote className="text-purple-400" />,
  };
  return mapIcon[type] ? mapIcon[type] : <HiQuestionMarkCircle className="text-gray-400" />;
};
export default function FileItem(props: IProps) {
  const { currentFile, setCurrentFile, currentfileurl, setcurrentfileurl } =
    useResources();
  const { file } = props;

  const handleClick = () => {
    console.log("select_file>>>", file);
    setCurrentFile(file);
  };

  return (
    <div
      className={cn(
        "w-[100px] h-[110px] flex flex-col justify-between items-center hover:cursor-pointer",
        "hover:border-[#0acaff] hover:border-[3px]",
        currentFile.name === file.name
          ? "border-[#0acaff] border-[3px] border-solid"
          : "border-[1px] border-solid border-[#383b45]",
        "mx-[10px]",
      )}
      style={{ display: "inline-block" }}
      onClick={handleClick}
    >
      <div className="w-full h-[calc(100%_-_30px)] flex justify-center items-center text-[30px]">
        {renderIcon(file.type)}
      </div>
      <div className="w-full h-[30px] flex justify-center items-center truncate text-[12px]">
        {file.name.length > 10 ? file.name.slice(0, 10) + "..." : file.name}
      </div>
    </div>
  );
}
