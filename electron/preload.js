const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  showItemInFolder: (filePath) =>
    ipcRenderer.invoke("shell:show-item-in-folder", filePath),
});
