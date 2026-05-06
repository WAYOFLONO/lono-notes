import {
  app,
  BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { getDb, closeDb } from './main/db';
import { registerIpcHandlers } from './main/ipc';
import {
  registerScreenshotsHandlers,
  registerScreenshotsScheme,
} from './main/screenshots';
import { getBoolPref, setBoolPref } from './main/preferences';

if (started) {
  app.quit();
}

registerScreenshotsScheme();

let mainWindowRef: BrowserWindow | null = null;

const setAlwaysOnTop = (on: boolean) => {
  const w = mainWindowRef;
  if (!w) return;
  w.setAlwaysOnTop(on);
  setBoolPref('alwaysOnTop', on);
  rebuildMenu(on);
};

const buildMenuTemplate = (alwaysOnTop: boolean): MenuItemConstructorOptions[] => {
  const isMac = process.platform === 'darwin';
  return [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    { role: 'fileMenu' as const },
    { role: 'editMenu' as const },
    {
      label: 'View',
      submenu: [
        {
          label: 'Always on Top',
          type: 'checkbox' as const,
          checked: alwaysOnTop,
          accelerator: 'CommandOrControl+Shift+P',
          click: (item) => {
            setAlwaysOnTop(item.checked);
          },
        },
        { type: 'separator' as const },
        { role: 'reload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    { role: 'windowMenu' as const },
  ];
};

const rebuildMenu = (alwaysOnTop: boolean) => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(buildMenuTemplate(alwaysOnTop)));
};

const createMainWindow = () => {
  const initialPin = getBoolPref('alwaysOnTop', false);

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 560,
    minWidth: 560,
    minHeight: 360,
    backgroundColor: '#0a0c0f',
    title: 'Lono Notes',
    alwaysOnTop: initialPin,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindowRef = mainWindow;
  mainWindow.on('closed', () => {
    if (mainWindowRef === mainWindow) mainWindowRef = null;
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  rebuildMenu(initialPin);
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
