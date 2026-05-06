import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getDb, closeDb } from './main/db';
import { registerIpcHandlers } from './main/ipc';
import {
  registerScreenshotsHandlers,
  registerScreenshotsScheme,
} from './main/screenshots';

if (started) {
  app.quit();
}

registerScreenshotsScheme();

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 560,
    minWidth: 560,
    minHeight: 360,
    backgroundColor: '#0a0c0f',
    title: 'Lono Notes',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.on('ready', () => {
  getDb();
  registerIpcHandlers();
  registerScreenshotsHandlers();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  closeDb();
});
