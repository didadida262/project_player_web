import { useResources } from "../provider/resource-context";
import cn from "classnames";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { getFiles } from "@/api/common";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";

export default function CategoryContainer() {
  const { categories, setSourcelist, currentCate, setCurrentCate, setCurrentFile, setcurrentfileurl } =
    useResources();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  };

  // 过滤出只有文件夹的项
  const folderItems = categories.filter((item: any) => item.type === 'dir');

  return (
    <div className="w-full h-full flex flex-col">
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between px-[8px] py-[8px] cursor-pointer hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span className="text-white text-[14px] font-medium">文件夹</span>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 90 }}
          transition={{ duration: 0.2 }}
        >
          <HiChevronRight className="text-white text-[16px]" />
        </motion.div>
      </div>

      {/* 文件夹列表 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-[8px] pb-[8px] flex flex-col gap-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
