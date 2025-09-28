// File: src/components/MessageView.js

import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';
import Sticker from './Sticker';
import TiptapEditor from './TiptapEditor';
import StickerEffectsModal from './StickerEffectsModal';

const MessageView = ({ 
    log, characters, onAddMessage, onMessageContextMenu, onUpdateStickers, onAvatarClick, 
    scrollToMessageId, onScrollComplete, onSetComment,
    // ▼▼▼ [신규] 스티커 관련 핸들러 수신 ▼▼▼
    onStickerContextMenu, onOpenStickerEditor 
}) => {
  const [sender, setSender] = useState('me');
  const [text, setText] = useState('');
  const [selectedStickerId, setSelectedStickerId] = useState(null);
  const messageListRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [selectedVersion, setSelectedVersion] = useState({ me: null, other: null });

  const [isFxModalOpen, setIsFxModalOpen] = useState(false);
  const [editingSticker, setEditingSticker] = useState(null);
  const originalStickerData = useRef(null);

  useEffect(() => {
    if (characters) {
      const meVersions = Array.isArray(characters.me) ? characters.me : [];
      const otherVersions = Array.isArray(characters.other) ? characters.other : [];
      setSelectedVersion({
        me: meVersions.length > 0 ? meVersions[0].id : null,
        other: otherVersions.length > 0 ? otherVersions[0].id : null,
      });
    }
  }, [characters]);


  useEffect(() => { if (messageListRef.current) { messageListRef.current.scrollTop = messageListRef.current.scrollHeight; } }, [log.messages]);
  useEffect(() => { if (scrollToMessageId && messageListRef.current) { const targetElement = messageListRef.current.querySelector(`#message-${scrollToMessageId}`); if (targetElement) { targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); targetElement.classList.add('highlighted'); setTimeout(() => { targetElement.classList.remove('highlighted'); }, 1500); } onScrollComplete(); } }, [scrollToMessageId, onScrollComplete]);
  
  const handleAddMessage = (e) => { 
    e.preventDefault(); 
    const tempDiv = document.createElement('div'); 
    tempDiv.innerHTML = text; 
    if (tempDiv.textContent.trim()) { 
      const formattedSender = sender === 'me' ? 'Me' : 'Other'; 
      const versionId = selectedVersion[sender];
      onAddMessage({ type: 'text', sender: formattedSender, text, characterVersionId: versionId }); 
      setText(''); 
    } 
  };
  
  const handleFileChange = (e) => { 
    const file = e.target.files[0]; 
    if (file) { 
      const formattedSender = sender === 'me' ? 'Me' : 'Other'; 
      const versionId = selectedVersion[sender];
      onAddMessage({ type: 'file', sender: formattedSender, file, characterVersionId: versionId }); 
    } 
    e.target.value = null; 
  };
  
  const handleBackgroundClick = (e) => { if (e.target === e.currentTarget) { setSelectedStickerId(null); } };
  const handleStickerUpdate = (updatedSticker) => { const newStickers = (log.stickers || []).map(s => s.id === updatedSticker.id ? updatedSticker : s); onUpdateStickers(newStickers); };
  const handleStickerDelete = (stickerIdToDelete) => { const newStickers = (log.stickers || []).filter(s => s.id !== stickerIdToDelete); onUpdateStickers(newStickers); };


  const handleOpenFxModal = (sticker) => {
    originalStickerData.current = sticker;
    setEditingSticker(sticker);
    setIsFxModalOpen(true);
  };

  const handleCloseFxModal = () => {
    if (originalStickerData.current) {
        handleStickerUpdate(originalStickerData.current);
    }
    setIsFxModalOpen(false);
    setEditingSticker(null);
    originalStickerData.current = null;
  };

  const handleSaveFx = (updatedEffects) => {
    if (!editingSticker) return;
    const finalSticker = { ...editingSticker, effects: updatedEffects };
    handleStickerUpdate(finalSticker);
    
    setIsFxModalOpen(false);
    setEditingSticker(null);
    originalStickerData.current = null;
  };
  
  const handleStickerLiveUpdate = (liveEffects) => {
    if (!editingSticker) return;
    setEditingSticker(prevSticker => ({
      ...prevSticker,
      effects: liveEffects
    }));
  };

  if (!log || !characters) return null;

  const stickersToRender = (log.stickers || []).map(sticker => {
      if (editingSticker && sticker.id === editingSticker.id) {
          return editingSticker;
      }
      return sticker;
  });
  
  const meVersions = Array.isArray(characters.me) ? characters.me : [];
  const otherVersions = Array.isArray(characters.other) ? characters.other : [];

  return (
    <>
      <div className="message-view-content">
        <div className="message-list" ref={messageListRef} onClick={handleBackgroundClick}>
          {(log.messages || []).map((msg) => {
            const isMe = msg.sender === 'Me' || msg.sender === 'me';
            const characterVersions = isMe ? meVersions : otherVersions;
            return <Message 
              key={msg.id} 
              message={msg} 
              characters={characterVersions} 
              versionId={msg.characterVersionId}
              onContextMenu={onMessageContextMenu} 
              onAvatarClick={onAvatarClick} 
            />;
          })}
          
          {stickersToRender.map((sticker) => (
            <Sticker 
              key={sticker.id} 
              stickerData={sticker} 
              onUpdate={handleStickerUpdate} 
              onDelete={handleStickerDelete}
              isSelected={sticker.id === selectedStickerId} 
              onSelect={setSelectedStickerId}
              onOpenFxModal={handleOpenFxModal}
              // ▼▼▼ [신규] 스티커 관련 핸들러 전달 ▼▼▼
              onContextMenu={onStickerContextMenu}
              onOpenStickerEditor={onOpenStickerEditor}
            />
          ))}
        </div>
      </div>
      
      <form onSubmit={handleAddMessage} className="add-message-form">
        <div className="sender-selector-group">
          <select value={sender} onChange={(e) => setSender(e.target.value)}>
            <option value="me">{meVersions[0]?.name || 'A 캐릭터'}</option>
            <option value="other">{otherVersions[0]?.name || 'B 캐릭터'}</option>
          </select>
          <select 
            value={selectedVersion[sender] || ''} 
            onChange={(e) => setSelectedVersion(prev => ({...prev, [sender]: e.target.value}))}
            className="version-selector"
          >
            {(sender === 'me' ? meVersions : otherVersions).map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <button type="button" className="attach-file-btn" title="파일 첨부" onClick={() => fileInputRef.current.click()}> <i className="fas fa-paperclip"></i> </button>
        <div className="editor-container"> <TiptapEditor content={text} onUpdate={setText} placeholder="메시지 입력..." onSetComment={onSetComment}/> </div>
        <button type="submit">전송</button>
      </form>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,image/gif" onChange={handleFileChange} />

      <StickerEffectsModal 
        isOpen={isFxModalOpen}
        onClose={handleCloseFxModal}
        stickerData={originalStickerData.current}
        onSave={handleSaveFx}
        onLiveUpdate={handleStickerLiveUpdate}
      />
    </>
  );
};

export default MessageView;