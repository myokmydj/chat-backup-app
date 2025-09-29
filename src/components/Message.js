// File: src/components/Message.js (수정 완료)

import React from 'react';
import IndexedDBImage from './IndexedDBImage';
import IndexedDBVideo from './IndexedDBVideo';

// ▼▼▼ [수정] character prop 대신 characters (버전 배열)와 versionId를 받습니다.
const Message = ({ message, characters, versionId, onContextMenu, onAvatarClick }) => {
  const isMe = message.sender === 'Me' || message.sender === 'me';
  const rowClassName = `message-row ${isMe ? 'me' : 'other'}`;
  
  // ▼▼▼ [수정] versionId에 해당하는 캐릭터 프로필을 찾습니다. 없으면 첫 번째 버전을 사용합니다.
  const character = (Array.isArray(characters) && characters.find(v => v.id === versionId)) || (Array.isArray(characters) ? characters[0] : null);

  const handleContextMenu = (e) => {
    e.preventDefault();
    onContextMenu(e, message.id);
  };
  
  const handleAvatarClick = (e) => {
    e.stopPropagation();
    if (onAvatarClick && character) { // character가 유효할 때만 호출
      onAvatarClick(character, e.currentTarget);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return <IndexedDBImage imageId={message.content} className="message-media" />;
      case 'video':
        return <IndexedDBVideo videoId={message.content} className="message-media" />;
      
      case 'embed':
        const { service, embedUrl } = message.content;
        return (
          <div className={`embed-container ${service}`}>
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title={`${service} embed`}
            ></iframe>
          </div>
        );
      
      case 'link':
        const { url, service: linkService, title, description, image } = message.content;
        const handleOpenLink = (e) => {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        };
        // ▼▼▼ [핵심 수정] a 태그에 onContextMenu 핸들러를 추가하여 우클릭 이벤트를 정상적으로 처리합니다. ▼▼▼
        return (
          <a href={url} onClick={handleOpenLink} className="link-preview-card" target="_blank" rel="noopener noreferrer" onContextMenu={handleContextMenu}>
            {image && <img src={image} alt={title} className="link-preview-image" />}
            <div className="link-preview-content">
              <div className="link-preview-title">{title}</div>
              <div className="link-preview-description">{description}</div>
              <div className="link-preview-service">{linkService}</div>
            </div>
          </a>
        );

      case 'text':
      default:
        const textToRender = typeof message.content === 'string' ? message.content : (message.text || '');
        return <div className="message-text" dangerouslySetInnerHTML={{ __html: textToRender }}></div>;
    }
  };
  
  const isMedia = ['image', 'video', 'embed', 'link'].includes(message.type);
  const bubbleClassName = `message-bubble ${isMe ? 'me' : 'other'} ${isMedia ? 'media' : ''}`;

  return (
    <div className={rowClassName} id={`message-${message.id}`}>
      <div className="message-avatar-container" onClick={handleAvatarClick}>
        {character && character.avatar && (
          <IndexedDBImage imageId={character.avatar} className="message-avatar" />
        )}
      </div>
      <div className="message-content-container">
        {character && character.name && (
          <div className="message-sender-name">{character.name}</div>
        )}
        <div className="message-bubble-container">
          <div className={bubbleClassName} onContextMenu={handleContextMenu}>
            {renderMessageContent()}
            {message.bookmarked && <i className="fas fa-bookmark message-bookmark-icon"></i>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;