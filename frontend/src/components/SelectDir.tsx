import { useState } from "react";
import { useResources } from "../provider/resource-context";
import { getFiles } from "@/api/common";
import customToast from "./customToast";

interface IProps {}

export default function SelectDir(_props: IProps) {
  const {
    setCurrentpath,
    setCategories,
    requestExpandLeftSidebar,
    setCategoryTree,
    setExpandedPaths,
    setCurrentCate,
    setSourcelist,
    setCurrentFile,
    setcurrentfileurl,
  } = useResources();
  const [isScanning, setIsScanning] = useState(false);

  const handlePathConfirm = async (path: string) => {
    setCurrentpath(path);
    setCategoryTree(new Map());
    setExpandedPaths(new Set());
    setCurrentCate({});
    setSourcelist([]);
    setCurrentFile({});
    setcurrentfileurl("");

    setIsScanning(true);
    try {
      const params = { path };
      const res = (await getFiles(params)) as any;
      setCategories(res);
      requestExpandLeftSidebar();
    } catch (error) {
      console.error("扫描失败:", error);
      customToast.error("扫描失败");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDirectory = async () => {
    if (isScanning) return;

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await invoke<string | null>("pick_directory");
      if (path) {
        await handlePathConfirm(path);
      }
    } catch {
      customToast.info("请在桌面版（Tauri）中使用此功能");
    }
  };

  const buttonText = isScanning ? "扫描中..." : "选择路径";
  const buttonColor = isScanning ? "#6b7280" : "#10b981";
  const hoverColor = isScanning ? "#6b7280" : "#059669";

  return (
    <button
      type="button"
      onClick={handleSelectDirectory}
      disabled={isScanning}
      className="select-none px-4 py-2 text-[18px] h-8 rounded-none text-white hover:opacity-90 transition-[background-color,opacity] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
      style={
        {
          backgroundColor: buttonColor,
          "--hover-color": hoverColor,
        } as React.CSSProperties
      }
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
  );
}
