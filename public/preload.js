// 파일: public/preload.js (아래 코드로 전체 교체)

const { contextBridge, ipcRenderer } = require('electron');

// ▼▼▼ 이 로그가 개발자 도구 콘솔에 찍히는지 확인하는 것이 핵심입니다 ▼▼▼
console.log("--- PRELOAD SCRIPT IS RUNNING ---. If you see this, preload is working.");

contextBridge.exposeInMainWorld('electronAPI', {
  // 창 제어 API
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),

  // 링크 메타데이터 가져오기 API
  fetchLinkMetadata: (url) => ipcRenderer.invoke('fetch-link-metadata', url)
});