const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('node:path');

const isDev = process.env.NODE_ENV === 'development';
const DEV_URL = 'http://localhost:5173';

const MEDIA_PERMISSIONS = new Set([
  'media',
  'camera',
  'microphone',
  'audioCapture',
  'videoCapture',
  'display-capture',
  'mediaKeySystem',
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  return win;
}

function registerPermissionHandlers() {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(MEDIA_PERMISSIONS.has(permission));
    }
  );

  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => MEDIA_PERMISSIONS.has(permission)
  );

  if (typeof session.defaultSession.setDisplayMediaRequestHandler === 'function') {
    session.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
      callback({});
    });
  }
}

function registerIpcHandlers() {
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-platform', () => process.platform);
  ipcMain.handle('app:ping', (_event, message) => `pong: ${message}`);
}

app.whenReady().then(() => {
  registerPermissionHandlers();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    const allowed = isDev && url.startsWith(DEV_URL);
    if (!allowed) event.preventDefault();
  });
});
