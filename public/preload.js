// File: public/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('minimize-app'),
  maximize: () => ipcRenderer.send('maximize-app'),
  close: () => ipcRenderer.send('close-app'),

  // Feature APIs
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  fetchLinkMetadata: (url) => ipcRenderer.invoke('fetch-link-metadata', url),
  fetchGoogleSheet: (url) => ipcRenderer.invoke('fetch-google-sheet', url),
  
  // [제거 완료] 트위터 관련 함수가 삭제되었습니다.
});