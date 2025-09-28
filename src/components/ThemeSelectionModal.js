// 파일: src/components/ThemeSelectionModal.js (새 파일)

import React from 'react';
import SettingsModal from './SettingsModal';

const ThemePreview = ({ theme, onSelect }) => {
  if (!theme) return null;

  return (
    <div className="theme-preview-card" onClick={() => onSelect(theme)}>
      <h4 className="theme-preview-title">{theme.name}</h4>
      <div className="theme-preview-palette">
        <div className="theme-preview-colorbox" style={{ backgroundColor: theme.sidebarBg, color: theme.textColor }}>BG</div>
        <div className="theme-preview-colorbox" style={{ backgroundColor: theme.bubbleMeBg, color: getLuminance(theme.bubbleMeBg) > 128 ? '#000' : '#FFF' }}>Me</div>
        <div className="theme-preview-colorbox" style={{ backgroundColor: theme.bubbleOtherBg, color: getLuminance(theme.bubbleOtherBg) > 128 ? '#000' : '#FFF' }}>Other</div>
        <div className="theme-preview-colorbox" style={{ backgroundColor: theme.buttonBg, color: getLuminance(theme.buttonBg) > 128 ? '#000' : '#FFF' }}>Accent</div>
      </div>
    </div>
  );
};

// getLuminance 함수를 모달 내부에 간단히 복사하여 사용
function getLuminance(hex) {
    try {
        const rgb = parseInt(hex.slice(1), 16);
        const r = (rgb >> 16) & 0xff, g = (rgb >> 8) & 0xff, b = (rgb >> 0) & 0xff;
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch(e) { return 0; }
}

const ThemeSelectionModal = ({ isOpen, onClose, themes, onSelectTheme }) => {
  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="테마 선택">
      <div className="theme-selection-container">
        <p className="theme-selection-description">이미지에서 추출한 테마들입니다. 마음에 드는 스타일을 선택하세요.</p>
        <div className="theme-previews-grid">
          {(themes || []).map((theme, index) => (
            <ThemePreview key={index} theme={theme} onSelect={onSelectTheme} />
          ))}
        </div>
        {(!themes || themes.length === 0) && (
            <p>이 이미지에서는 추천 테마를 생성할 수 없습니다.</p>
        )}
      </div>
    </SettingsModal>
  );
};

export default ThemeSelectionModal;