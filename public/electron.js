// File: public/electron.js

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fontList = require('font-list');
const axios = require('axios');
const cheerio = require('cheerio');

// ▼▼▼ [추가] electron-updater 모듈 가져오기 ▼▼▼
const { autoUpdater } = require('electron-updater');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 15, y: 13 },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // 개발 중일 때는 React 앱 주소를, 프로덕션에서는 빌드된 파일을 로드합니다.
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 메뉴를 비웁니다 (프로덕션에서 Ctrl+R 등 비활성화)
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.on('closed', () => (mainWindow = null));

  // ▼▼▼ [핵심 추가] 자동 업데이트 로직 ▼▼▼
  // 앱이 준비되면 업데이트를 확인합니다.
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// --- IPC 핸들러들 ---

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});

ipcMain.handle('get-system-fonts', async () => {
  try {
    const fonts = await fontList.getFonts();
    return fonts.map(font => font.replace(/"/g, ''));
  } catch (error) {
    console.error('Failed to get system fonts:', error);
    return [];
  }
});

ipcMain.handle('fetch-link-metadata', async (event, url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    
    const getMetaTag = (name) => $(`meta[property="og:${name}"]`).attr('content') || $(`meta[name="${name}"]`).attr('content');
    
    const title = getMetaTag('title') || $('title').text() || '';
    const description = getMetaTag('description') || '';
    let image = getMetaTag('image') || '';

    // 상대 경로 이미지 URL을 절대 경로로 변환
    if (image && !image.startsWith('http')) {
      const urlObject = new URL(url);
      image = new URL(image, urlObject.origin).href;
    }
    
    return {
      success: true,
      title: title.trim(),
      description: description.trim(),
      image,
    };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error.message);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fetch-google-sheet', async (event, url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        // 구글 시트는 보통 UTF-8로 인코딩되어 있습니다.
        const decoder = new TextDecoder('utf-8');
        const csvText = decoder.decode(response.data);
        return csvText;
    } catch (error) {
        console.error(`Failed to fetch Google Sheet at ${url}:`, error);
        return null;
    }
});


// ▼▼▼ [추가] 자동 업데이트 이벤트 리스너 (상세한 피드백을 위함) ▼▼▼

autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '업데이트 발견',
    message: '새로운 버전이 있습니다. 다운로드를 시작합니다.',
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
    type: 'info',
    title: '업데이트 준비 완료',
    message: '설치가 준비되었습니다. 앱을 다시 시작하여 업데이트를 적용합니다.',
    buttons: ['재시작', '나중에']
  }).then(buttonIndex => {
    if (buttonIndex.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  dialog.showErrorBox('업데이트 오류', err == null ? "알 수 없는 오류" : (err.stack || err).toString());
});