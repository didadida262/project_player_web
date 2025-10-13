import SelectDir from "../components/SelectDir";
import { useResources } from "../provider/resource-context";
import CategoryContainer from "../components/CategoryContainer";
import FileList from "../components/FileList";
import VideoContainer from "../components/VideoContainer";
import ImgContainer from "../components/ImgContainer";
import AudioContainer from "../components/AudioContainer";
import PdfContainer from "../components/PdfContainer";
import EmptyPlayer from "../components/EmptyPlayer";
import { Label } from "../components/ui/label";

interface IProps {}

export default function MainPage(props: IProps) {
  const { currentpath, currentFile } = useResources();

  return (
    <div className="flex justify-between flex-col items-center w-full h-full px-[8x] py-[8px] text-[white]">
      <div className="operation w-full h-[40px] flex justify-between items-center gap-x-[10px] px-[5px] py-[5px]">
        {/* 左侧：选择按钮 */}
        <SelectDir />
        
        {/* 右侧：当前路径显示 */}
        <div className="flex justify-end items-center gap-x-2">
          <Label className="text-cyan-400 whitespace-nowrap text-[20px]">当前路径：</Label>
          <span className="text-white text-[16px] font-mono bg-gray-800 px-3 py-1 rounded border border-gray-600">
            {currentpath || "未选择路径"}
          </span>
        </div>
      </div>
      <div className="content w-full h-[calc(100%_-_45px)]  px-[5px] py-[5px] flex justify-between items-center">
        <div className="cate w-[190px] h-full markBorderT backdrop-blur-sm bg-black/20">
          <CategoryContainer />
        </div>
        <div className="w-[calc(100%_-_195px)] h-full flex flex-col justify-between items-center markBorderT backdrop-blur-sm bg-black/20">
          <div className=" w-full h-[calc(100%_-_135px)] px-[8px] py-[8px] ">
            {currentFile.type && currentFile.type.includes("mp4") && (
              <VideoContainer />
            )}
            {currentFile.type && currentFile.type.includes("image") && (
              <ImgContainer />
            )}
            {currentFile.type && currentFile.type.includes("audio") && (
              <AudioContainer />
            )}
            {currentFile.type && currentFile.type.includes("pdf") && (
              <PdfContainer />
            )}
            {(!currentFile.type || !currentFile.name) && (
              <EmptyPlayer />
            )}
          </div>

          <div className="Filelist w-full h-[130px]">
            <FileList />
          </div>
        </div>
      </div>
    </div>
  );
}
