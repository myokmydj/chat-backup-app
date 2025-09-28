// 파일: public/electron.js (전체 코드)

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const axios = require('axios');
const cheerio = require('cheerio');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 560,
    frame: false,
    titleBarStyle: 'hidden',
    // ▼▼▼ [가장 중요한 부분] 이 webPreferences 객체가 정확해야 합니다. ▼▼▼
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload.js 파일 경로 지정
      contextIsolation: true, // 보안을 위해 필수
      nodeIntegration: false, // 보안을 위해 필수
    },
    // ▲▲▲ [가장 중요한 부분] ▲▲▲
  });

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  if (isDev) {
    win.webContents.openDevTools();
  }
}

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

ipcMain.on('minimize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.minimize();
});

ipcMain.on('maximize-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (window.isMaximized()) {
    window.unmaximize();
  } else {
    window.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window.close();
});

ipcMain.handle('fetch-link-metadata', async (event, url) => {
  console.log(`[Main Process] Received request to fetch metadata for: ${url}`);
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 10000,
    });
    const html = response.data;
    const finalUrl = response.request.res.responseUrl || url;
    const $ = cheerio.load(html);
    const getMetaTag = (name) => $(`meta[property="og:${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content');
    const title = getMetaTag('title') || $('title').text() || '제목 없음';
    const description = getMetaTag('description') || '설명 없음';
    let image = getMetaTag('image');
    // ▼▼▼ [핵심 수정] URL 생성 부분을 try...catch로 감싸 안정성을 높입니다. ▼▼▼
    if (image && !image.startsWith('http')) {
      try {
        const absoluteUrl = new URL(image, finalUrl);
        image = absoluteUrl.href;
      } catch (e) {
        console.warn(`[Main Process] Could not convert relative image URL to absolute: ${image}`);
        image = null; // 변환 실패 시 이미지를 null 처리
      }
    }
    // ▲▲▲ [핵심 수정] ▲▲▲

    const result = { success: true, title, description, image, url: finalUrl };
    return result;
  } catch (error) {
    console.error(`[Main Process] Error fetching metadata for ${url}:`, error.code || error.message);
    return { success: false, error: error.message };
  }
});