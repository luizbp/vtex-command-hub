const { ipcRenderer, contextBridge } = require("electron");
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);

// API Definition
const electronAPI = {
  versionChecker: (prop) => ipcRenderer.invoke("versionChecker", prop),
};

// Register the API with the contextBridge
process.once("loaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
});
