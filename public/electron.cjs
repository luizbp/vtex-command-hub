const {
  app,
  BrowserWindow,
  ipcMain,
  autoUpdater,
  globalShortcut,
  dialog,
} = require("electron");
if (require("electron-squirrel-startup")) return;
const path = require("path");
const { logToFile } = require("./utils/utils.cjs");
const isDev = require("electron-is-dev")?.default || false;
const cmdScripts = require("./utils/cmd-scripts.cjs");

const WINDOW_CONFIG = {
  minWidth: 820,
  minHeight: 550,
  alwaysOnTop: false,
  minimizable: true,
  maximizable: true,
  webPreferences: {
    devTools: isDev,
    backgroundThrottling: false,
    nodeIntegration: true,
    preload: path.join(__dirname, "preload.cjs"),
  },
  icon: `${__dirname}/logo192.png`,
};

function setAutoUpdaterFeed() {
  const server = "https://vtex-command-hub-hazel.vercel.app";
  const feed = `${server}/update/${process.platform}/${app.getVersion()}`;
  try {
    autoUpdater.setFeedURL({ url: feed });
  } catch (e) {
    logToFile(app, "[autoUpdater] Error setting feed URL:", e);
  }
}

function handleAutoUpdater(win) {
  autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
    logToFile(app, "[autoUpdater] Update downloaded:", {
      releaseNotes,
      releaseName,
    });
    const dialogOpts = {
      type: "info",
      buttons: ["Reiniciar", "Mais Tarde"],
      title: "Atualização Disponivel",
      message: process.platform === "win32" ? releaseNotes : releaseName,
      detail:
        "Uma nova versão foi Baixada. Restart the application to apply the updates.",
    };
    dialog.showMessageBox(win, dialogOpts).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });
  autoUpdater.on("error", (err) => {
    const errorMsg =
      err instanceof Error
        ? err.message + (err.stack ? "\n" + err.stack : "")
        : typeof err === "object" && err !== null
          ? JSON.stringify(err)
          : String(err);
    logToFile(app, "[autoUpdater] Error:", errorMsg);
    const dialogOpts = {
      type: "error",
      buttons: ["Ok"],
      title: "Erro na Atualização",
      message: "Ocorreu um erro ao tentar atualizar o aplicativo.",
      detail: errorMsg,
    };
    dialog.showMessageBox(win, dialogOpts);
  });
}

function createWindow() {
  const win = new BrowserWindow(WINDOW_CONFIG);
  win.maximize();
  win.setMenuBarVisibility(isDev);
  win.loadURL(
    isDev
      ? "http://localhost:8080"
      : `file://${path.join(__dirname, "../dist/index.html")}`,
  );
  if (!isDev) handleAutoUpdater(win);
  return { win };
}

function registerIpcHandlers(win) {
  const handlers = {
    versionChecker: cmdScripts.versionChecker,
    updateAccount: cmdScripts.updateAccount,
    switchAccount: cmdScripts.switchAccount,
    createWorkspace: cmdScripts.createWorkspace,
    uninstallApps: cmdScripts.uninstallApps,
    installApps: cmdScripts.installApps,
    checkForUpdates: async () => {
      if (!isDev) {
        try {
          autoUpdater.checkForUpdates();
        } catch (e) {
          logToFile(
            app,
            "[autoUpdater] Error checking for updates on app ready:",
            e,
          );
          throw new Error(e instanceof Error ? e.message : String(e));
        }
      }
    },
  };
  Object.entries(handlers).forEach(([channel, handler]) => {
    ipcMain.handle(channel, async (_, ...props) => handler(...props));
  });
  ipcMain.on("reload-page", () => win.reload());
}

function registerAppEvents(win) {
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  win.on("focus", () =>
    globalShortcut.register("CommandOrControl+Shift+R", () => {}),
  );
  win.on("blur", () => globalShortcut.unregister("CommandOrControl+Shift+R"));
}

function registerGlobalEvents() {
  app.on("ready", () => {
    if (!isDev) {
      try {
        autoUpdater.checkForUpdates();
      } catch (e) {
        logToFile(
          app,
          "[autoUpdater] Error checking for updates on app ready:",
          e,
        );
      }
    }
  });
  app.on("window-all-closed", () => {
    globalShortcut.unregister("CommandOrControl+Shift+R");
    app.quit();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

if (!isDev) setAutoUpdaterFeed();

app.whenReady().then(() => {
  const { win } = createWindow();
  registerIpcHandlers(win);
  registerAppEvents(win);
});
registerGlobalEvents();

module.exports = { createWindow };
