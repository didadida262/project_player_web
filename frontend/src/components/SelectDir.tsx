import { useState, useRef } from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { useResources } from "../provider/resource-context";
import { getFiles } from "@/api/common";
import { PathInputDialog } from "./ui/path-input-dialog";

interface IProps {}

export default function SelectDir(props: IProps) {
  const { currentpath, setCurrentpath, setCategories } = useResources();
  const [isScanning, setIsScanning] = useState(false);
  const [showPathDialog, setShowPathDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectDirectory = async () => {
    console.log('handleSelectDirectory')
    // 显示路径输入对话框
    setShowPathDialog(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // 获取第一个文件的完整路径
      const file = files[0];
      // 使用 File API 获取文件的完整路径
      const fullPath = (file as any).path || file.webkitRelativePath || file.name;
      
      // 提取目录部分（去掉文件名）
      let directoryPath = fullPath;
      if (fullPath.includes('/')) {
        directoryPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
      } else if (fullPath.includes('\\')) {
        directoryPath = fullPath.substring(0, fullPath.lastIndexOf('\\'));
      }
      
      console.log("选择的文件夹路径:", directoryPath);
      setCurrentpath(directoryPath);
    }
    // 清空input值，允许重复选择同一个文件夹
    event.target.value = '';
  };

  const handlePathConfirm = async (path: string) => {
    setCurrentpath(path);
    
    // 自动开始扫描
    setIsScanning(true);
    try {
      const params = { path: path };
      console.log("currentpath", path);
      const res = (await getFiles(params)) as any;
      console.log("dirs>>>", res);
      setCategories(res);
    } catch (error) {
      console.error("扫描失败:", error);
    } finally {
      setIsScanning(false);
    }
  };

  const buttonText = isScanning ? "扫描中..." : "选择路径";
  const buttonColor = isScanning ? "#6b7280" : "#10b981"; // 灰色表示扫描中，绿色表示选择
  const hoverColor = isScanning ? "#6b7280" : "#059669";

  return (
    <>
      {/* 路径输入对话框 */}
      <PathInputDialog
        isOpen={showPathDialog}
        onClose={() => setShowPathDialog(false)}
        onConfirm={handlePathConfirm}
        title="选择文件夹路径"
        placeholder="请输入文件夹路径..."
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
