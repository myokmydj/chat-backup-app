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

  if (!items || items.length === 0) {
    return null;
  }

  const renderMenuItem = (item, index) => {
    if (item.isSeparator) {
      return <li key={`separator-${index}`} className="separator"></li>;
    }

    const hasSubmenu = item.submenu && item.submenu.length > 0;

    return (
      <li
        key={item.label}
        onClick={(e) => {
          if (!hasSubmenu && item.action) {
            item.action();
            onClose();
          } else if (!hasSubmenu) {
            onClose();
          }
          // 하위 메뉴가 있는 경우, 클릭해도 메뉴가 닫히지 않도록 함
        }}
        className={`${item.className || ''} ${hasSubmenu ? 'has-submenu' : ''}`}
      >
        {item.label}
        {hasSubmenu && (
          <div className="context-menu submenu">
            <ul>
              {item.submenu.map(renderMenuItem)}
            </ul>
          </div>
        )}
      </li>
    );
  };

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ top: position.y, left: position.x }}
    >
      <ul>
        {items.map(renderMenuItem)}
      </ul>
    </div>
  );
};

export default ContextMenu;