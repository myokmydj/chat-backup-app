// File: src/components/BookmarkPanel.js (수정 완료)

import React from 'react';
import IndexedDBImage from './IndexedDBImage';

const BookmarkPanel = ({ isOpen, onClose, bookmarks, onBookmarkClick, characters }) => {
  // ▼▼▼ [수정] 캐릭터 버전을 찾는 헬퍼 함수 ▼▼▼
  const getCharacterVersion = (sender, versionId) => {
    const key = (sender === 'Me' || sender === 'me') ? 'me' : 'other';
    const versions = (Array.isArray(characters[key]) ? characters[key] : []);
    if (versions.length === 0) return {};
    
    return versions.find(v => v.id === versionId) || versions[0];
  };

  const renderContent = (message) => {
    switch (message.type) {
      case 'image': return '[이미지]';
      case 'video': return '[비디오]';
      case 'embed': return `[링크: ${message.content.service}]`;
      case 'text':
      default:
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message.content || message.text || '';
        return tempDiv.textContent || tempDiv.innerText || '';
    }
  };

  return (
    <>
      <div className={`bookmark-panel-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`bookmark-panel ${isOpen ? 'open' : ''}`}>
        <div className="bookmark-panel-header">
          <h3><i className="fas fa-bookmark"></i> 북마크</h3>
          <button onClick={onClose} className="panel-close-btn">&times;</button>
        </div>
        <div className="bookmark-list">
          {bookmarks && bookmarks.length > 0 ? (
            bookmarks.map(bookmark => {
              // ▼▼▼ [수정] 메시지에 저장된 버전 ID로 캐릭터 정보 조회 ▼▼▼
              const character = getCharacterVersion(bookmark.sender, bookmark.characterVersionId);
              return (
                <div key={bookmark.id} className="bookmark-item" onClick={() => onBookmarkClick(bookmark.id)}>
                  <div className="bookmark-item-avatar">
                    {character.avatar && <IndexedDBImage imageId={character.avatar} />}
                  </div>
                  <div className="bookmark-item-content">
                    <div className="bookmark-item-sender">{character.name}</div>
                    <div className="bookmark-item-text">{renderContent(bookmark)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bookmark-empty">
              <i className="fas fa-book-open"></i>
              <p>북마크된 메시지가 없습니다.</p>
              <span>메시지를 우클릭하여 북마크에 추가해 보세요.</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BookmarkPanel;