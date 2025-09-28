// File: src/components/ProfilePopover.js (수정 완료)

import React, { useEffect, useRef, useState } from 'react';
import IndexedDBImage from './IndexedDBImage';

const ProfilePopover = ({ character, anchorEl, onClose }) => {
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (anchorEl && popoverRef.current) {
      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      
      let top = anchorRect.top;
      let left = anchorRect.right + 12;

      if (left + popoverRect.width > window.innerWidth) {
        left = anchorRect.left - popoverRect.width - 12;
      }
      
      if (top + popoverRect.height > window.innerHeight) {
        top = window.innerHeight - popoverRect.height - 12;
      }
      if (top < 0) {
        top = 12;
      }

      setPosition({ top, left });
    }
  }, [anchorEl]);

  if (!character || !character.id) return null; // ▼▼▼ [수정] character.id 유무도 확인

  const headerStyle = {
    background: character.headerColor2
      ? `linear-gradient(to right, ${character.headerColor1}, ${character.headerColor2})`
      : character.headerColor1,
  };

  return (
    <div
      ref={popoverRef}
      className="profile-popover"
      style={{ top: position.top, left: position.left, opacity: position.top > 0 ? 1 : 0 }}
    >
      <div className="popover-banner">
        <div className="popover-header" style={headerStyle}></div>
        {character.profileBanner && <IndexedDBImage imageId={character.profileBanner} />}
      </div>
      <div className="popover-avatar-wrapper">
        <div className="popover-avatar">
          {character.avatar && <IndexedDBImage imageId={character.avatar} />}
        </div>
      </div>
      <div className="popover-content">
        <div className="popover-names">
          {/* ▼▼▼ [수정] 표시 이름을 버전 이름(name)으로 변경 ▼▼▼ */}
          <span className="popover-display-name">{character.name}</span>
          <span className="popover-username">{character.username}</span>
        </div>
        {character.statusMessage && (
          <div className="popover-status">
            <i className="fas fa-comment-dots"></i>
            <span>{character.statusMessage}</span>
          </div>
        )}
        {(character.memo || (character.tags && character.tags.length > 0)) && (
          <div className="popover-divider"></div>
        )}
        {character.memo && (
          <div className="popover-memo">
            <h4>메모</h4>
            <p>{character.memo}</p>
          </div>
        )}
        {character.tags && character.tags.length > 0 && (
          <div className="popover-tags">
            {(character.tags || []).map((tag, index) => (
              <span key={index} className="popover-tag-pill">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePopover;