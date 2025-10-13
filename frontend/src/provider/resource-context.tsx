import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";

export interface TFile {
  name: string;
  path: string;
  type: string;
}
interface ResourcesContextType {
  currentpath: string;
  categories: any[];
  sourcelist: any[];
  currentCate: any;
  currentFile: any;
  currentfileurl: any;
  palyerMode: string;
  setPalyerMode: (mode: string) => void;
  setcurrentfileurl: (file: any) => void;
  setCurrentFile: (file: any) => void;
  setCurrentCate: (file: any) => void;
  setCurrentpath: (path: string) => void;
  setCategories: (categories: any[]) => void;
  setSourcelist: (categories: any[]) => void;
  selectFile: (file: TFile) => void;
  getNextVideo: () => void;
}

const ResourcesContext = createContext<ResourcesContextType | undefined>(
  undefined,
);

export const ResourcesProvider = ({ children }: { children: ReactNode }) => {
  const [currentpath, setCurrentpath] = useState<string>("");
  const [currentCate, setCurrentCate] = useState<any>({});
  const [currentFile, setCurrentFile] = useState<any>({});
  const [currentfileurl, setcurrentfileurl] = useState<any>();
  const [palyerMode, setPalyerMode] = useState<string>("order");
  const [categories, setCategories] = useState<any[]>([]);
  const [sourcelist, setSourcelist] = useState<any[]>([]);

  const getNextVideo = () => {
    //   播放结束，根据当前播放模式，选择下一个
    if (sourcelist.length === 0) {
      return null;
    }
    
    const currentIndex = sourcelist.findIndex(
      (item) => item.name === currentFile.name,
    );
    let nextFileIndex;
    
    if (palyerMode === "order") {
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
    console.log("请求文件>>>", file);
    setcurrentfileurl(`http://localhost:3001/video?path=${file.path}`);
  };
  const selectFile = (file: TFile) => {
    console.log("selectFile>>>>", file);
    switch (file.type) {
      case "application/mp4":
      case "audio/mpeg":
        handleStreamFile(file);
        break;
      default:
        break;
    }
  };
  useEffect(() => {
    console.log("currentpath>>>", currentpath);
  }, [currentpath]);

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
        setPalyerMode,
        setCurrentpath,
        setSourcelist,
        setCategories,
        setCurrentCate,
        setCurrentFile,
        setcurrentfileurl,
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
