// src/components/ConversationCard.js (수정 완료)
import React from 'react';

// onContextMenu prop과 드래그앤드롭 관련 props를 추가로 받도록 수정
const ConversationCard = ({ log, onSelect, onContextMenu, ...dragProps }) => {
  return (
    <div
      className={`conversation-card ${dragProps.isDragging ? 'dragging' : ''}`}
      style={{ backgroundImage: `url(${log.backgroundImage})` }}
      onClick={() => onSelect(log.id)}
      onContextMenu={onContextMenu}
      // ▼▼▼ NEW: 드래그앤드롭 이벤트 핸들러 연결 ▼▼▼
      draggable={dragProps.draggable}
      onDragStart={dragProps.onDragStart}
      onDragOver={dragProps.onDragOver}
      onDrop={dragProps.onDrop}
      onDragEnd={dragProps.onDragEnd}
    >
      <div className="card-content">
        <div className="card-title">{log.title}</div>
        <div className="card-tags">
          {(log.tags || []).map((tag, index) => (
            <span key={index} className="tag-pill">{tag}</span>
          ))}
        </div>
      </div>
      <div className="card-avatars">
        {(log.avatars || []).map((avatarUrl, index) => (
          <div
            key={index}
            className="card-avatar"
            style={{ backgroundImage: `url(${avatarUrl})` }}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationCard;