// File: public/electron.js

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fontList = require('font-list');
const axios = require('axios');
const cheerio = require('cheerio');

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

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow.on('closed', () => (mainWindow = null));
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
        const decoder = new TextDecoder('utf-8');
        const csvText = decoder.decode(response.data);
        return csvText;
    } catch (error) {
        console.error(`Failed to fetch Google Sheet at ${url}:`, error);
        return null;
    }
});