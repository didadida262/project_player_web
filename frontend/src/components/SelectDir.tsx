import { useState, useRef } from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { useResources } from "../provider/resource-context";
import { getFiles } from "@/api/common";

interface IProps {}

export default function SelectDir(props: IProps) {
  const { currentpath, setCurrentpath, setCategories } = useResources();
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectDirectory = async () => {
    if (!currentpath) {
      // 如果没有选择路径，触发原生文件选择对话框
      fileInputRef.current?.click();
      return;
    }

    // 如果已经选择了路径，开始扫描
    setIsScanning(true);
    try {
      const params = { path: currentpath };
      console.log("currentpath", currentpath);
      const res = (await getFiles(params)) as any;
      console.log("dirs>>>", res);
      setCategories(res);
    } catch (error) {
      console.error("扫描失败:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // 获取第一个文件的完整路径
      const file = files[0];
      // 使用 File API 获取文件的完整路径
      const fullPath = (file as any).path || file.name;
      
      // 提取目录部分（去掉文件名）
      let directoryPath = fullPath;
      if (fullPath.includes('/')) {
        directoryPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      } else if (fullPath.includes('\\')) {
        directoryPath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
      }
      
      console.log("选择的文件路径:", fullPath);
      console.log("提取的目录路径:", directoryPath);
      setCurrentpath(directoryPath);
    }
    // 清空input值，允许重复选择同一个文件
    event.target.value = '';
  };

  const buttonText = !currentpath ? "选择路径" : (isScanning ? "扫描中..." : "开始扫描");
  const buttonColor = !currentpath ? "#10b981" : "#3b82f6"; // 绿色表示选择，蓝色表示扫描
  const hoverColor = !currentpath ? "#059669" : "#2563eb";

  return (
    <>
      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      {/* 按钮 */}
      <button 
        onClick={handleSelectDirectory}
        disabled={isScanning}
        className="px-4 py-2 text-[18px] h-8 rounded-none text-white hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ 
          backgroundColor: buttonColor,
          '--hover-color': hoverColor
        } as React.CSSProperties}
        onMouseEnter={(e) => {
          if (!isScanning) {
            e.currentTarget.style.backgroundColor = hoverColor;
          }
        }}
        onMouseLeave={(e) => {
          if (!isScanning) {
            e.currentTarget.style.backgroundColor = buttonColor;
          }
        }}
      >
        {buttonText}
      </button>
    </>
  );
}
