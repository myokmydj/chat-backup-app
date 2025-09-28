// 파일: src/components/TitleBar.js

import React from 'react';
import './TitleBar.css';

// onOpenSettings prop을 새로 받습니다.
const TitleBar = ({ bgColor, onOpenSettings }) => {
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  const titleBarStyle = {
    backgroundColor: bgColor || '#202225',
  };

  return (
    <div className="title-bar" style={titleBarStyle}>
      {/* 드래그 영역 */}
      <div className="title-bar-drag-region">
        <div className="title-text">씹덕의 세계로 오라</div>
      </div>

      {/* 아이콘 버튼 영역 */}
      <div className="window-controls">
        {/* ▼▼▼ 설정 버튼 추가 ▼▼▼ */}
        <button className="window-control-btn settings-btn" title="설정" onClick={onOpenSettings}>
          <i className="fas fa-cog"></i>
        </button>

        {/* 기존 윈도우 조절 버튼 */}
        <button className="window-control-btn" id="minimize-btn" onClick={handleMinimize}>
          <svg x="0px" y="0px" viewBox="0 0 10.2 1"><rect x="0" y="0" width="10.2" height="1"></rect></svg>
        </button>
        <button className="window-control-btn" id="maximize-btn" onClick={handleMaximize}>
          <svg viewBox="0 0 10 10"><path d="M0,0v10h10V0H0z M9,9H1V1h8V9z"></path></svg>
        </button>
        <button className="window-control-btn" id="close-btn" onClick={handleClose}>
          <svg viewBox="0 0 10 10"><polygon points="10.2,0.7 9.5,0 5.1,4.4 0.7,0 0,0.7 4.4,5.1 0,9.5 0.7,10.2 5.1,5.8 9.5,10.2 10.2,9.5 5.8,5.1"></polygon></svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;