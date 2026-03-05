const {
  app,
  BrowserWindow,
  ipcMain,
  autoUpdater,
  globalShortcut,
} = require("electron");
const path = require("path");

const isDev = require("electron-is-dev")?.default || false;
const cmdScripts = require("./utils/cmd-scripts.cjs");

const widthWindowMode = 820;
const heigthWindowMode = 550;

if (!isDev) {
  const server = "https://vtex-command-hub-hazel.vercel.app";
  const feed = `${server}/update/${process.platform}/${app.getVersion()}`;
  autoUpdater.setFeedURL({ url: feed });
}

function createWindow() {
  const win = new BrowserWindow({
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

  win.maximize();

  win.setMenuBarVisibility(isDev);

  win.loadURL(
    isDev
      ? "http://localhost:8080"
      : `file://${path.join(__dirname, "../dist/index.html")}`,
  );

  if (!isDev) {
    autoUpdater.checkForUpdates();
  }

  return {
    win,
  };
}

app.whenReady().then(() => {
  const { win } = createWindow();
  ipcMain.handle("versionChecker", async (_, ...args) =>
    cmdScripts.versionChecker(...args),
  );
  ipcMain.handle("updateAccount", async (_, ...args) =>
    cmdScripts.updateAccount(...args),
  );
  ipcMain.handle("manageRelease", async (_, ...args) =>
    cmdScripts.manageRelease(...args),
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
