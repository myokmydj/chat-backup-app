// 파일: src/components/ConversationList.js (수정 완료)

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { db } from '../db';
import IndexedDBImage from './IndexedDBImage';
import ContextMenu from './ContextMenu';

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
      onAdd(file);
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
        onSelect(imageRecord.data);
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
  pairData,
  selectedConversationId,
  onSelectConversation,
  onAddConversation,
  onEditConversation,
  onDeleteConversation,
  slideImages,
  onSelectSlideImage,
  onAddSlideImage,
  onDeleteSlideImage,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderItems,
  onMoveConversationToFolder,
}) => {
  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newTags, setNewTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: {}, item: null, type: null });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [collapsedFolders, setCollapsedFolders] = useState({});

  const handleAddTag = () => { const trimmedTag = tagInput.trim(); if (trimmedTag && !newTags.includes(trimmedTag)) { setNewTags([...newTags, trimmedTag]); setTagInput(''); } };
  const handleTagInputKeyDown = (e) => { if (!e.nativeEvent.isComposing && e.key === 'Enter') { e.preventDefault(); handleAddTag(); } };
  const handleRemoveTag = (tagToRemove) => { setNewTags(newTags.filter(tag => tag !== tagToRemove)); };
  
  const handleAdd = (e) => {
    e.preventDefault();
    if (newConversationTitle.trim()) {
      onAddConversation(pairData.id, { title: newConversationTitle.trim(), tags: newTags });
      setNewConversationTitle('');
      setNewTags([]);
      setTagInput('');
    }
  };

  const handleContextMenu = (e, item, type) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, item, type });
  };
  const handleCloseContextMenu = () => setContextMenu({ ...contextMenu, isOpen: false });

  const { folders = [], conversations = [] } = pairData;

  const getContextMenuItems = () => {
    const { item, type } = contextMenu;
    if (!item) return [];

    if (type === 'conversation') {
      const moveToFolderSubmenu = folders.map(folder => ({
        label: folder.name,
        action: () => onMoveConversationToFolder(item.id, folder.id)
      }));

      if (item.folderId) {
        moveToFolderSubmenu.push({ isSeparator: true });
        moveToFolderSubmenu.push({ label: '루트로 이동', action: () => onMoveConversationToFolder(item.id, null) });
      }

      return [
        { label: '수정', action: () => onEditConversation(item.id) },
        { label: '폴더로 이동', submenu: moveToFolderSubmenu },
        { isSeparator: true },
        { label: '삭제', className: 'delete', action: () => { if (window.confirm("정말로 이 대화를 삭제하시겠습니까?")) { onDeleteConversation(item.id); } } },
      ];
    }

    if (type === 'folder') {
      return [
        { label: '이름 변경', action: () => onRenameFolder(item.id) },
        { isSeparator: true },
        { label: '삭제', className: 'delete', action: () => { if (window.confirm("폴더를 삭제하시겠습니까? (내부의 대화는 루트로 이동됩니다)")) { onDeleteFolder(item.id); } } },
      ];
    }
    return [];
  };

  const structuredItems = useMemo(() => {
    const sortedFolders = [...folders].sort((a, b) => a.order - b.order);
    const sortedConversations = [...conversations].sort((a, b) => a.order - b.order);

    const itemsByFolder = sortedConversations.reduce((acc, convo) => {
      const folderId = convo.folderId || 'root';
      if (!acc[folderId]) acc[folderId] = [];
      acc[folderId].push(convo);
      return acc;
    }, {});

    const structured = sortedFolders.map(folder => ({
      ...folder,
      type: 'folder',
      conversations: itemsByFolder[folder.id] || []
    }));
    
    structured.push(...(itemsByFolder['root'] || []).map(c => ({...c, type: 'conversation'})));
    
    return structured;
  }, [folders, conversations]);
  
  const handleDragStart = (e, item, type) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ id: item.id, type });
  };
  
  const handleDragOver = (e, item, type) => {
    e.preventDefault();
    if (draggedItem) {
      if (type === 'folder' && draggedItem.type === 'conversation' && draggedItem.id !== item.id) {
        setDragOverItem({ id: item.id, type: 'folder' });
      } else {
        setDragOverItem(null);
      }
    }
  };
  
  // ▼▼▼ [핵심 수정] dropTargetItem이 null일 경우를 처리하여 오류 방지 ▼▼▼
  const handleDrop = (e, dropTargetItem, dropTargetType) => {
    e.preventDefault();
    e.stopPropagation();
    const dragItemData = JSON.parse(e.dataTransfer.getData('application/json'));
    const dropTarget = {
      id: dropTargetItem ? dropTargetItem.id : null,
      type: dropTargetType
    };
    onReorderItems(dragItemData, dropTarget);
    setDraggedItem(null);
    setDragOverItem(null);
  };
  
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const renderConversation = (convo) => (
    <li
      key={convo.id}
      className={`conversation-item ${convo.id === selectedConversationId ? 'selected' : ''} ${draggedItem?.id === convo.id ? 'dragging' : ''}`}
      onClick={() => onSelectConversation(convo.id)}
      onContextMenu={(e) => handleContextMenu(e, convo, 'conversation')}
      draggable="true"
      onDragStart={(e) => handleDragStart(e, convo, 'conversation')}
      onDrop={(e) => handleDrop(e, convo, 'conversation')}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={handleDragEnd}
    >
      <span className="conversation-item-title">{convo.title}</span>
      {(convo.tags || []).length > 0 && (
        <div className="conversation-item-tags">
          {(convo.tags || []).map((tag, index) => ( <span key={index} className="tag-pill-small">{tag}</span> ))}
        </div>
      )}
    </li>
  );

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
              <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="태그 입력 후 Enter 또는 추가" />
              <button type="button" onClick={handleAddTag} title="태그 추가"><i className="fas fa-plus"></i></button>
            </div>
            <div className="tags-preview">
              {(newTags || []).map((tag, index) => (
                <div key={index} className="tag-item-small">{tag}<button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button></div>
              ))}
            </div>
          </div>
          <button type="submit" title="새 로그 추가하기"><i className="fas fa-check"></i> 추가하기</button>
        </form>
      </div>
      
      <ul className="conversation-list" onDrop={(e) => handleDrop(e, null, 'root')} onDragOver={(e) => e.preventDefault()}>
        {structuredItems.map(item => {
          if (item.type === 'folder') {
            const isCollapsed = collapsedFolders[item.id];
            return (
              <div key={item.id} className="folder-item">
                <div 
                  className={`folder-header ${isCollapsed ? 'collapsed' : ''} ${draggedItem?.id === item.id ? 'dragging' : ''} ${dragOverItem?.id === item.id ? 'drag-over' : ''}`}
                  onClick={() => setCollapsedFolders(prev => ({...prev, [item.id]: !prev[item.id]}))}
                  onContextMenu={(e) => handleContextMenu(e, item, 'folder')}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, item, 'folder')}
                  onDrop={(e) => handleDrop(e, item, 'folder')}
                  onDragOver={(e) => handleDragOver(e, item, 'folder')}
                  onDragLeave={() => setDragOverItem(null)}
                  onDragEnd={handleDragEnd}
                >
                  <i className="fas fa-chevron-down folder-toggle-icon"></i>
                  <span className="folder-name">{item.name}</span>
                </div>
                {!isCollapsed && (
                  <ul className="folder-content">
                    {item.conversations.map(renderConversation)}
                  </ul>
                )}
              </div>
            );
          }
          return renderConversation(item);
        })}
      </ul>

      <div className="conversation-list-footer">
        <button className="add-folder-btn" onClick={onAddFolder}>+ 새 폴더</button>
      </div>

      {contextMenu.isOpen && ( <ContextMenu position={contextMenu.position} onClose={handleCloseContextMenu} items={getContextMenuItems().map(item => ({...item, action: () => { if(item.action) item.action(); handleCloseContextMenu(); }}))} /> )}
    </div>
  );
};

export default ConversationList;