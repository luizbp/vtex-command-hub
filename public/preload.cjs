const { ipcRenderer, contextBridge } = require("electron");
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);

// API Definition
const electronAPI = {
  versionChecker: (props) => ipcRenderer.invoke("versionChecker", props),
  updateAccount: (props) => ipcRenderer.invoke("updateAccount", props),
  switchAccount: (props) => ipcRenderer.invoke("switchAccount", props),
  createWorkspace: (props) => ipcRenderer.invoke("createWorkspace", props),
  uninstallApps: (props) => ipcRenderer.invoke("uninstallApps", props),
  installApps: (props) => ipcRenderer.invoke("installApps", props),
};

// Register the API with the contextBridge
process.once("loaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", electronAPI);
});
