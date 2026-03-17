import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execSync } from "child_process";
import { initializeDatabase } from "../src/database/db";
import { closeDatabase } from "../src/database/connection";
import { initializeGroupConfig } from "../src/config/groupConfig";
import { setupIPC } from "./ipc";
import { EncryptionService } from "../src/services/encryption";

app.on("before-quit", async () => {
  await closeDatabase();
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("open-system-settings", () => {
  try {
    if (process.platform === "darwin") {
      execSync(
        "open 'x-apple.systempreferences:com.apple.preference.security?Privacy_Keychain'",
      );
    } else if (process.platform === "win32") {
      execSync("start ms-settings:privacy-credentials");
    } else {
      console.log("System settings not supported on this platform");
    }
  } catch (error) {
    console.error("Failed to open system settings:", error);
  }
});

app.whenReady().then(async () => {
  try {
    await EncryptionService.initializeMasterKey();
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "KEYCHAIN_AUTH_REQUIRED"
    ) {
      console.error("Keychain authorization required");
      await initializeDatabase();
      initializeGroupConfig();
      setupIPC();
      createWindow();
      return;
    }
    throw error;
  }

  await initializeDatabase();
  initializeGroupConfig();
  setupIPC();
  createWindow();
});
