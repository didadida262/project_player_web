import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { isVideoFile } from "../utils/mimeTypes";

export interface CategoryNode {
  name: string;
  path: string;
  type: string;
  children?: CategoryNode[];
  isExpanded?: boolean;
  allChildrenAreFolders?: boolean;
}

export interface TFile {
  name: string;
  path: string;
  type: string;
}

interface ResourcesContextType {
  currentpath: string;
  categories: any[];
  sourcelist: any[];
  prevStack: TFile[];
  currentCate: any;
  currentFile: any;
  currentfileurl: any;
  palyerMode: string;
  categoryTree: Map<string, CategoryNode[]>;
  expandedPaths: Set<string>;
  setPalyerMode: (mode: string) => void;
  setcurrentfileurl: (file: any) => void;
  setCurrentFile: (file: any) => void;
  setCurrentCate: (file: any) => void;
  setCurrentpath: (path: string) => void;
  setCategories: (categories: any[]) => void;
  setSourcelist: (categories: any[]) => void;
  setPrevStack: (stack: TFile[]) => void;
  setCategoryTree: (tree: Map<string, CategoryNode[]>) => void;
  setExpandedPaths: (paths: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  selectFile: (file: TFile) => void;
  getNextVideo: () => TFile | null;
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(
  undefined,
);

export const ResourcesProvider = ({ children }: { children: ReactNode }) => {
  const [currentpath, setCurrentpath] = useState<string>("");
  const [currentCate, setCurrentCate] = useState<any>({});
  const [currentFile, setCurrentFile] = useState<any>({});
  const [currentfileurl, setcurrentfileurl] = useState<any>();
  const [palyerMode, setPalyerMode] = useState<string>("order"); // order | random | single
  const [categories, setCategories] = useState<any[]>([]);
  const [sourcelist, setSourcelist] = useState<any[]>([]);
  const [prevStack, setPrevStack] = useState<TFile[]>([]);
  const [categoryTree, setCategoryTree] = useState<Map<string, CategoryNode[]>>(new Map());
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const getNextVideo = () => {
    //   播放结束，根据当前播放模式，选择下一个
    if (sourcelist.length === 0) {
      return null;
    }
    
    const currentIndex = sourcelist.findIndex(
      (item) => item.name === currentFile.name,
    );
    let nextFileIndex;
    
    if (palyerMode === "single") {
      nextFileIndex = currentIndex !== -1 ? currentIndex : 0;
    } else if (palyerMode === "order") {
      nextFileIndex = currentIndex + 1;
      if (nextFileIndex >= sourcelist.length) {
        nextFileIndex = 0;
      }
    } else {
      // 随机播放模式
      nextFileIndex = Math.floor(Math.random() * sourcelist.length);
    }
    
    const nextFile = sourcelist[nextFileIndex];
    return nextFile || null;
  };

  const handleVideoFile = (file: BlobPart) => {
    const blob = new Blob([file], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    setcurrentfileurl(url);
  };
  const handleCommonFile = (file: BlobPart, type: string) => {
    const blob = new Blob([file]);
    const url = URL.createObjectURL(blob);
    setcurrentfileurl(url);
  };
  const handlePdfFile = (file: BlobPart, type: string) => {
    const blob = new Blob([file], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setcurrentfileurl(url);
  };

  const handleStreamFile = (file: any) => {
    const encodedPath = encodeURIComponent(file.path || "");
    // 使用与前端 API 相同的基址（VITE_API_DEV/PROD 或默认 127.0.0.1:3001）
    const apiBase =
      import.meta.env.VITE_API_DEV ||
      import.meta.env.VITE_API_PROD ||
      "http://127.0.0.1:3001";
    setcurrentfileurl(`${apiBase}/video?path=${encodedPath}`);
  };
  const selectFile = (file: TFile) => {
    switch (file.type) {
      case "video/mp4":
      case "video/x-flv":
      case "audio/mpeg":
      case "application/vnd.apple.mpegurl":
      case "application/x-mpegURL":
        handleStreamFile(file);
        break;
      default:
        break;
    }
  };
  return (
    <ResourcesContext.Provider
      value={{
        currentpath,
        categories,
        sourcelist,
        palyerMode,
        currentCate,
        currentFile,
        currentfileurl,
        categoryTree,
        expandedPaths,
        setPalyerMode,
        setCurrentpath,
        setSourcelist,
        setCategories,
        prevStack,
        setPrevStack,
        setCurrentCate,
        setCurrentFile,
        setcurrentfileurl,
        setCategoryTree,
        setExpandedPaths,
        selectFile,
        getNextVideo,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
};

export const useResources = (): ResourcesContextType => {
  const context = useContext(ResourcesContext);
  if (context === undefined) {
    throw new Error("useResources must be used within a ResourcesProvider");
  }
  return context;
};
