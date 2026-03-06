const {
  app,
  BrowserWindow,
  ipcMain,
  autoUpdater,
  globalShortcut,
  dialog,
} = require("electron");
const path = require("path");

const isDev = require("electron-is-dev")?.default || false;

// Logger simples para arquivo
const fs = require("fs");
const logPath = path.join(app.getPath("userData"), "main.log");
function logToFile(...args) {
  const msg =
    `[${new Date().toISOString()}] ` +
    args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") +
    "\n";
  fs.appendFileSync(logPath, msg);
}
logToFile("TCL: isDev", isDev);
const cmdScripts = require("./utils/cmd-scripts.cjs");

const widthWindowMode = 820;
const heigthWindowMode = 550;

if (!isDev) {
  const server = "https://vtex-command-hub-hazel.vercel.app";
  const feed = `${server}/update/${process.platform}/${app.getVersion()}`;
  logToFile("[autoUpdater] Feed URL:", feed);
  try {
    autoUpdater.setFeedURL({ url: feed });
  } catch (e) {
    logToFile("[autoUpdater] setFeedURL error:", e);
  }

  setInterval(() => {
    logToFile("[autoUpdater] Checking for updates...");
    autoUpdater.checkForUpdates();
  }, 60000);
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
    icon: `${__dirname}/logo192.png`,
  });

  win.maximize();

  win.setMenuBarVisibility(isDev);

  win.loadURL(
    isDev
      ? "http://localhost:8080"
      : `file://${path.join(__dirname, "../dist/index.html")}`,
  );

  if (!isDev) {
    autoUpdater.on("update-available", (info) => {
      logToFile("[autoUpdater] Update available:", info);
    });

    autoUpdater.on("update-not-available", (info) => {
      logToFile("[autoUpdater] No update available:", info);
    });

    autoUpdater.on("update-downloaded", (event, releaseNotes, releaseName) => {
      logToFile("[autoUpdater] Update downloaded:", {
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

      dialog.showMessageBox(win, dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) autoUpdater.quitAndInstall();
      });
    });

    autoUpdater.on("error", (err) => {
      let errorMsg = "";
      if (err instanceof Error) {
        errorMsg = err.message + (err.stack ? "\n" + err.stack : "");
      } else if (typeof err === "object" && err !== null) {
        errorMsg = JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      logToFile("[autoUpdater] Error:", errorMsg);
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
