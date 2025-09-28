// File: src/components/TextStickerModal.js

import React, { useState, useRef } from 'react';
import SettingsModal from './SettingsModal';
import CustomSlider from './CustomSlider';

const FONT_OPTIONS = [
  "'Paperozi', sans-serif",
  "'Presentation', sans-serif",
  "'Noto Sans KR', sans-serif",
  "Arial, sans-serif",
  "'Courier New', monospace",
  "'Comic Sans MS', cursive",
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


const TextStickerModal = ({ isOpen, onClose, onAdd }) => {
  const [text, setText] = useState('스티커 텍스트');
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0]);
  const [fontSize, setFontSize] = useState(48);
  const [fontWeight, setFontWeight] = useState(400);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [backgroundColor, setBackgroundColor] = useState('#5865F2');
  const [isTransparent, setIsTransparent] = useState(false);
  const [borderRadius, setBorderRadius] = useState(20);
  const previewRef = useRef(null);

  const finalBackgroundColor = isTransparent ? 'transparent' : backgroundColor;

  const handleCreate = async () => {
    if (!text.trim()) {
      alert('텍스트를 입력해주세요.');
      return;
    }
    
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

    const padding = 20 + strokeWidth;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const lines = text.split('\n');
    const lineHeight = textMetrics.height / lines.length;
    canvas.width = textMetrics.width + padding * 2;
    canvas.height = (lineHeight * lines.length) + padding * 2;

    if (!isTransparent) {
      ctx.fillStyle = backgroundColor;
      roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
      ctx.fill();
    }

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.letterSpacing = `${letterSpacing}px`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = canvas.width / 2;
    const startY = (canvas.height / 2) - (lineHeight * (lines.length - 1) / 2);

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
    onAdd(blob);
    onClose();
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="텍스트 스티커 만들기">
      <div className="text-sticker-modal-content utility-panel">
        <div className="form-card">
          <label className="card-label">미리보기</label>
          <div 
            className="text-sticker-preview" 
            style={{ 
              backgroundColor: finalBackgroundColor,
              borderRadius: `${borderRadius}px`
            }}
          >
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
              {FONT_OPTIONS.map(font => (
                <option key={font} value={font}>{font.split(',')[0].replace(/'/g, '')}</option>
              ))}
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

        <button type="button" className="btn-primary" onClick={handleCreate}>생성하기</button>
      </div>
    </SettingsModal>
  );
};

export default TextStickerModal;