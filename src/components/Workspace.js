// File: src/components/Workspace.js

import React, { useState, useRef, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageView from './MessageView';
import SettingsModal from './SettingsModal';
import ThemeEditor from './ThemeEditor';
import ImageCropModal from './ImageCropModal';
import CharacterSettingsModal from './CharacterSettingsModal';
import PairSettingsModal from './PairSettingsModal';
import ContextMenu from './ContextMenu';
import InputDialog from './InputDialog';
import RichTextEditModal from './RichTextEditModal';
import ProfilePopover from './ProfilePopover';
import BookmarkPanel from './BookmarkPanel';
import TextStickerModal from './TextStickerModal';
import DataImportModal from './DataImportModal';
import { db } from '../db';
import ColorThief from 'colorthief';
import { generateThemesFromPalette } from '../themeUtils';
import ThemeSelectionModal from './ThemeSelectionModal';
import { getMarkAttributes } from '@tiptap/core';
import * as XLSX from 'xlsx';
import FolderSettingsModal from './FolderSettingsModal';

const dataURLtoBlob = (dataurl) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};


const workspaceThemeOptions = [
  { key: 'appBg', label: '전체 배경', group: 'colors' },
  { key: 'sidebarBg', label: '사이드바 배경', group: 'colors' },
  { key: 'headerBg', label: '헤더 배경', group: 'colors' },
  { key: 'chatBg', label: '채팅창 배경', group: 'colors' },
  { key: 'footerBg', label: '메시지 입력창 배경', group: 'colors' },
  { key: 'textColor', label: '기본 글자 색상', group: 'colors' },
  { key: 'headerTitleColor', label: '헤더 제목 색상', group: 'colors' },
  { key: 'nameMeColor', label: 'A 캐릭터 이름 색상', group: 'colors' },
  { key: 'nameOtherColor', label: 'B 캐릭터 이름 색상', group: 'colors' },
  { key: 'bubbleMeBg', label: 'A 캐릭터 말풍선', group: 'colors' },
  { key: 'bubbleOtherBg', label: 'B 캐릭터 말풍선', group: 'colors' },
  { key: 'buttonBg', label: '버튼/강조 색상', group: 'colors' },
  { key: 'inputBg', label: '채팅 입력필드 배경', group: 'colors' },
  { key: 'sidebarInputBg', label: '사이드바 입력창 배경', group: 'colors' },
  { key: 'borderColor', label: '구분선/테두리 색상', group: 'colors' },
  { 
    key: 'mediaMaxWidth', 
    label: '채팅 미디어 최대 너비', 
    group: 'layout', 
    min: 200, 
    max: 800, 
    step: 10, 
    default: 400, 
    unit: 'px' 
  },
];

const Workspace = ({ 
  pairData, onAddMessage, onGoToDashboard, onAddConversation, onUpdateTheme,
  onUpdateBackgroundImage, onAddSlideImage, onDeleteSlideImage, onUpdateCharacters,
  onUpdatePairDetails, onEditConversation, onDeleteConversation, onEditMessage,
  onAddMessageInBetween, onDeleteMessage, onUpdateStickers, onToggleBookmark,
  onImportMessages,
  availableFonts,
  onAddOrUpdateTextSticker,
  onUpdateStickerOrder,
  onDeleteSticker,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderItems,
  onMoveConversationToFolder,
}) => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [isPairSettingsModalOpen, setIsPairSettingsModalOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [onCropSuccess, setOnCropSuccess] = useState(null);
  const [cropAspectRatio, setCropAspectRatio] = useState(NaN);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, items: [] });
  
  const [dialogState, setDialogState] = useState({ isOpen: false, title: '', fields: [], onConfirm: () => {}, formData: {} });
  
  const [editingMessage, setEditingMessage] = useState(null);
  
  const [themeOptions, setThemeOptions] = useState([]);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  
  const [popoverState, setPopoverState] = useState({ isOpen: false, character: null, anchorEl: null });
  
  const [isBookmarkPanelOpen, setIsBookmarkPanelOpen] = useState(false);
  const [scrollToMessageId, setScrollToMessageId] = useState(null);
  
  const [isTextStickerModalOpen, setIsTextStickerModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [editingSticker, setEditingSticker] = useState(null);

  // ▼▼▼ NEW: 폴더 모달 상태 추가 ▼▼▼
  const [editingFolder, setEditingFolder] = useState(null); // { id?, name?, tags?, isNew: boolean }

  const stickerInputRef = useRef(null);

  const handleSelectConversation = (convoId) => setSelectedConversationId(convoId);

  const openImageCropper = (imageSource, aspectRatio, callback) => { 
    if (imageSource instanceof File || imageSource instanceof Blob) { 
      const reader = new FileReader(); 
      reader.onload = (e) => setImageToCrop(e.target.result); 
      reader.readAsDataURL(imageSource); 
    } else { 
      setImageToCrop(imageSource); 
    } 
    setCropAspectRatio(aspectRatio); 
    setOnCropSuccess(() => callback); 
    setIsCropperOpen(true); 
  };

  const handleAddMessageRequest = (messageData) => {
    const { type, file } = messageData;

    if (type === 'text') {
      onAddMessage(selectedConversationId, messageData);
      return;
    }

    if (type === 'file' && file) {
      if (file.type.startsWith('video/') || file.type.startsWith('image/gif')) {
        onAddMessage(selectedConversationId, messageData);
        return;
      }

      if (file.type.startsWith('image/')) {
        const callback = (croppedDataUrl) => {
          const croppedBlob = dataURLtoBlob(croppedDataUrl);
          const croppedFile = new File([croppedBlob], file.name, { type: file.type });
          onAddMessage(selectedConversationId, { ...messageData, file: croppedFile });
        };
        openImageCropper(file, NaN, callback);
      }
    }
  };

  const handleAvatarClick = (character, anchorEl) => {
    setPopoverState({ isOpen: true, character, anchorEl });
  };
  const handleClosePopover = () => {
    setPopoverState({ isOpen: false, character: null, anchorEl: null });
  };
  
  const handleGoToBookmark = (messageId) => {
    setScrollToMessageId(messageId);
    setIsBookmarkPanelOpen(false);
  };

  const addNewStickerToConversation = async (imageBlob) => {
    if (!selectedConversationId) return;
    try {
      const imageId = await db.images.add({ data: imageBlob });
      const newSticker = { 
        id: `sticker_${Date.now()}`, 
        imageId: imageId, 
        x: 100, y: 100, width: 150, rotate: 0,
        isTextSticker: false,
        effects: {
          border: { enabled: false, color: '#FFFFFF', width: 2 },
          shadow: { enabled: false, color: '#000000', blur: 5, offsetX: 2, offsetY: 2 },
          gradient: { enabled: false, color: '#000000', intensity: 50 },
          animation: { type: 'none' },
          borderRadius: { value: 0 },
        }
      };
      const currentConvo = pairData.conversations.find(c => c.id === selectedConversationId);
      const updatedStickers = [...(currentConvo.stickers || []), newSticker];
      onUpdateStickers(selectedConversationId, updatedStickers);
    } catch (error) { 
      console.error("스티커 이미지 저장 실패:", error); 
      alert("스티커를 추가하는 데 실패했습니다."); 
    }
  };

  const handleStickerFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await addNewStickerToConversation(file);
    }
    e.target.value = null;
  };

  const handleTextStickerComplete = (stickerData, blob) => {
    if (!selectedConversationId) return;
    onAddOrUpdateTextSticker(selectedConversationId, stickerData, blob);
    handleCloseTextStickerModal();
  };

  const handleOpenStickerEditor = (sticker) => {
    setEditingSticker(sticker);
    setIsTextStickerModalOpen(true);
  };
  
  const handleCloseTextStickerModal = () => {
    setIsTextStickerModalOpen(false);
    setEditingSticker(null);
  }

  const closeDialog = () => setDialogState({ isOpen: false, title: '', fields: [], onConfirm: () => {}, formData: {} });

  const handleSetCommentForNewMessage = (editor) => {
    const existingComment = getMarkAttributes(editor.state, 'comment').comment || '';
    setDialogState({
      isOpen: true,
      title: '주석 추가/수정',
      formData: { comment: existingComment },
      fields: [
        { name: 'comment', label: '주석 내용', type: 'textarea', placeholder: '표시할 주석을 입력하세요...' },
      ],
      onConfirm: (formData) => {
        const commentText = formData.comment.trim();
        if (commentText) {
          editor.chain().focus().setComment({ comment: commentText }).run();
        } else {
          editor.chain().focus().unsetComment().run();
        }
        closeDialog();
      },
    });
  };
  
  const handleMessageContextMenu = (e, messageId) => {
    e.preventDefault();
    const convo = (pairData.conversations || []).find(c => c.id === selectedConversationId);
    if (!convo) return;
    const message = convo.messages.find(m => m.id === messageId);
    if (!message) return;

    const menuItems = [
      {
        label: message.bookmarked ? '북마크 제거' : '북마크 추가',
        action: () => onToggleBookmark(selectedConversationId, messageId)
      },
      { isSeparator: true },
      {
        label: '수정',
        action: () => {
          setEditingMessage({ 
            id: messageId, 
            content: message.content, 
            sender: message.sender,
            characterVersionId: message.characterVersionId
          });
        },
        disabled: message.type !== 'text'
      },
      {
        label: '앞에 추가',
        action: () => {
          const versions = pairData.characters.me || [];
          const characterVersionId = versions.length > 0 ? versions[0].id : null;
          setDialogState({
            isOpen: true,
            title: '메시지 앞에 추가',
            formData: { text: '', sender: 'Me', characterVersionId },
            onConfirm: (formData) => {
              if(formData.text.trim()) {
                onAddMessageInBetween(selectedConversationId, messageId, formData, 'before');
              }
              closeDialog();
            }
          });
        }
      },
      {
        label: '뒤에 추가',
        action: () => {
          const versions = pairData.characters.other || [];
          const characterVersionId = versions.length > 0 ? versions[0].id : null;
          setDialogState({
            isOpen: true,
            title: '메시지 뒤에 추가',
            formData: { text: '', sender: 'Other', characterVersionId },
            onConfirm: (formData) => {
              if(formData.text.trim()) {
                onAddMessageInBetween(selectedConversationId, messageId, formData, 'after');
              }
              closeDialog();
            }
          });
        }
      },
      { isSeparator: true },
      {
        label: '복사',
        action: () => navigator.clipboard.writeText(message.content),
        disabled: message.type !== 'text'
      },
      {
        label: '삭제',
        className: 'delete',
        action: () => {
          if (window.confirm('이 메시지를 정말로 삭제하시겠습니까?')) {
            onDeleteMessage(selectedConversationId, messageId);
          }
        }
      },
    ].filter(item => !item.disabled);

    setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, items: menuItems });
  };
  
  const handleStickerContextMenu = (e, sticker) => {
    e.preventDefault();
    e.stopPropagation();

    const menuItems = [
      { label: '맨 앞으로 가져오기', action: () => onUpdateStickerOrder(selectedConversationId, sticker.id, 'front') },
      { label: '맨 뒤로 보내기', action: () => onUpdateStickerOrder(selectedConversationId, sticker.id, 'back') },
    ];
    
    if(sticker.isTextSticker) {
      menuItems.push({ isSeparator: true });
      menuItems.push({ label: '텍스트 수정', action: () => handleOpenStickerEditor(sticker) });
    }

    menuItems.push({ isSeparator: true });
    menuItems.push({ 
      label: '삭제', 
      className: 'delete', 
      action: () => {
        if (window.confirm('이 스티커를 정말로 삭제하시겠습니까?')) {
          onDeleteSticker(selectedConversationId, sticker.id);
        }
      } 
    });

    setContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, items: menuItems });
  };


  useEffect(() => {
    if (!dialogState.isOpen) return;

    const { sender } = dialogState.formData;
    const characterKey = sender === 'Me' ? 'me' : 'other';
    const versions = pairData.characters[characterKey] || [];
    
    const newFields = [
      { name: 'text', label: '메시지 내용', type: 'textarea', placeholder: '추가할 내용을 입력하세요...' },
      { name: 'sender', label: '캐릭터 선택', type: 'select', options: [
          { value: 'Me', label: (pairData.characters.me[0]?.name || 'A 캐릭터') },
          { value: 'Other', label: (pairData.characters.other[0]?.name || 'B 캐릭터') },
      ]},
      { name: 'characterVersionId', label: '프로필 버전', type: 'select', options: versions.map(v => ({ value: v.id, label: v.name }))}
    ];

    if (JSON.stringify(newFields) !== JSON.stringify(dialogState.fields)) {
      setDialogState(prev => ({ ...prev, fields: newFields }));
    }
  }, [dialogState.isOpen, dialogState.formData, dialogState.fields, pairData.characters]);


  const closeContextMenu = () => setContextMenu(prev => ({ ...prev, isOpen: false }));
  
  const handleSetAsBackground = (imageBlob) => {
    const callback = (croppedDataUrl) => { onUpdateBackgroundImage(pairData.id, croppedDataUrl); };
    openImageCropper(imageBlob, 16 / 9, callback);
    
    const img = new Image();
    const objectURL = URL.createObjectURL(imageBlob);
    img.src = objectURL;
    img.onload = () => {
      try {
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(img, 8);
        const newThemes = generateThemesFromPalette(palette);
        setThemeOptions(newThemes);
        setIsThemeSelectorOpen(true);
      } catch(e) { console.error("테마 생성 실패", e); alert("테마를 생성하는 데 실패했습니다."); } 
      finally { URL.revokeObjectURL(objectURL); }
    };
    img.onerror = () => { alert("이미지를 불러오는 데 실패하여 테마를 생성할 수 없습니다."); URL.revokeObjectURL(objectURL); }
  };

  const handleThemeSelected = (selectedTheme) => { onUpdateTheme(pairData.id, selectedTheme); setIsThemeSelectorOpen(false); setThemeOptions([]); };
  const handleAddNewSlideImage = (imageFile) => { const callback = async (croppedDataUrl) => { try { const imageBlob = await (await fetch(croppedDataUrl)).blob(); const imageId = await db.images.add({ data: imageBlob }); onAddSlideImage(pairData.id, imageId); } catch (error) { console.error("크롭된 배너 이미지 저장 실패:", error); } }; openImageCropper(imageFile, 16 / 9, callback); };
  const handleCropComplete = (croppedDataUrl) => { if (onCropSuccess && typeof onCropSuccess === 'function') { onCropSuccess(croppedDataUrl); } setIsCropperOpen(false); setImageToCrop(null); setOnCropSuccess(null); };
  const handleCloseCropper = () => { setIsCropperOpen(false); setImageToCrop(null); setOnCropSuccess(null); };

  const handleDataImport = (parsedMessages) => {
    if (parsedMessages && parsedMessages.length > 0 && selectedConversationId) {
      onImportMessages(selectedConversationId, parsedMessages);
      setIsImportModalOpen(false);
    }
  };
  
  const handleExport = async (fileType) => {
    if (!selectedConversation) {
      alert('내보낼 대화를 선택해주세요.');
      return;
    }

    const getCharacterName = (sender, versionId) => {
      const key = (sender === 'Me' || sender === 'me') ? 'me' : 'other';
      const versions = pairData.characters[key] || [];
      const version = versions.find(v => v.id === versionId);
      return version ? version.name : (versions[0]?.name || (key === 'me' ? 'A 캐릭터' : 'B 캐릭터'));
    };

    const renderContent = (message) => {
      switch (message.type) {
        case 'image': return '[이미지]';
        case 'video': return '[비디오]';
        case 'embed': return `[링크: ${message.content.service}]`;
        case 'link': return `[링크: ${message.content.url}]`;
        case 'text':
        default:
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = message.content || message.text || '';
          return tempDiv.textContent || tempDiv.innerText || '';
      }
    };
    
    let blob;
    let filename = `${selectedConversation.title.replace(/ /g, '_')}_export.${fileType}`;

    if (fileType === 'txt') {
      const content = selectedConversation.messages
        .map(msg => `[${getCharacterName(msg.sender, msg.characterVersionId)}] ${renderContent(msg)}`)
        .join('\n');
      blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    } else if (fileType === 'xlsx') {
      const data = selectedConversation.messages.map(msg => ({
        '화자': getCharacterName(msg.sender, msg.characterVersionId),
        '내용': renderContent(msg),
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '대화 내용');
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([wbout], { type: 'application/octet-stream' });
    }

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // ▼▼▼ NEW: 폴더 관련 모달 핸들러들 ▼▼▼
  const handleAddFolderRequest = () => {
    setEditingFolder({ isNew: true, name: '', tags: [] });
  };

  const handleRenameFolderRequest = (folderId) => {
    const folder = pairData.folders.find(f => f.id === folderId);
    if (folder) {
      setEditingFolder({ ...folder, isNew: false });
    }
  };

  const handleSaveFolder = (folderData) => {
    if (editingFolder?.isNew) {
      onAddFolder(pairData.id, folderData);
    } else {
      onRenameFolder(pairData.id, editingFolder.id, folderData);
    }
    setEditingFolder(null);
  };


  const selectedConversation = (pairData.conversations || []).find(c => c.id === selectedConversationId);
  const bookmarkedMessages = selectedConversation?.messages.filter(m => m.bookmarked) || [];

  const theme = pairData.theme || {};
  const themeStyles = {
    '--app-bg': theme.appBg,
    '--border-color': theme.borderColor,
    '--header-title-color': theme.headerTitleColor,
    '--sidebar-bg': theme.sidebarBg,
    '--sidebar-input-bg': theme.sidebarInputBg,
    '--header-bg': theme.headerBg,
    '--footer-bg': theme.footerBg,
    '--chat-bg': theme.chatBg,
    '--input-bg': theme.inputBg,
    '--bubble-me-bg': theme.bubbleMeBg,
    '--bubble-other-bg': theme.bubbleOtherBg,
    '--name-me-color': theme.nameMeColor,
    '--name-other-color': theme.nameOtherColor,
    '--text-color': theme.textColor,
    '--button-bg': theme.buttonBg,
    '--media-max-width': `${theme.mediaMaxWidth || 400}px`,
  };

  return (
    <div className="workspace-container" style={themeStyles}>
      <ConversationList 
        pairData={pairData} 
        selectedConversationId={selectedConversationId} 
        onSelectConversation={handleSelectConversation} 
        onAddConversation={onAddConversation} 
        slideImages={pairData.slideImages} 
        onSelectSlideImage={handleSetAsBackground} 
        onAddSlideImage={handleAddNewSlideImage} 
        onDeleteSlideImage={(imageId) => onDeleteSlideImage(pairData.id, imageId)} 
        onEditConversation={onEditConversation} 
        onDeleteConversation={onDeleteConversation}
        onAddFolder={handleAddFolderRequest}
        onRenameFolder={handleRenameFolderRequest}
        onDeleteFolder={(folderId) => onDeleteFolder(pairData.id, folderId)}
        onReorderItems={(dragItem, dropTarget) => onReorderItems(pairData.id, dragItem, dropTarget)}
        onMoveConversationToFolder={(convoId, folderId) => onMoveConversationToFolder(pairData.id, convoId, folderId)}
      />
      <div className="main-content-area">
        <header className="workspace-header">
          <button className="back-button" onClick={onGoToDashboard} title="대시보드로 돌아가기"><i className="fas fa-arrow-left"></i></button>
          <h2>{pairData.title}</h2>
          <button className="theme-edit-btn" onClick={() => setIsPairSettingsModalOpen(true)} title="제목 및 태그 수정"><i className="fas fa-pencil-alt"></i></button>
          <button className="theme-edit-btn" onClick={() => setIsCharacterModalOpen(true)} title="캐릭터 설정"><i className="fas fa-users-cog"></i></button>
          <button className="theme-edit-btn" onClick={() => setIsThemeModalOpen(true)} title="테마 편집"><i className="fas fa-palette"></i></button>
          <button className="theme-edit-btn" onClick={() => stickerInputRef.current?.click()} disabled={!selectedConversationId} title="이미지 스티커 추가"><i className="fas fa-image"></i></button>
          <button className="theme-edit-btn" onClick={() => setIsTextStickerModalOpen(true)} disabled={!selectedConversationId} title="텍스트 스티커 추가"><i className="fas fa-font"></i></button>
          <button 
            className="theme-edit-btn" 
            onClick={() => setIsImportModalOpen(true)} 
            disabled={!selectedConversationId} 
            title="데이터 불러오기"
          >
            <i className="fas fa-file-import"></i>
          </button>
          <button className="theme-edit-btn" onClick={() => handleExport('txt')} disabled={!selectedConversationId} title="TXT로 내보내기">
            <i className="fas fa-file-alt"></i>
          </button>
          <button className="theme-edit-btn" onClick={() => handleExport('xlsx')} disabled={!selectedConversationId} title="Excel로 내보내기">
            <i className="fas fa-file-excel"></i>
          </button>
          <button 
            className="theme-edit-btn" 
            onClick={() => setIsBookmarkPanelOpen(!isBookmarkPanelOpen)} 
            disabled={!selectedConversationId} 
            title="북마크 목록"
          >
            <i className="fas fa-bookmark"></i>
          </button>
        </header>
        {selectedConversation ? ( 
            <MessageView 
                log={selectedConversation} 
                characters={pairData.characters} 
                onAddMessage={handleAddMessageRequest}
                onMessageContextMenu={handleMessageContextMenu}
                onUpdateStickers={(newStickers) => onUpdateStickers(selectedConversation.id, newStickers)}
                onAvatarClick={handleAvatarClick}
                scrollToMessageId={scrollToMessageId}
                onScrollComplete={() => setScrollToMessageId(null)}
                onSetComment={handleSetCommentForNewMessage}
                onStickerContextMenu={handleStickerContextMenu}
                onOpenStickerEditor={handleOpenStickerEditor}
            /> 
        ) : ( <div className="placeholder">왼쪽에서 대화 로그를 선택하거나 새 로그를 추가하세요.</div> )}
      </div>
      
      {popoverState.isOpen && (
        <ProfilePopover
          character={popoverState.character}
          anchorEl={popoverState.anchorEl}
          onClose={handleClosePopover}
        />
      )}

      <BookmarkPanel
        isOpen={isBookmarkPanelOpen}
        onClose={() => setIsBookmarkPanelOpen(false)}
        bookmarks={bookmarkedMessages}
        onBookmarkClick={handleGoToBookmark}
        characters={pairData.characters}
      />

      <input type="file" ref={stickerInputRef} style={{ display: 'none' }} accept="image/png, image/gif, image/jpeg, image/webp" onChange={handleStickerFileSelect}/>
      <ThemeSelectionModal isOpen={isThemeSelectorOpen} onClose={() => setIsThemeSelectorOpen(false)} themes={themeOptions} onSelectTheme={handleThemeSelected}/>
      
      <TextStickerModal
        isOpen={isTextStickerModalOpen}
        onClose={handleCloseTextStickerModal}
        onComplete={handleTextStickerComplete}
        availableFonts={availableFonts}
        editingStickerData={editingSticker}
      />
      
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleDataImport}
        characters={pairData.characters}
      />

      <SettingsModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} title="워크스페이스 테마 편집">
        <ThemeEditor theme={pairData.theme} onThemeChange={(newTheme) => onUpdateTheme(pairData.id, newTheme)} options={workspaceThemeOptions} />
      </SettingsModal>
      <CharacterSettingsModal isOpen={isCharacterModalOpen} onClose={() => setIsCharacterModalOpen(false)} pairData={pairData} onUpdate={onUpdateCharacters} onOpenCropper={openImageCropper} />
      <PairSettingsModal isOpen={isPairSettingsModalOpen} onClose={() => setIsPairSettingsModalOpen(false)} pairData={pairData} onSave={(updatedDetails) => onUpdatePairDetails(pairData.id, updatedDetails)} />
      <ImageCropModal isOpen={isCropperOpen} onClose={handleCloseCropper} imageSrc={imageToCrop} onCropComplete={handleCropComplete} aspectRatio={cropAspectRatio} />
      
      {/* ▼▼▼ NEW: 폴더 설정 모달 렌더링 ▼▼▼ */}
      <FolderSettingsModal
        isOpen={!!editingFolder}
        onClose={() => setEditingFolder(null)}
        folderData={editingFolder}
        onSave={handleSaveFolder}
      />

      <RichTextEditModal
        isOpen={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        initialContent={editingMessage?.content}
        initialSender={editingMessage?.sender}
        initialVersionId={editingMessage?.characterVersionId}
        characters={pairData.characters}
        onSave={(updatedData) => {
          onEditMessage(selectedConversationId, editingMessage.id, updatedData);
          setEditingMessage(null);
        }}
      />
      
      {contextMenu.isOpen && ( <ContextMenu position={contextMenu.position} items={contextMenu.items} onClose={closeContextMenu} /> )}
      
      <InputDialog 
        isOpen={dialogState.isOpen} 
        title={dialogState.title} 
        fields={dialogState.fields}
        initialData={dialogState.formData}
        onConfirm={(formData) => {
          dialogState.onConfirm(formData);
        }} 
        onCancel={closeDialog} 
      />
    </div>
  );
};

export default Workspace;