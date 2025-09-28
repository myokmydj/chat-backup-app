// File: src/components/StickerEffectsModal.js (수정 완료)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import CustomSlider from './CustomSlider';

// ▼▼▼ [수정] DEFAULT_EFFECTS에 border와 borderRadius 복원 ▼▼▼
const DEFAULT_EFFECTS = {
  border: { enabled: false, color: '#FFFFFF', width: 2 },
  shadow: { enabled: false, color: '#000000', blur: 5, offsetX: 2, offsetY: 2 },
  gradient: { enabled: false, color: '#000000', intensity: 50 },
  animation: { type: 'none' },
  borderRadius: { value: 0 },
};

const StickerEffectsModal = ({ isOpen, onClose, stickerData, onSave, onLiveUpdate }) => {
  const [effects, setEffects] = useState(DEFAULT_EFFECTS);
  const [initialEffects, setInitialEffects] = useState(DEFAULT_EFFECTS);

  useEffect(() => {
    if (isOpen && stickerData) {
      // ▼▼▼ [수정] 병합 로직에 border와 borderRadius 다시 포함 ▼▼▼
      const currentEffects = {
        ...DEFAULT_EFFECTS,
        ...(stickerData.effects || {}),
        border: { ...DEFAULT_EFFECTS.border, ...(stickerData.effects?.border || {}) },
        shadow: { ...DEFAULT_EFFECTS.shadow, ...(stickerData.effects?.shadow || {}) },
        gradient: { ...DEFAULT_EFFECTS.gradient, ...(stickerData.effects?.gradient || {}) },
        animation: { ...DEFAULT_EFFECTS.animation, ...(stickerData.effects?.animation || {}) },
        borderRadius: { ...DEFAULT_EFFECTS.borderRadius, ...(stickerData.effects?.borderRadius || {}) },
      };
      setEffects(currentEffects);
      setInitialEffects(currentEffects);
    }
  }, [isOpen, stickerData]);

  useEffect(() => {
    if (isOpen && onLiveUpdate) {
      onLiveUpdate(effects);
    }
  }, [effects, isOpen, onLiveUpdate]);
  
  const handleClose = () => {
      onLiveUpdate(initialEffects);
      onClose();
  };

  const handleToggle = (effect) => {
    setEffects(prev => ({ ...prev, [effect]: { ...prev[effect], enabled: !prev[effect].enabled } }));
  };

  const handleValueChange = (effect, key, value) => {
    setEffects(prev => ({ ...prev, [effect]: { ...prev[effect], [key]: value } }));
  };
  
  const handleAnimationChange = (e) => {
    setEffects(prev => ({ ...prev, animation: { type: e.target.value } }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(effects);
    onClose();
  };

  if (!stickerData) return null;

  // ▼▼▼ [신규] 텍스트 스티커 여부 확인 (테두리/둥글기 UI를 숨기기 위함) ▼▼▼
  const isTextSticker = stickerData.isTextSticker === true;

  return (
    <SettingsModal isOpen={isOpen} onClose={handleClose} title="스티커 효과 편집">
      <form onSubmit={handleSubmit} className="utility-panel">
        <div className="fx-modal-grid">

          {/* ▼▼▼ [수정] 텍스트 스티커가 아닐 때만 테두리/둥글기 UI를 렌더링 ▼▼▼ */}
          {!isTextSticker && (
            <div className="form-card fx-group">
              <div className="card-label fx-header">
                <label>테두리</label>
                <input type="checkbox" className="toggle-switch" checked={effects.border.enabled} onChange={() => handleToggle('border')} />
              </div>
              <div className="fx-controls">
                <div className="fx-control">
                  <span>색상</span>
                  <input type="color" value={effects.border.color} onChange={(e) => handleValueChange('border', 'color', e.target.value)} />
                </div>
                <div className="fx-control slider">
                  <span>굵기</span>
                  <CustomSlider min="1" max="20" step="1" value={effects.border.width} onChange={(e) => handleValueChange('border', 'width', parseInt(e.target.value))} />
                  <span>{effects.border.width}px</span>
                </div>
                <div className="fx-control slider">
                  <span>둥글기</span>
                  <CustomSlider min="0" max="100" step="1" value={effects.borderRadius.value} onChange={(e) => handleValueChange('borderRadius', 'value', parseInt(e.target.value))} />
                  <span>{effects.borderRadius.value}px</span>
                </div>
              </div>
            </div>
          )}

          {/* 그림자 효과 */}
          <div className="form-card fx-group">
            <div className="card-label fx-header">
              <label>그림자</label>
              <input type="checkbox" className="toggle-switch" checked={effects.shadow.enabled} onChange={() => handleToggle('shadow')} />
            </div>
            <div className="fx-controls">
              <div className="fx-control">
                <span>색상</span>
                <input type="color" value={effects.shadow.color} onChange={(e) => handleValueChange('shadow', 'color', e.target.value)} />
              </div>
              <div className="fx-control slider">
                <span>흐림</span>
                <CustomSlider min="0" max="30" step="1" value={effects.shadow.blur} onChange={(e) => handleValueChange('shadow', 'blur', parseInt(e.target.value))} />
                <span>{effects.shadow.blur}px</span>
              </div>
              <div className="fx-control slider">
                <span>X축</span>
                <CustomSlider min="-20" max="20" step="1" value={effects.shadow.offsetX} onChange={(e) => handleValueChange('shadow', 'offsetX', parseInt(e.target.value))} />
                <span>{effects.shadow.offsetX}px</span>
              </div>
              <div className="fx-control slider">
                <span>Y축</span>
                <CustomSlider min="-20" max="20" step="1" value={effects.shadow.offsetY} onChange={(e) => handleValueChange('shadow', 'offsetY', parseInt(e.target.value))} />
                <span>{effects.shadow.offsetY}px</span>
              </div>
            </div>
          </div>

          {/* 그라데이션 오버레이 */}
          <div className="form-card fx-group">
             <div className="card-label fx-header">
              <label>그라데이션</label>
              <input type="checkbox" className="toggle-switch" checked={effects.gradient.enabled} onChange={() => handleToggle('gradient')} />
            </div>
            <div className="fx-controls">
                <div className="fx-control">
                    <span>색상</span>
                    <input type="color" value={effects.gradient.color} onChange={(e) => handleValueChange('gradient', 'color', e.target.value)} />
                </div>
                <div className="fx-control slider">
                    <span>세기</span>
                    <CustomSlider min="0" max="100" step="1" value={effects.gradient.intensity} onChange={(e) => handleValueChange('gradient', 'intensity', parseInt(e.target.value))} />
                    <span>{effects.gradient.intensity}%</span>
                </div>
            </div>
          </div>

          {/* 애니메이션 */}
           <div className="form-card fx-group">
             <div className="card-label fx-header"> <label>애니메이션</label> </div>
            <div className="fx-controls">
                <select value={effects.animation.type} onChange={handleAnimationChange}>
                    <option value="none">없음</option> <option value="bounce">바운스</option> <option value="float">둥실둥실</option>
                </select>
            </div>
          </div>

        </div>
        <button type="submit" className="btn-primary">효과 저장하기</button>
      </form>
    </SettingsModal>
  );
};

export default StickerEffectsModal;