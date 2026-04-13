/// <reference types="vite/client" />

interface ElectronShowFolderResult {
  ok: boolean;
  error?: string;
}

interface ElectronAPI {
  showItemInFolder: (
    filePath: string,
  ) => Promise<ElectronShowFolderResult | undefined>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
