// 파일: src/components/ConversationList.js (원래대로 복구)

import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db';
import IndexedDBImage from './IndexedDBImage';
import ContextMenu from './ContextMenu';

// ImageSlider 컴포넌트: 파일 선택 시 부모로 이벤트를 전달하는 역할만 하도록 단순화
const ImageSlider = ({ images, onSelect, onAdd, onDelete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const safeImages = images || [];
    if (safeImages.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= safeImages.length) {
      setCurrentIndex(safeImages.length - 1);
    }
  }, [images, currentIndex]);

  const prevSlide = (e) => {
    e.stopPropagation();
    const safeImages = images || [];
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? safeImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    const safeImages = images || [];
    const isLastSlide = currentIndex === safeImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleAddClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onAdd(file); // 선택된 파일을 부모(Workspace)로 전달
    }
    e.target.value = null;
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    const safeImages = images || [];
    if (safeImages.length > 0 && window.confirm('이 이미지를 삭제하시겠습니까?')) {
      onDelete(safeImages[currentIndex]);
    }
  };

  const handleSelect = async () => {
    const safeImages = images || [];
    if (safeImages.length > 0) {
      const imageRecord = await db.images.get(safeImages[currentIndex]);
      if (imageRecord && imageRecord.data) {
        onSelect(imageRecord.data); // Blob 데이터를 부모(Workspace)로 전달
      }
    }
  };

  return (
    <div className="conversation-list-slider">
      {(images || []).length > 0 ? (
        <>
          <div className="slider-arrow left" onClick={prevSlide}><i className="fas fa-chevron-left"></i></div>
          <div className="slide-image-container" onClick={handleSelect} title="클릭하여 대화 배경 이미지로 설정">
            <IndexedDBImage imageId={images[currentIndex]} className="slide-image-large" />
          </div>
          <div className="slider-controls">
            <button onClick={handleAddClick} title="이미지 추가"><i className="fas fa-plus"></i></button>
            <button onClick={handleDelete} title="이미지 삭제"><i className="fas fa-trash-alt"></i></button>
          </div>
          <div className="slider-arrow right" onClick={nextSlide}><i className="fas fa-chevron-right"></i></div>
        </>
      ) : (
        <div className="slider-placeholder-large" onClick={handleAddClick}>
          <i className="fas fa-camera"></i>
          <span>클릭하여 첫 이미지 추가</span>
        </div>
      )}
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

const ConversationList = ({ 
  pairId,
  conversations, 
  selectedConversationId, 
  onSelectConversation, 
  onAddConversation,
  onEditConversation,
  onDeleteConversation,
  slideImages,
  onSelectSlideImage,
  onAddSlideImage,
  onDeleteSlideImage, 
}) => {
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newTags, setNewTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, convoId: null });

  const handleAddTag = () => { const trimmedTag = tagInput.trim(); if (trimmedTag && !newTags.includes(trimmedTag)) { setNewTags([...newTags, trimmedTag]); setTagInput(''); } };
  const handleTagInputKeyDown = (e) => { if (!e.nativeEvent.isComposing && e.key === 'Enter') { e.preventDefault(); handleAddTag(); } };
  const handleRemoveTag = (tagToRemove) => { setNewTags(newTags.filter(tag => tag !== tagToRemove)); };
  const handleAdd = (e) => {
    e.preventDefault();
    if (newConversationTitle.trim()) {
      onAddConversation(pairId, { title: newConversationTitle.trim(), tags: newTags });
      setNewConversationTitle('');
      setNewTags([]);
      setTagInput('');
    }
  };

  const handleContextMenu = (e, convoId) => { e.preventDefault(); setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, convoId }); };
  const handleCloseContextMenu = () => setContextMenu({ ...contextMenu, isOpen: false });
  
  const contextMenuItems = [
    { label: '수정', action: () => onEditConversation(contextMenu.convoId) },
    { isSeparator: true },
    { label: '삭제', className: 'delete', action: () => { if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) { onDeleteConversation(contextMenu.convoId); } } },
  ];

  return (
    <div className="conversation-list-container">
      <ImageSlider
        images={slideImages}
        onSelect={onSelectSlideImage}
        onAdd={onAddSlideImage}
        onDelete={onDeleteSlideImage}
      />

      <div className="conversation-list-header">
        <form onSubmit={handleAdd} className="add-conversation-form">
          <input
            type="text"
            value={newConversationTitle}
            onChange={(e) => setNewConversationTitle(e.target.value)}
            placeholder="새 로그 제목..."
            required
          />
          <div className="tag-input-area">
            <div className="tag-input-container">
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="태그 입력 후 Enter 또는 추가"
              />
              <button type="button" onClick={handleAddTag} title="태그 추가">
                <i className="fas fa-plus"></i>
              </button>
            </div>
            <div className="tags-preview">
              {(newTags || []).map((tag, index) => (
                <div key={index} className="tag-item-small">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" title="새 로그 추가하기">
            <i className="fas fa-check"></i> 추가하기
          </button>
        </form>
      </div>
      
      <ul className="conversation-list">
        {(conversations || []).map((convo) => (
          <li
            key={convo.id}
            className={`conversation-item ${convo.id === selectedConversationId ? 'selected' : ''}`}
            onClick={() => onSelectConversation(convo.id)}
            onContextMenu={(e) => handleContextMenu(e, convo.id)}
          >
            <span className="conversation-item-title">{convo.title}</span>
            {(convo.tags || []).length > 0 && (
              <div className="conversation-item-tags">
                {(convo.tags || []).map((tag, index) => ( <span key={index} className="tag-pill-small">{tag}</span> ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {contextMenu.isOpen && ( <ContextMenu position={contextMenu.position} onClose={handleCloseContextMenu} items={contextMenuItems.map(item => ({...item, action: () => { if(item.action) item.action(); handleCloseContextMenu(); }}))} /> )}
    </div>
  );
};

export default ConversationList;