// public/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // --- ▼▼▼ Main 프로세스에 폰트 목록을 요청하는 함수 ▼▼▼ ---
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),

  // --- ▼▼▼ 창 조절 및 링크 메타데이터 함수들 ▼▼▼ ---
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
  fetchLinkMetadata: (url) => ipcRenderer.invoke('fetch-link-metadata', url)
});