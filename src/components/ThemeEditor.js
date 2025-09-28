// 파일: src/components/ThemeEditor.js (오류 수정 완료)

import React, { useState } from 'react';

const ThemeEditor = ({ theme, onThemeChange, options }) => {
  // ▼▼▼ [핵심 수정] useState를 올바르게 사용하여 상태와 세터 함수를 선언합니다. ▼▼▼
  const [activeTab, setActiveTab] = useState('colors');

  const handleChange = (e) => {
    const { name, value } = e.target;
    onThemeChange({ ...theme, [name]: value });
  };
  
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    onThemeChange({ ...theme, [name]: parseInt(value, 10) });
  };

  if (!theme) return <div>테마 데이터를 불러오는 중...</div>;

  const colorOptions = options.filter(opt => opt.group === 'colors');
  const layoutOptions = options.filter(opt => opt.group === 'layout');

  return (
    <div className="theme-editor-container">
      <div className="theme-editor-tabs">
        <button 
          className={`tab-btn ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          색상
        </button>
        <button 
          className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          레이아웃
        </button>
      </div>

      <div className="theme-editor-content">
        {activeTab === 'colors' && (
          <div className="theme-editor-grid">
            {colorOptions.map(option => (
              <div key={option.key} className="theme-option">
                <label htmlFor={option.key}>{option.label}</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    id={option.key}
                    name={option.key}
                    value={theme[option.key] || '#000000'}
                    onChange={handleChange}
                  />
                  <input
                    type="text"
                    className="color-text-input"
                    name={option.key}
                    value={String(theme[option.key] || '').toUpperCase()}
                    onChange={handleChange}
                    maxLength="7"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="layout-settings-grid">
            {layoutOptions.map(option => (
              <div key={option.key} className="font-control-group">
                <label htmlFor={`${option.key}-slider`}>{option.label}</label>
                <div className="slider-container">
                  <input
                    type="range"
                    id={`${option.key}-slider`}
                    name={option.key}
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    value={theme[option.key] || option.default}
                    onChange={handleSliderChange}
                  />
                  <span>{theme[option.key] || option.default}{option.unit}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeEditor;