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
    const currentIndex = sourcelist.findIndex(
      (item) => item.name === currentFile.name,
    );
    let nextFileIndex =
      palyerMode === "order"
        ? currentIndex + 1
        : Math.random() * sourcelist.length;
    if (nextFileIndex >= sourcelist.length) {
      nextFileIndex = 0;
    }
    const nextFile = sourcelist[nextFileIndex];
    return nextFile;
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

  const selectFile = (file: TFile) => {
    const params = {
      type: "getVideoContent",
      data: file.path,
    };
    // 打点
    api.sendMessage(params as unknown as IPCInfo);

    if (file.type === "video") {
      const mediaSource = new MediaSource();
      const url = URL.createObjectURL(mediaSource);
      setcurrentfileurl(url);

      let sourceBuffer: SourceBuffer | null = null;
      let chunksToAppend: any[] = [];
      let isAppending = false;

      mediaSource.addEventListener("sourceopen", () => {
        // 指定完整的 MIME 类型
        const mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        if (MediaSource.isTypeSupported(mimeType)) {
          sourceBuffer = mediaSource.addSourceBuffer(mimeType);
        } else {
          console.error("不支持的 MIME 类型:", mimeType);
        }

        sourceBuffer?.addEventListener("updateend", () => {
          isAppending = false;
          if (chunksToAppend.length > 0) {
            const nextChunk = chunksToAppend.shift();
            appendChunk(nextChunk);
          }
        });
      });

      const appendChunk = (chunkData: any) => {
        if (sourceBuffer && !isAppending) {
          isAppending = true;
          sourceBuffer.appendBuffer(chunkData.file);
          if (chunkData.isLastChunk) {
            sourceBuffer.addEventListener("updateend", () => {
              if (!(mediaSource as any).ended) {
                (mediaSource as any).endOfStream();
              }
            });
          }
        } else {
          chunksToAppend.push(chunkData);
        }
      };

      api.on("getVideoContent_back", (data: any) => {
        appendChunk(data);
      });
    } else {
      api.on("getVideoContent_back", (data: any) => {
        switch (file.type) {
          case "image":
            handleCommonFile(data.file, file.type);
            break;
          case "pdf":
            handlePdfFile(data.file, file.type);
            break;
          case "audio":
            handleCommonFile(data.file, file.type);
            break;
          default:
            break;
        }
      });
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
