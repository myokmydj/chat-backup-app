// File: public/electron.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');
const cheerio = require('cheerio');
const fontList = require('font-list');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#fff',
  });

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// --- Window Controls ---
ipcMain.on('minimize-app', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.on('maximize-app', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.on('close-app', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

// --- Feature Handlers ---
ipcMain.handle('get-system-fonts', async () => {
  try {
    return await fontList.getFonts();
  } catch (error) {
    console.error('Failed to get system fonts:', error);
    return [];
  }
});

ipcMain.handle('fetch-link-metadata', async (event, url) => {
  try {
    const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    return { success: true, title, description, image };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-google-sheet', async (event, url) => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error(`Error fetching Google Sheet: ${error.message}`);
    return null;
  }
});

// [제거 완료] 트위터 관련 핸들러가 모두 삭제되었습니다.

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});