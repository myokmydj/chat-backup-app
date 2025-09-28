// 파일: src/components/ContextMenu.js

import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ position, items, onClose }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 메뉴 항목이 없으면 렌더링하지 않음
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div 
      ref={menuRef}
      className="context-menu" 
      style={{ top: position.y, left: position.x }}
    >
      <ul>
        {items.map((item, index) => (
          // isSeparator가 true이면 구분선 렌더링
          item.isSeparator ? (
            <li key={`separator-${index}`} className="separator"></li>
          ) : (
            <li 
              key={item.label}
              onClick={() => {
                if (item.action) item.action();
                onClose(); // 메뉴 항목 클릭 후 메뉴 닫기
              }} 
              className={item.className || ''}
            >
              {item.label}
            </li>
          )
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;