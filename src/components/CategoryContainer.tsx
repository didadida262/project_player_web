import { useResources } from "../provider/resource-context";
import cn from "classnames";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { getFiles } from "@/api/common";

export default function CategoryContainer() {
  const { categories, setSourcelist, currentCate, setCurrentCate } =
    useResources();

  const handleClick = async (file: any) => {
    setCurrentCate(file);
    const params = {
      path: file.path,
    };
    const res = (await getFiles(params)) as any;
    console.log("files>>>", res);
    setSourcelist(res);
  };

  return (
    <div className="w-full h-full px-[8px] py-[8px] flex flex-col justify-start gap-y-2 overflow-y-auto ">
      {categories.map((item: any, index: number) => (
        <div
          key={index}
          className={cn(
            "w-full h-[40px]  text-[14px] flex justify-start items-center px-[10px]",
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
