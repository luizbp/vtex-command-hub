const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");

const isDev = require("electron-is-dev");
const cmdScripts = require("./utils/cmd-scripts.cjs");

const widthWindowMode = 820;
const heigthWindowMode = 550;

function createWindow() {
  const win = new BrowserWindow({
    width: widthWindowMode,
    height: heigthWindowMode,
    minWidth: widthWindowMode,
    minHeight: heigthWindowMode,
    alwaysOnTop: false,
    minimizable: true,
    maximizable: true,
    webPreferences: {
      devTools: isDev,
      backgroundThrottling: false,
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    // icon: `${__dirname}/logo192.png`,
  });

  win.setMenuBarVisibility(isDev);

  win.loadURL(
    isDev
      ? "http://localhost:8080/"
      : `file://${path.join(__dirname, "../build/index.html")}`,
  );

  return {
    win,
  };
}

app.whenReady().then(() => {
  const { win } = createWindow();
  ipcMain.handle("versionChecker", async (event, ...args) =>
    cmdScripts.versionChecker(...args),
  );
  ipcMain.on("reload-page", () => {
    win.reload();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  win.on("focus", () => {
    globalShortcut.register("CommandOrControl+Shift+R", () => {});
  });

  win.on("blur", () => {
    globalShortcut.unregister("CommandOrControl+Shift+R");
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  globalShortcut.unregister("CommandOrControl+Shift+R");
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

module.exports = {
  createWindow,
};
