// File: src/components/TextStickerModal.js

import React, { useState, useRef, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import CustomSlider from './CustomSlider';

const WEB_FONT_OPTIONS = [
  { name: '페이퍼로지', value: "'Paperozi', sans-serif" },
  { name: '프리젠테이션', value: "'Presentation', sans-serif" },
  { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif" },
  { name: 'Arial', value: "Arial, sans-serif" },
  { name: 'Courier New', value: "'Courier New', monospace" },
  { name: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
];

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  return ctx;
}

function drawSpeechBubble(ctx, x, y, width, height, radius) {
  const tailWidth = 20;
  const tailHeight = 15;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  
  ctx.lineTo(x + width / 2 + tailWidth / 2, y + height);
  ctx.lineTo(x + width / 2, y + height + tailHeight);
  ctx.lineTo(x + width / 2 - tailWidth / 2, y + height);
  
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

const hexToRgba = (hex, alpha) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
};

// ▼▼▼ [수정] Props 변경: onAdd -> onComplete, editingStickerData 추가 ▼▼▼
const TextStickerModal = ({ isOpen, onClose, onComplete, availableFonts, editingStickerData = null }) => {
  const [text, setText] = useState('스티커 텍스트');
  const [fontFamily, setFontFamily] = useState(WEB_FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(400);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [backgroundColor, setBackgroundColor] = useState('#5865F2');
  const [isTransparent, setIsTransparent] = useState(false);
  const [borderRadius, setBorderRadius] = useState(20);
  const [stickerStyle, setStickerStyle] = useState('default');
  const previewRef = useRef(null);
  
  // ▼▼▼ [신규] 수정 모드일 때 상태를 초기화하는 useEffect ▼▼▼
  useEffect(() => {
    if (isOpen) {
      if (editingStickerData) {
        // 수정 모드: 기존 데이터로 상태 설정
        setText(editingStickerData.text || '스티커 텍스트');
        setFontFamily(editingStickerData.fontFamily || WEB_FONT_OPTIONS[0].value);
        setFontSize(editingStickerData.fontSize || 48);
        setFontWeight(editingStickerData.fontWeight || 400);
        setLetterSpacing(editingStickerData.letterSpacing || 0);
        setTextColor(editingStickerData.textColor || '#FFFFFF');
        setStrokeColor(editingStickerData.strokeColor || '#000000');
        setStrokeWidth(editingStickerData.strokeWidth || 2);
        setBackgroundColor(editingStickerData.backgroundColor || '#5865F2');
        setIsTransparent(editingStickerData.isTransparent || false);
        setBorderRadius(editingStickerData.borderRadius || 20);
        setStickerStyle(editingStickerData.stickerStyle || 'default');
      } else {
        // 생성 모드: 기본값으로 상태 초기화
        setText('스티커 텍스트');
        setFontFamily(WEB_FONT_OPTIONS[0].value);
        setFontSize(48);
        setFontWeight(400);
        setLetterSpacing(0);
        setTextColor('#FFFFFF');
        setStrokeColor('#000000');
        setStrokeWidth(2);
        setBackgroundColor('#5865F2');
        setIsTransparent(false);
        setBorderRadius(20);
        setStickerStyle('default');
      }
    }
  }, [isOpen, editingStickerData]);


  const getFinalBackgroundColor = () => {
    if (isTransparent) return 'transparent';
    if (stickerStyle === 'glass') return hexToRgba(backgroundColor, 0.6);
    return backgroundColor;
  }

  // ▼▼▼ [수정] 함수 이름 변경: handleCreate -> handleComplete ▼▼▼
  const handleComplete = async () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }
    
    // ... (캔버스 생성 로직은 이전과 동일)
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    tempDiv.style.letterSpacing = `${letterSpacing}px`;
    tempDiv.style.whiteSpace = 'pre';
    tempDiv.textContent = text;
    document.body.appendChild(tempDiv);
    const textMetrics = tempDiv.getBoundingClientRect();
    document.body.removeChild(tempDiv);

    let padding = 20 + strokeWidth;
    let canvasWidth, canvasHeight;
    const lines = text.split('\n');
    const lineHeight = textMetrics.height / lines.length;

    if (stickerStyle === 'speechBubble') {
      canvasWidth = textMetrics.width + padding * 2;
      canvasHeight = (lineHeight * lines.length) + padding * 2 + 15;
    } else if (stickerStyle === 'macWindow') {
      padding = Math.max(padding, 24);
      canvasWidth = textMetrics.width + padding * 2;
      canvasHeight = (lineHeight * lines.length) + padding * 2;
    } else {
      canvasWidth = textMetrics.width + padding * 2;
      canvasHeight = (lineHeight * lines.length) + padding * 2;
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!isTransparent) {
        ctx.fillStyle = (stickerStyle === 'glass') ? hexToRgba(backgroundColor, 0.7) : backgroundColor;
        switch (stickerStyle) {
            case 'speechBubble':
                drawSpeechBubble(ctx, 0, 0, canvas.width, canvas.height - 15, borderRadius);
                ctx.fill();
                break;
            case 'glass':
                roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.stroke();
                break;
            case 'macWindow':
            case 'default':
            default:
                roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
                ctx.fill();
                break;
        }
    }
    
    if (stickerStyle === 'macWindow') {
        const dotRadius = 6;
        const dotY = 18;
        ctx.fillStyle = '#FF5F56';
        ctx.beginPath();
        ctx.arc(20, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFBD2E';
        ctx.beginPath();
        ctx.arc(40, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#27C93F';
        ctx.beginPath();
        ctx.arc(60, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.letterSpacing = `${letterSpacing}px`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = canvas.width / 2;
    const textBlockHeight = lineHeight * lines.length;
    const contentAreaHeight = stickerStyle === 'speechBubble' ? canvas.height - 15 : canvas.height;
    const startY = (contentAreaHeight / 2) - (textBlockHeight / 2) + (lineHeight / 2);

    lines.forEach((line, index) => {
      const lineY = startY + (index * lineHeight);
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth * 2;
        ctx.strokeText(line, centerX, lineY);
      }
      ctx.fillStyle = textColor;
      ctx.fillText(line, centerX, lineY);
    });

    const dataUrl = canvas.toDataURL('image/png');
    const blob = dataURLtoBlob(dataUrl);

    // ▼▼▼ [수정] 부모에게 전달할 데이터 객체 생성 ▼▼▼
    // 이 객체는 스티커의 모든 속성을 포함하여 나중에 수정할 수 있도록 함
    const stickerPayload = {
        // 수정 모드인 경우 기존 데이터를 유지
        ...(editingStickerData || {}),
        
        // 새로 생성 시 기본값 설정
        id: editingStickerData?.id || `sticker_${Date.now()}`,
        x: editingStickerData?.x || 100,
        y: editingStickerData?.y || 100,
        width: editingStickerData?.width || 150,
        rotate: editingStickerData?.rotate || 0,
        effects: editingStickerData?.effects || {
            border: { enabled: false, color: '#FFFFFF', width: 2 },
            shadow: { enabled: false, color: '#000000', blur: 5, offsetX: 2, offsetY: 2 },
            gradient: { enabled: false, color: '#000000', intensity: 50 },
            animation: { type: 'none' },
            borderRadius: { value: 0 },
        },
        
        // 공통 속성
        isTextSticker: true,

        // 텍스트 스티커 전용 속성 (현재 UI 상태)
        text, fontFamily, fontSize, fontWeight, letterSpacing, textColor, 
        strokeColor, strokeWidth, backgroundColor, isTransparent, borderRadius, stickerStyle,
    };

    onComplete(stickerPayload, blob);
    onClose();
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title={editingStickerData ? "텍스트 스티커 수정" : "텍스트 스티커 만들기"}>
      <div className="text-sticker-modal-content utility-panel">
        <div className="form-card">
          <label className="card-label">미리보기</label>
          <div 
            className={`text-sticker-preview ${stickerStyle}`}
            style={{ 
              backgroundColor: getFinalBackgroundColor(),
              borderRadius: `${borderRadius}px`,
              backdropFilter: stickerStyle === 'glass' ? 'blur(8px)' : 'none',
              // ▼▼▼ [신규] CSS 변수를 이용해 말풍선 꼬리 색상 동적 변경 ▼▼▼
              '--preview-bg-color': getFinalBackgroundColor(),
            }}
          >
            {stickerStyle === 'macWindow' && (
                <div className="mac-dots-container">
                    <span className="mac-dot red"></span>
                    <span className="mac-dot yellow"></span>
                    <span className="mac-dot green"></span>
                </div>
            )}
            <span
              ref={previewRef}
              style={{
                fontFamily,
                fontSize: `${fontSize}px`,
                fontWeight: fontWeight,
                letterSpacing: `${letterSpacing}px`,
                color: textColor,
                WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
                whiteSpace: 'pre',
              }}
            >
              {text}
            </span>
          </div>
        </div>

        <div className="form-card">
            <label className="card-label">배경 스타일</label>
            <div className="sticker-style-selector">
                <button className={`style-option-btn ${stickerStyle === 'default' ? 'active' : ''}`} onClick={() => setStickerStyle('default')}>기본</button>
                <button className={`style-option-btn ${stickerStyle === 'macWindow' ? 'active' : ''}`} onClick={() => setStickerStyle('macWindow')}>macOS 창</button>
                <button className={`style-option-btn ${stickerStyle === 'glass' ? 'active' : ''}`} onClick={() => setStickerStyle('glass')}>유리 효과</button>
                <button className={`style-option-btn ${stickerStyle === 'speechBubble' ? 'active' : ''}`} onClick={() => setStickerStyle('speechBubble')}>말풍선</button>
            </div>
        </div>
        
        <div className="form-card">
          <label htmlFor="sticker-text-input" className="card-label">텍스트 내용</label>
          <textarea
            id="sticker-text-input"
            rows="3"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="스티커에 표시될 텍스트를 입력하세요."
          />
        </div>

        <div className="text-sticker-controls-grid">
          <div className="form-card">
            <label className="card-label">폰트 스타일</label>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
              <optgroup label="웹 폰트">
                {WEB_FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>{font.name}</option>
                ))}
              </optgroup>
              {availableFonts?.system && availableFonts.system.length > 0 && (
                <optgroup label="내 컴퓨터 폰트">
                  {availableFonts.system.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="slider-container">
              <CustomSlider min="12" max="128" step="1" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} />
              <span>{fontSize}px</span>
            </div>
            <div className="slider-container">
              <CustomSlider min="100" max="900" step="100" value={fontWeight} onChange={(e) => setFontWeight(parseInt(e.target.value))} />
              <span>{fontWeight}</span>
            </div>
            <div className="slider-container">
              <CustomSlider min="-5" max="20" step="0.5" value={letterSpacing} onChange={(e) => setLetterSpacing(parseFloat(e.target.value))} />
              <span>{letterSpacing.toFixed(1)}px</span>
            </div>
          </div>

          <div className="form-card">
            <label className="card-label">디자인</label>
            <div className="sticker-color-controls">
              <div>
                <span>텍스트</span>
                <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
              </div>
              <div>
                <span>테두리</span>
                <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} />
              </div>
              <div>
                <span>배경</span>
                <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} disabled={isTransparent} />
              </div>
            </div>
            <div className="slider-container">
              <span>테두리</span>
              <CustomSlider min="0" max="10" step="0.5" value={strokeWidth} onChange={(e) => setStrokeWidth(parseFloat(e.target.value))} />
              <span>{strokeWidth.toFixed(1)}px</span>
            </div>
            <div className="slider-container">
              <span>둥글기</span>
              <CustomSlider min="0" max="100" step="1" value={borderRadius} onChange={(e) => setBorderRadius(parseInt(e.target.value))} />
              <span>{borderRadius}px</span>
            </div>
             <div className="transparent-toggle">
              <input type="checkbox" id="transparent-bg" checked={isTransparent} onChange={(e) => setIsTransparent(e.target.checked)} />
              <label htmlFor="transparent-bg">투명 배경</label>
            </div>
          </div>
        </div>

        <button type="button" className="btn-primary" onClick={handleComplete}>
            {editingStickerData ? '수정하기' : '생성하기'}
        </button>
      </div>
    </SettingsModal>
  );
};

export default TextStickerModal;