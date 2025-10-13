import { useResources } from "../provider/resource-context";
import cn from "classnames";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { getFiles } from "@/api/common";
import { isDirectory } from "../utils/mimeTypes";

export default function CategoryContainer() {
  const { categories, setSourcelist, currentCate, setCurrentCate, setCurrentFile, setcurrentfileurl } =
    useResources();

  const handleClick = async (file: any) => {
    // 清空当前播放的文件和URL
    setCurrentFile({});
    setcurrentfileurl('');
    
    setCurrentCate(file);
    const params = {
      path: file.path,
    };
    const res = (await getFiles(params)) as any;
    console.log("files>>>", res);
    setSourcelist(res);
    
    // 自动播放第一个文件
    if (res && res.length > 0) {
      const firstFile = res[0];
      setCurrentFile(firstFile);
    }
  };

  // 过滤出只有文件夹的项
  const folderItems = categories.filter((item: any) => isDirectory(item.type));

  return (
    <div className="w-full h-full px-[8px] py-[8px] flex flex-col justify-start gap-y-2 overflow-y-auto">
      {folderItems.map((item: any, index: number) => (
        <div
          key={index}
          className={cn(
            "w-full h-[40px] text-[14px] flex justify-start items-center px-[10px]",
            "hover:bg-[#383b45] rounded-[4px] hover:cursor-pointer",
            "border-b-[1px] border-solid border-[#383b45]",
            currentCate.name === item.name ? "bg-[#383b45]" : "",
          )}
          onClick={() => handleClick(item)}
        >
          {item.name.length > 12 ? item.name.slice(0, 12) + "..." : item.name}
        </div>
      ))}
    </div>
  );
}
