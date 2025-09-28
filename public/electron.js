// public/electron.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fontList = require('font-list');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // <-- preload 스크립트 경로 설정
    },
    frame: false,
    titleBarStyle: 'hidden'
  });

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }

  // --- ▼▼▼ 폰트 목록을 가져오는 IPC 핸들러 추가 ▼▼▼ ---
  ipcMain.handle('get-system-fonts', async () => {
    try {
      const fonts = await fontList.getFonts();
      // 중복을 제거하고 이름만 추출하여 정렬합니다.
      return [...new Set(fonts.map(f => f.replace(/"/g, '')))].sort();
    } catch (error) {
      console.error('Failed to get system fonts:', error);
      return [];
    }
  });
}

// --- Electron API 핸들러들 (창 조절, 링크 메타데이터 등) ---
ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});

ipcMain.on('maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});

const axios = require('axios');
const cheerio = require('cheerio');

ipcMain.handle('fetch-link-metadata', async (event, url) => {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        const $ = cheerio.load(data);

        const getMetaTag = (name) => {
            return $(`meta[name="${name}"]`).attr('content') || $(`meta[property="og:${name}"]`).attr('content');
        };

        const title = getMetaTag('title') || $('title').text();
        const description = getMetaTag('description');
        let image = getMetaTag('image');

        if (image && !image.startsWith('http')) {
            const urlObject = new URL(url);
            image = new URL(image, urlObject.origin).href;
        }

        return { success: true, title, description, image };
    } catch (error) {
        console.error(`Error fetching metadata for ${url}:`, error.message);
        return { success: false, error: error.message };
    }
});


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