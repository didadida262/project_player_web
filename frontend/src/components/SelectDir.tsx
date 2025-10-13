import { useState } from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { useResources } from "../provider/resource-context";
import { getFiles } from "@/api/common";

interface IProps {}

export default function SelectDir(props: IProps) {
  const { currentpath, setCurrentpath, setCategories } = useResources();

  const handleSelectDirectory = async () => {
    const params = { path: currentpath };
    console.log("currentpath", currentpath);
    const res = (await getFiles(params)) as any;
    console.log("dirs>>>", res);
    setCategories(res);
  };

  const scanDirectory = (dir: string) => {};
  return (
    <button 
      onClick={handleSelectDirectory}
      className="px-2 py-2 text-[25px] h-8 rounded-none bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors flex items-center justify-center"
    >
      开始扫描
    </button>
  );
}
