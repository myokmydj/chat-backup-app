// File: src/components/Sticker.js

import React, { useEffect, useRef, useState } from 'react';
import IndexedDBImage from './IndexedDBImage';

const Sticker = ({ 
    stickerData, onUpdate, onDelete, isSelected, onSelect, onOpenFxModal,
    // ▼▼▼ [신규] 이벤트 핸들러 수신 ▼▼▼
    onContextMenu, onOpenStickerEditor
}) => {
  const stickerRef = useRef(null);
  const [stickerImageUrl, setStickerImageUrl] = useState(null);
  const interactionState = useRef({ type: null, initialData: null, finalData: null, startMouse: { x: 0, y: 0 }, startAngle: 0, startDistance: 1 });
  
  useEffect(() => { if (stickerRef.current && !interactionState.current.type) { const el = stickerRef.current; el.style.left = `${stickerData.x || 0}px`; el.style.top = `${stickerData.y || 0}px`; el.style.width = `${stickerData.width || 150}px`; el.style.transform = `rotate(${stickerData.rotate || 0}deg)`; } }, [stickerData]);
  const handleInteractionStart = (e, type) => { e.preventDefault(); e.stopPropagation(); onSelect(stickerData.id); if (!stickerRef.current) return; const state = interactionState.current; state.type = type; state.initialData = { ...stickerData }; const stickerRect = stickerRef.current.getBoundingClientRect(); const center = { x: stickerRect.left + stickerRect.width / 2, y: stickerRect.top + stickerRect.height / 2, }; state.startMouse = { x: e.clientX, y: e.clientY }; const dx = e.clientX - center.x; const dy = e.clientY - center.y; if (type === 'rotate') { state.startAngle = Math.atan2(dy, dx) * (180 / Math.PI); } else if (type === 'resize') { state.startDistance = Math.sqrt(dx * dx + dy * dy); } window.addEventListener('mousemove', handleInteractionMove); window.addEventListener('mouseup', handleInteractionEnd); };
  const handleInteractionMove = (e) => { e.preventDefault(); const state = interactionState.current; const stickerEl = stickerRef.current; if (!state.type || !state.initialData || !stickerEl) return; let newData = { ...state.initialData }; if (state.type === 'drag') { const dx = e.clientX - state.startMouse.x; const dy = e.clientY - state.startMouse.y; newData.x = state.initialData.x + dx; newData.y = state.initialData.y + dy; stickerEl.style.left = `${newData.x}px`; stickerEl.style.top = `${newData.y}px`; } else { const stickerRect = stickerEl.getBoundingClientRect(); const center = { x: stickerRect.left + stickerRect.width / 2, y: stickerRect.top + stickerRect.height / 2, }; const dx = e.clientX - center.x; const dy = e.clientY - center.y; if (state.type === 'resize') { const currentDistance = Math.sqrt(dx * dx + dy * dy); const scaleRatio = currentDistance / state.startDistance; newData.width = Math.max(30, state.initialData.width * scaleRatio); stickerEl.style.width = `${newData.width}px`; } else if (state.type === 'rotate') { const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI); const angleDelta = currentAngle - state.startAngle; newData.rotate = state.initialData.rotate + angleDelta; stickerEl.style.transform = `rotate(${newData.rotate}deg)`; } } state.finalData = newData; };
  const handleInteractionEnd = () => { const state = interactionState.current; if (state.finalData) { onUpdate(state.finalData); } Object.assign(state, { type: null, initialData: null, finalData: null, startMouse: { x: 0, y: 0 }, startAngle: 0, startDistance: 1, }); window.removeEventListener('mousemove', handleInteractionMove); window.removeEventListener('mouseup', handleInteractionEnd); };
  
  // ▼▼▼ [수정] onContextMenu prop을 직접 호출하도록 변경 ▼▼▼
  const handleContextMenu = (e) => {
    if (onContextMenu) {
      onContextMenu(e, stickerData);
    }
  };
  
  // ▼▼▼ [신규] 더블클릭 핸들러 추가 ▼▼▼
  const handleDoubleClick = () => {
    if (stickerData.isTextSticker && onOpenStickerEditor) {
      onOpenStickerEditor(stickerData);
    }
  };

  const handleFxClick = (e) => { e.stopPropagation(); onOpenFxModal(stickerData); };

  const generateEffectStyles = () => {
    const effects = stickerData.effects || {};
    const styles = {};

    const shadow = effects.shadow || {};
    if (shadow.enabled) {
      styles['--sticker-shadow'] = `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
    } else {
      styles['--sticker-shadow'] = 'none';
    }

    const animation = effects.animation || {};
    if (animation.type && animation.type !== 'none') {
      if (animation.type === 'bounce') styles.animation = 'bounce 1s infinite';
      else if (animation.type === 'float') styles.animation = 'float 3s ease-in-out infinite';
    } else {
      styles.animation = 'none';
    }

    const gradient = effects.gradient || {};
    if (gradient.enabled) {
      const { color, intensity } = gradient;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const alpha = intensity / 100;
      styles['--gradient-overlay'] = `linear-gradient(to top, rgba(${r},${g},${b},${alpha}) 0%, rgba(${r},${g},${b},0) 100%)`;
    } else {
      styles['--gradient-overlay'] = 'none';
    }
    
    if (!stickerData.isTextSticker) {
      const border = effects.border || {};
      if (border.enabled) {
        styles['--border-color'] = border.color;
        styles['--border-width'] = `${border.width}px`;
      } else {
        styles['--border-width'] = '0px';
      }
      
      const borderRadius = effects.borderRadius || {};
      styles['--border-radius'] = `${borderRadius.value || 0}px`;
    } else {
      styles['--border-width'] = '0px';
      styles['--border-radius'] = '0px';
    }

    if (stickerImageUrl) {
      styles['--sticker-mask-image'] = `url(${stickerImageUrl})`;
    }

    return styles;
  };

  return (
    <div
      ref={stickerRef}
      className={`sticker-wrapper ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left: `${stickerData.x || 0}px`,
        top: `${stickerData.y || 0}px`,
        width: `${stickerData.width || 150}px`,
        transform: `rotate(${stickerData.rotate || 0}deg)`,
        ...generateEffectStyles(),
      }}
      onMouseDown={(e) => handleInteractionStart(e, 'drag')}
      // ▼▼▼ [수정] 이벤트 핸들러 연결 ▼▼▼
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
    >
      <div className="sticker-border-container">
        <div className="sticker-image-container">
          <IndexedDBImage 
              imageId={stickerData.imageId} 
              className="sticker-image"
              onUrlLoad={setStickerImageUrl}
          />
        </div>
      </div>

      {isSelected && (
        <>
          <div className="sticker-handle rotate-handle" onMouseDown={(e) => handleInteractionStart(e, 'rotate')}>
            <i className="fas fa-sync-alt"></i>
          </div>
          <div className="sticker-handle resize-handle" onMouseDown={(e) => handleInteractionStart(e, 'resize')}>
            <i className="fas fa-expand-arrows-alt"></i>
          </div>
          <div className="sticker-handle fx-handle" onMouseDown={(e) => e.stopPropagation()} onClick={handleFxClick}>
            <i className="fas fa-magic"></i>
          </div>
        </>
      )}
    </div>
  );
};

export default Sticker;