// 파일: src/components/SettingsPanel.js

import React from 'react';
import ThemeEditor from './ThemeEditor';
import CustomSlider from './CustomSlider';

const globalThemeOptions = [
  { key: 'titleBarBg', label: '상단 타이틀 바 색상', group: 'colors' },
  { key: 'dashboardBg', label: '대시보드 배경 색상', group: 'colors' },
];

const SettingsPanel = ({ 
  availableFonts, 
  selectedFont, 
  onFontChange, 
  theme, 
  onThemeChange,
  fontSize,
  onFontSizeChange,
  letterSpacing,
  onLetterSpacingChange,
  // ▼▼▼ [추가] 타이틀 바 관련 props 수신 ▼▼▼
  titleBarText,
  onTitleBarTextChange,
}) => {
  return (
    <div className="settings-panel">
      {/* ▼▼▼ [추가] 전역 UI 설정 섹션 ▼▼▼ */}
      <div className="settings-section">
        <h3 className="settings-title">전역 UI 설정</h3>
        <label htmlFor="title-bar-text-input">타이틀 바 텍스트</label>
        <input
          id="title-bar-text-input"
          type="text"
          value={titleBarText}
          onChange={(e) => onTitleBarTextChange(e.target.value)}
          className="settings-input"
        />
      </div>

      <div className="settings-section">
        <h3 className="settings-title">폰트 설정</h3>
        <label htmlFor="font-select">에디터 폰트</label>
        <select id="font-select" value={selectedFont} onChange={onFontChange}>
          <optgroup label="추천 웹 폰트">
            {availableFonts.web.map(font => (
              <option key={font.name} value={font.value}>{font.name}</option>
            ))}
          </optgroup>
          {availableFonts.system.length > 0 && (
            <optgroup label="내 컴퓨터 폰트">
              {availableFonts.system.map(font => (
                <option key={font} value={font}>{font}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
      
      <div className="settings-section">
        <h3 className="settings-title">폰트 상세 설정</h3>
        <div className="font-control-group">
          <label htmlFor="font-size-slider">폰트 크기</label>
          <div className="slider-container">
            <CustomSlider
              id="font-size-slider"
              min="12" max="20" step="0.5"
              value={fontSize} onChange={onFontSizeChange}
            />
            <span>{fontSize}px</span>
          </div>
        </div>
        <div className="font-control-group">
          <label htmlFor="letter-spacing-slider">자간</label>
          <div className="slider-container">
            <CustomSlider
              id="letter-spacing-slider"
              min="-1" max="3" step="0.1"
              value={letterSpacing} onChange={onLetterSpacingChange}
            />
            <span>{letterSpacing.toFixed(1)}px</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-title">전역 테마 설정</h3>
        <ThemeEditor 
          theme={theme} onThemeChange={onThemeChange} options={globalThemeOptions}
        />
      </div>
    </div>
  );
};

export default SettingsPanel;