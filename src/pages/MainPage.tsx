import { Tag, Input } from "antd";
import SelectDir from "../components/SelectDir";
import { useResources } from "../provider/resource-context";
import CategoryContainer from "../components/CategoryContainer";
import FileList from "../components/FileList";
import VideoContainer from "../components/VideoContainer";
import ImgContainer from "../components/ImgContainer";
import AudioContainer from "../components/AudioContainer";
import PdfContainer from "../components/PdfContainer";

interface IProps {}

export default function MainPage(props: IProps) {
  const { Search } = Input;
  const { currentpath, currentFile } = useResources();

  const onSearch = (data: any) => {
    console.log("data>>>", data);
  };
  return (
    <div className="flex justify-between flex-col items-center w-full h-full px-[8x] py-[8px] text-[white]">
      <div className="operation w-full h-[40px]  flex justify-start items-center gap-x-[10px] px-[5px] py-[5px] ">
        <SelectDir />
        <Tag color="#2db7f5">当前路径：{currentpath}</Tag>
      </div>
      <div className="content w-full h-[calc(100%_-_45px)]  px-[5px] py-[5px] flex justify-between items-center">
        <div className="cate w-[160px] h-full markBorderT">
          <CategoryContainer />
        </div>
        <div className="w-[calc(100%_-_165px)] h-full flex flex-col justify-between items-center markBorderT">
          <div className=" w-full h-[calc(100%_-_125px)] px-[8px] py-[8px] ">
            {currentFile.type === "video" && <VideoContainer />}
            {currentFile.type === "image" && <ImgContainer />}
            {currentFile.type === "audio" && <AudioContainer />}
            {currentFile.type === "pdf" && <PdfContainer />}
          </div>
          <div className="Filelist w-full h-[120px]">
            <FileList />
          </div>
        </div>
      </div>
    </div>
  );
}
