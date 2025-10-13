import SelectDir from "../components/SelectDir";
import { useResources } from "../provider/resource-context";
import CategoryContainer from "../components/CategoryContainer";
import FileList from "../components/FileList";
import VideoContainer from "../components/VideoContainer";
import ImgContainer from "../components/ImgContainer";
import AudioContainer from "../components/AudioContainer";
import PdfContainer from "../components/PdfContainer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface IProps {}

export default function MainPage(props: IProps) {
  const { currentpath, currentFile, setCurrentpath } = useResources();
  const handleInputChange = (e: any) => {
    // 获取当前输入值
    const newValue = e.target.value;
    setCurrentpath(newValue);
    console.log("输入变化:", newValue);
  };

  const onSearch = (data: any) => {
    console.log("data>>>", data);
  };
  return (
    <div className="flex justify-between flex-col items-center w-full h-full px-[8x] py-[8px] text-[white]">
      <div className="operation w-full h-[40px]  flex justify-start items-center gap-x-[10px] px-[5px] py-[5px] ">
        <div className="flex justify-start items-center gap-x-2">
          <Label className="text-cyan-400 whitespace-nowrap text-[20px]">当前路径：</Label>
          <Input
            type="text"
            onChange={handleInputChange}
            className="!w-[250px] !h-8 !text-sm !border !border-gray-400 border-[1px] border-solid"
            placeholder="输入文件路径..."
          />
        </div>
        <SelectDir />
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
          </div>

          <div className="Filelist w-full h-[130px]">
            <FileList />
          </div>
        </div>
      </div>
    </div>
  );
}
