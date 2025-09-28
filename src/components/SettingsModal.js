// 파일: src/components/SettingsModal.js (드래그 기능 추가 완료)

import React, { useState, useRef, useEffect } from 'react';

const SettingsModal = ({ isOpen, onClose, title, children, customContentClass = '' }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const modalRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialModalPos = useRef({ x: 0, y: 0 });

  // 모달이 열릴 때마다 위치를 중앙으로 초기화합니다.
  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);
  
  // 드래그 상태에 따라 window에 이벤트 리스너를 추가/제거합니다.
  useEffect(() => {
    const handleMouseMove = (e) => {
      // 시작점으로부터의 마우스 이동 거리를 계산합니다.
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      // 초기 모달 위치에 이동 거리를 더해 새 위치를 설정합니다.
      setPosition({
        x: initialModalPos.current.x + dx,
        y: initialModalPos.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      document.body.classList.add('is-dragging'); // 텍스트 선택 방지
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true }); // 한번 실행 후 자동 제거
    }
    
    return () => {
      document.body.classList.remove('is-dragging');
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    // 닫기 버튼이나 다른 컨트롤이 아닌 헤더 자체를 클릭했을 때만 드래그 시작
    if (e.target === e.currentTarget) {
        e.preventDefault();
        setIsDragging(true);
        // 드래그 시작 시점의 마우스 위치와 모달 위치를 기록합니다.
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialModalPos.current = { x: position.x, y: position.y };
    }
  };

  if (!isOpen) {
    return null;
  }
  
  // 모달의 위치를 transform으로 적용합니다.
  const modalStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        ref={modalRef}
        className={`modal-content ${customContentClass}`} 
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="modal-header is-draggable" // 드래그 핸들임을 나타내는 클래스 추가
          onMouseDown={handleMouseDown}
        >
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;