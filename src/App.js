// File: src/App.js

import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';
import AddPairModal from './components/AddPairModal';
import SettingsModal from './components/SettingsModal';
import SettingsPanel from './components/SettingsPanel';
import ConversationSettingsModal from './components/ConversationSettingsModal';
import TitleBar from './components/TitleBar';
import ContextMenu from './components/ContextMenu';
import PairSettingsModal from './components/PairSettingsModal';
import ThemeSelectionModal from './components/ThemeSelectionModal';
import ColorThief from 'colorthief';
import { generateThemesFromPalette } from './themeUtils';
import { parseLink } from './linkUtils';
import './App.css';
import { db } from './db';

const WEB_FONTS = [ { name: '페이퍼로지', value: "'Paperozi', sans-serif" }, { name: 'Noto Sans KR', value: "'Noto Sans KR', sans-serif" }, { name: 'Source Code Pro', value: "'Source Code Pro', monospace" }, { name: '프리젠테이션', value: "'Presentation', sans-serif" }, { name: '시스템 기본', value: "sans-serif" }, ];

const DEFAULT_GLOBAL_THEME = {
  titleBarBg: '#FFFFFF', 
  dashboardBg: '#F0F2F5',
};

const DEFAULT_WORKSPACE_THEME = {
  name: 'Clean Light',
  appBg: '#F0F2F5',
  headerTitleColor: '#212529',
  borderColor: '#E9ECEF',
  sidebarBg: '#FFFFFF',
  headerBg: '#FFFFFF',
  footerBg: '#FFFFFF',
  chatBg: '#FFFFFF',
  sidebarInputBg: '#F0F2F5',
  inputBg: '#F0F2F5',
  buttonBg: '#5865F2',
  bubbleMeBg: '#5865F2',
  nameMeColor: '#5865F2',
  bubbleOtherBg: '#E9ECEF',
  textColor: '#212529',
  nameOtherColor: '#868E96',
  mediaMaxWidth: 400,
};

const createDefaultCharacterVersion = (name, username) => ({
  id: `v_${Date.now()}_${Math.random()}`,
  name: name || '기본 버전',
  username: username || '',
  avatar: null,
  profileBanner: null,
  headerColor1: '#232428',
  headerColor2: '#232428',
  statusMessage: '',
  memo: '',
  tags: [],
});

const DEFAULT_CHARACTERS = { 
  me: [createDefaultCharacterVersion('A 캐릭터', 'user_a')], 
  other: [createDefaultCharacterVersion('B 캐릭터', 'user_b')] 
};

const getInitialState = (key, defaultValue) => {
  try {
    const savedItem = localStorage.getItem(key);
    if (savedItem === null) return defaultValue;
    const parsedItem = JSON.parse(savedItem);
    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue) &&
        typeof parsedItem === 'object' && parsedItem !== null && !Array.isArray(parsedItem)) {
      return { ...defaultValue, ...parsedItem };
    }
    return parsedItem;
  } catch (error) {
    console.error(`Error reading or parsing localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const migrateDataStructure = (pairs) => {
  if (!Array.isArray(pairs)) return [];
  return pairs.map(pair => {
    let needsUpdate = false;
    if (!pair.hasOwnProperty('folders')) {
      pair.folders = [];
      needsUpdate = true;
    }
    if (Array.isArray(pair.conversations)) {
      pair.conversations = pair.conversations.map((convo, index) => {
        const updatedConvo = { ...convo };
        if (!convo.hasOwnProperty('order')) {
          updatedConvo.order = index;
          needsUpdate = true;
        }
        if (!convo.hasOwnProperty('folderId')) {
          updatedConvo.folderId = null;
          needsUpdate = true;
        }
        return updatedConvo;
      });
    }
    return pair;
  });
};


function App() {
  const [characterPairs, setCharacterPairs] = useState(() => migrateDataStructure(getInitialState('pair-chat-data', [])));
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPairId, setSelectedPairId] = useState(null);
  const [isAddPairModalOpen, setIsAddPairModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [globalTheme, setGlobalTheme] = useState(() => getInitialState('chat-app-global-theme', DEFAULT_GLOBAL_THEME));
  const [titleBarText, setTitleBarText] = useState(() => getInitialState('chat-app-title-bar-text', '씹덕의 세계로 오라'));
  const [selectedFont, setSelectedFont] = useState(() => getInitialState('chat-backup-font', WEB_FONTS[0].value));
  const [availableFonts, setAvailableFonts] = useState({ web: WEB_FONTS, system: [] });
  const [editingConvo, setEditingConvo] = useState(null);
  const [fontSize, setFontSize] = useState(() => getInitialState('chat-backup-font-size', 15));
  const [letterSpacing, setLetterSpacing] = useState(() => getInitialState('chat-backup-letter-spacing', 0));
  const [dashboardContextMenu, setDashboardContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, pairId: null });
  const [editingPair, setEditingPair] = useState(null);
  const [newPairDataBuffer, setNewPairDataBuffer] = useState(null);
  const [themeOptionsForNewPair, setThemeOptionsForNewPair] = useState([]);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  useEffect(() => { if(Array.isArray(characterPairs)) { localStorage.setItem('pair-chat-data', JSON.stringify(characterPairs)); } }, [characterPairs]);
  useEffect(() => { localStorage.setItem('chat-app-global-theme', JSON.stringify(globalTheme)); }, [globalTheme]);
  useEffect(() => { localStorage.setItem('chat-app-title-bar-text', JSON.stringify(titleBarText)); }, [titleBarText]);
  useEffect(() => {
    localStorage.setItem('chat-backup-font', JSON.stringify(selectedFont));
    document.documentElement.style.setProperty('--global-font-family', selectedFont);
  }, [selectedFont]);
  useEffect(() => { localStorage.setItem('chat-backup-font-size', fontSize); document.documentElement.style.setProperty('--global-font-size', `${fontSize}px`); }, [fontSize]);
  useEffect(() => { localStorage.setItem('chat-backup-letter-spacing', letterSpacing); document.documentElement.style.setProperty('--global-letter-spacing', `${letterSpacing}px`); }, [letterSpacing]);
  useEffect(() => { document.documentElement.style.setProperty('--global-accent-color', globalTheme.titleBarBg || '#FFFFFF'); }, [globalTheme.titleBarBg]);
  useEffect(() => {
    const loadSystemFonts = async () => {
      if (window.electronAPI && typeof window.electronAPI.getSystemFonts === 'function') {
        try {
          const systemFonts = await window.electronAPI.getSystemFonts();
          setAvailableFonts(prev => ({ ...prev, system: systemFonts }));
        } catch (error) {
          console.error('Failed to load system fonts:', error);
        }
      }
    };
    loadSystemFonts();
  }, []);

  const handleThemeSelectedForNewPair = useCallback((selectedTheme) => {
    if (!newPairDataBuffer) return;
    const newPair = {
      ...newPairDataBuffer,
      id: `pair_${Date.now()}`,
      conversations: [],
      folders: [], // ▼▼▼ [버그 수정] folders 속성 추가
      slideImages: [],
      characters: { ...DEFAULT_CHARACTERS },
      tags: [],
      theme: { ...DEFAULT_WORKSPACE_THEME, ...selectedTheme },
    };
    setCharacterPairs(pairs => [...(Array.isArray(pairs) ? pairs : []), newPair]);
    setIsThemeSelectorOpen(false);
    setThemeOptionsForNewPair([]);
    setNewPairDataBuffer(null);
  }, [newPairDataBuffer]);

  const handleCreatePairRequest = useCallback((pairData) => {
    if (!pairData.backgroundImage) {
      const newPair = { ...pairData, id: `pair_${Date.now()}`, conversations: [], folders: [], slideImages: [], characters: { ...DEFAULT_CHARACTERS }, tags: [], theme: { ...DEFAULT_WORKSPACE_THEME } };
      setCharacterPairs(pairs => [...(Array.isArray(pairs) ? pairs : []), newPair]);
    } else {
      setNewPairDataBuffer(pairData);
      const img = new Image();
      img.src = pairData.backgroundImage;
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const palette = colorThief.getPalette(img, 8);
          const themes = generateThemesFromPalette(palette);
          setThemeOptionsForNewPair(themes);
          setIsThemeSelectorOpen(true);
        } catch (e) { console.error("Theme generation failed", e); handleThemeSelectedForNewPair(DEFAULT_WORKSPACE_THEME); }
      };
      img.onerror = () => { console.error("Image loading failed for theme generation."); handleThemeSelectedForNewPair(DEFAULT_WORKSPACE_THEME); }
    }
  }, [handleThemeSelectedForNewPair]);

  const handleAddMessage = useCallback(async (convoId, messageData) => {
    let newMessage;
    const { characterVersionId } = messageData;
    const uniqueId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (messageData.type === 'file') {
      const { file, sender } = messageData;
      try {
        const imageId = await db.images.add({ data: file });
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        newMessage = { id: uniqueId, sender, type: fileType, content: imageId, characterVersionId };
      } catch (error) { console.error("미디어 파일 저장 실패:", error); alert("미디어 파일을 저장하는 데 실패했습니다."); return; }
    } else {
      const { text, sender } = messageData;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      const plainText = (tempDiv.textContent || tempDiv.innerText || "").trim();
      const parsedData = parseLink(plainText);
      
      if (parsedData && parsedData.type === 'link') {
        try {
          const metadata = await window.electronAPI.fetchLinkMetadata(parsedData.content.url);
          if (metadata && metadata.success) {
            newMessage = { id: uniqueId, sender, type: 'link', content: { ...parsedData.content, ...metadata }, characterVersionId };
          } else {
            newMessage = { id: uniqueId, sender, type: 'text', content: text, characterVersionId };
          }
        } catch (error) {
          newMessage = { id: uniqueId, sender, type: 'text', content: text, characterVersionId };
        }
      } else if (parsedData && parsedData.type === 'embed') {
        newMessage = { id: uniqueId, sender, ...parsedData, characterVersionId };
      } else {
        newMessage = { id: uniqueId, sender, type: 'text', content: text, characterVersionId };
      }
    }

    if (!newMessage) return; 

    setCharacterPairs(pairs => pairs.map(pair => {
      if (pair.id !== selectedPairId) return pair;
      return { ...pair, conversations: (pair.conversations || []).map(convo => {
          if (convo.id !== convoId) return convo;
          const migratedMessages = (convo.messages || []).map(msg => {
            if (msg.text && !msg.type) { return { ...msg, type: 'text', content: msg.text }; }
            return msg;
          });
          return { ...convo, messages: [...migratedMessages, newMessage] };
        })
      };
    }));
  }, [selectedPairId]);

  const handleImportMessages = useCallback((convoId, newMessages) => {
    setCharacterPairs(pairs => pairs.map(pair => {
      if (pair.id !== selectedPairId) return pair;
      return {
        ...pair,
        conversations: (pair.conversations || []).map(convo => {
          if (convo.id !== convoId) return convo;
          const existingMessages = convo.messages || [];
          const messagesWithIds = newMessages.map((msg, index) => ({
            ...msg,
            id: `msg_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 9)}`,
          }));
          return { ...convo, messages: [...existingMessages, ...messagesWithIds] };
        })
      };
    }));
  }, [selectedPairId]);

  const handleToggleBookmark = useCallback((convoId, messageId) => {
    setCharacterPairs(pairs => pairs.map(pair => {
      if (pair.id !== selectedPairId) return pair;
      return {
        ...pair,
        conversations: pair.conversations.map(convo => {
          if (convo.id !== convoId) return convo;
          return {
            ...convo,
            messages: convo.messages.map(msg => 
              msg.id === messageId ? { ...msg, bookmarked: !msg.bookmarked } : msg
            )
          };
        })
      };
    }));
  }, [selectedPairId]);

  const handleAddOrUpdateTextSticker = useCallback(async (convoId, stickerData, blob) => {
    try {
      const imageId = await db.images.add({ data: blob });
      const finalStickerData = { ...stickerData, imageId };

      setCharacterPairs(pairs => pairs.map(pair => {
        if (pair.id !== selectedPairId) return pair;
        return {
          ...pair,
          conversations: pair.conversations.map(convo => {
            if (convo.id !== convoId) return convo;
            
            const currentStickers = convo.stickers || [];
            const isUpdate = currentStickers.some(s => s.id === finalStickerData.id);
            
            let updatedStickers;
            if (isUpdate) {
              updatedStickers = currentStickers.map(s => s.id === finalStickerData.id ? finalStickerData : s);
            } else {
              updatedStickers = [...currentStickers, finalStickerData];
            }
            return { ...convo, stickers: updatedStickers };
          })
        };
      }));
    } catch (error) {
      console.error("텍스트 스티커 저장 실패:", error);
      alert("텍스트 스티커를 저장하는 데 실패했습니다.");
    }
  }, [selectedPairId]);
  
  const handleUpdateStickerOrder = useCallback((convoId, stickerId, direction) => {
    setCharacterPairs(pairs => pairs.map(pair => {
      if (pair.id !== selectedPairId) return pair;
      return {
        ...pair,
        conversations: pair.conversations.map(convo => {
          if (convo.id !== convoId) return convo;

          const stickers = [...(convo.stickers || [])];
          const index = stickers.findIndex(s => s.id === stickerId);
          if (index === -1) return convo;

          const [sticker] = stickers.splice(index, 1);

          if (direction === 'front') {
            stickers.push(sticker);
          } else if (direction === 'back') {
            stickers.unshift(sticker);
          }

          return { ...convo, stickers };
        })
      };
    }));
  }, [selectedPairId]);
  
  const handleDeleteSticker = useCallback((convoId, stickerId) => {
    setCharacterPairs(pairs => pairs.map(pair => {
      if (pair.id !== selectedPairId) return pair;
      return {
        ...pair,
        conversations: pair.conversations.map(convo => {
          if (convo.id !== convoId) return convo;
          const updatedStickers = (convo.stickers || []).filter(s => s.id !== stickerId);
          return { ...convo, stickers: updatedStickers };
        })
      };
    }));
  }, [selectedPairId]);
  
  const handleUpdateTitleBarText = useCallback((newText) => { setTitleBarText(newText); }, []);
  const handleDashboardContextMenu = (e, pairId) => { e.preventDefault(); setDashboardContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, pairId }); };
  const closeDashboardContextMenu = () => setDashboardContextMenu({ ...dashboardContextMenu, isOpen: false });
  const handleDeletePair = useCallback((pairIdToDelete) => { if (window.confirm("정말로 이 대화 로그 전체를 삭제하시겠습니까? 모든 내용이 영구적으로 사라집니다.")) { setCharacterPairs(pairs => pairs.filter(p => p.id !== pairIdToDelete)); } }, []);
  const handleOpenPairSettingsModal = useCallback((pairId) => { const pairToEdit = characterPairs.find(p => p.id === pairId); if (pairToEdit) { setEditingPair(pairToEdit); } }, [characterPairs]);
  const handleUpdateGlobalTheme = useCallback((newTheme) => setGlobalTheme(newTheme), []);
  const handleUpdatePairTheme = useCallback((pairId, newTheme) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, theme: newTheme } : p)); }, []);
  const handleSelectPair = useCallback((pairId) => { setSelectedPairId(pairId); setCurrentView('workspace'); }, []);
  const handleGoToDashboard = useCallback(() => { setSelectedPairId(null); setCurrentView('dashboard'); }, []);
  const handleUpdatePairDetails = useCallback((pairId, updatedDetails) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, title: updatedDetails.title, tags: updatedDetails.tags } : p)); }, []);
  const handleAddConversation = useCallback((pairId, convoData) => {
    setCharacterPairs(pairs => pairs.map(p => {
        if (p.id !== pairId) return p;
        const conversations = p.conversations || [];
        const newConversation = {
            id: `convo_${Date.now()}`,
            title: convoData.title,
            tags: convoData.tags || [],
            messages: [],
            stickers: [],
            folderId: null,
            order: conversations.length,
        };
        return { ...p, conversations: [...conversations, newConversation] };
    }));
  }, []);
  const handleUpdateBackgroundImage = useCallback((pairId, newImageUrl) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, backgroundImage: newImageUrl } : p)); }, []);
  const handleAddSlideImage = useCallback((pairId, newImageId) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id === pairId) { const existingImages = p.slideImages || []; return { ...p, slideImages: [...existingImages, newImageId] }; } return p; })); }, []);
  const handleDeleteSlideImage = useCallback(async (pairId, imageIdToDelete) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id === pairId) { const updatedImages = (p.slideImages || []).filter(id => id !== imageIdToDelete); return { ...p, slideImages: updatedImages }; } return p; })); try { await db.images.delete(imageIdToDelete); } catch (error) { console.error("IndexedDB에서 이미지 삭제 실패:", error); } }, []);
  const handleUpdateCharacters = useCallback((pairId, newCharacterData) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, characters: newCharacterData } : p)); }, []);
  const handleOpenConvoSettingsModal = useCallback((convoId) => { const pair = (Array.isArray(characterPairs) ? characterPairs : []).find(p => p.id === selectedPairId); const convo = (pair?.conversations || []).find(c => c.id === convoId); if (convo) setEditingConvo(convo); }, [characterPairs, selectedPairId]);
  const handleUpdateConversation = useCallback((convoId, updatedData) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id !== selectedPairId) return p; const updatedConversations = (p.conversations || []).map(c => c.id !== convoId ? c : { ...c, ...updatedData }); return { ...p, conversations: updatedConversations }; })); setEditingConvo(null); }, [selectedPairId]);
  const handleDeleteConversation = useCallback((convoId) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id !== selectedPairId) return p; const updatedConversations = (p.conversations || []).filter(c => c.id !== convoId); return { ...p, conversations: updatedConversations }; })); }, [selectedPairId]);
  const handleEditMessage = useCallback((convoId, messageId, updatedData) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, messages: convo.messages.map(msg => msg.id === messageId ? { ...msg, ...updatedData } : msg) }; }) }; })); }, [selectedPairId]);
  const handleAddMessageInBetween = useCallback((convoId, targetMessageId, messageData, position) => { const newMessage = { id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, type: 'text', content: messageData.text, sender: messageData.sender, characterVersionId: messageData.characterVersionId, }; setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; const targetIndex = convo.messages.findIndex(msg => msg.id === targetMessageId); if (targetIndex === -1) return convo; const newMessages = [...convo.messages]; const insertIndex = position === 'before' ? targetIndex : targetIndex + 1; newMessages.splice(insertIndex, 0, newMessage); return { ...convo, messages: newMessages }; }) }; })); }, [selectedPairId]);
  const handleDeleteMessage = useCallback((convoId, messageId) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, messages: convo.messages.filter(msg => msg.id !== messageId) }; }) }; })); }, [selectedPairId]);
  const handleUpdateStickers = useCallback((convoId, newStickers) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, stickers: newStickers }; }) }; })); }, [selectedPairId]);
  const handleReorderPairs = useCallback((draggedId, targetId) => {
    setCharacterPairs(currentPairs => {
      const pairs = [...currentPairs];
      const draggedIndex = pairs.findIndex(p => p.id === draggedId);
      const targetIndex = pairs.findIndex(p => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return currentPairs;
      const [draggedItem] = pairs.splice(draggedIndex, 1);
      pairs.splice(targetIndex, 0, draggedItem);
      return pairs;
    });
  }, []);

  const handleAddFolder = useCallback((pairId, folderData) => {
    setCharacterPairs(pairs => pairs.map(p => {
      if (p.id !== pairId) return p;
      const folders = p.folders || [];
      const newFolder = {
        id: `folder_${Date.now()}`,
        name: folderData.name,
        tags: folderData.tags || [],
        order: folders.length
      };
      return { ...p, folders: [...folders, newFolder] };
    }));
  }, []);

  const handleRenameFolder = useCallback((pairId, folderId, folderData) => {
    setCharacterPairs(pairs => pairs.map(p => {
      if (p.id !== pairId) return p;
      const updatedFolders = p.folders.map(f => f.id === folderId ? { ...f, name: folderData.name, tags: folderData.tags } : f);
      return { ...p, folders: updatedFolders };
    }));
  }, []);

  const handleDeleteFolder = useCallback((pairId, folderId) => {
    setCharacterPairs(pairs => pairs.map(p => {
      if (p.id !== pairId) return p;
      const updatedFolders = p.folders.filter(f => f.id !== folderId);
      const updatedConversations = p.conversations.map(c => c.folderId === folderId ? { ...c, folderId: null } : c);
      return { ...p, folders: updatedFolders, conversations: updatedConversations };
    }));
  }, []);

  const handleMoveConversationToFolder = useCallback((pairId, conversationId, folderId) => {
    setCharacterPairs(pairs => pairs.map(p => {
      if (p.id !== pairId) return p;
      const updatedConversations = p.conversations.map(c => c.id === conversationId ? { ...c, folderId: folderId } : c);
      return { ...p, conversations: updatedConversations };
    }));
  }, []);

  const handleReorderItems = useCallback((pairId, dragItem, dropTarget) => {
    setCharacterPairs(pairs => pairs.map(p => {
        if (p.id !== pairId) return p;

        let conversations = [...p.conversations];
        let folders = [...p.folders];

        if (dragItem.type === 'conversation') {
            const draggedIndex = conversations.findIndex(c => c.id === dragItem.id);
            if (draggedIndex === -1) return p;
            
            const [draggedConvo] = conversations.splice(draggedIndex, 1);

            if (dropTarget.type === 'folder') {
                draggedConvo.folderId = dropTarget.id;
                conversations.push(draggedConvo);
            } else if (dropTarget.type === 'conversation') {
                const dropConvo = p.conversations.find(c => c.id === dropTarget.id);
                draggedConvo.folderId = dropConvo ? dropConvo.folderId : null;
                const dropIndex = conversations.findIndex(c => c.id === dropTarget.id);
                conversations.splice(dropIndex, 0, draggedConvo);
            } else { // root
                draggedConvo.folderId = null;
                conversations.push(draggedConvo);
            }
        } else if (dragItem.type === 'folder') {
            const draggedIndex = folders.findIndex(f => f.id === dragItem.id);
            if (draggedIndex === -1) return p;
            const [draggedFolder] = folders.splice(draggedIndex, 1);

            if (dropTarget.type === 'folder') {
                const dropIndex = folders.findIndex(f => f.id === dropTarget.id);
                folders.splice(dropIndex, 0, draggedFolder);
            } else {
                folders.push(draggedFolder);
            }
        }

        // Re-calculate order properties
        folders.forEach((f, index) => f.order = index);

        const convosByFolder = conversations.reduce((acc, c) => {
            const key = c.folderId || 'root';
            if (!acc[key]) acc[key] = [];
            acc[key].push(c);
            return acc;
        }, {});

        Object.values(convosByFolder).forEach(group => {
            group.forEach((convo, index) => {
                const originalConvo = conversations.find(c => c.id === convo.id);
                if (originalConvo) originalConvo.order = index;
            });
        });

        return { ...p, conversations, folders };
    }));
  }, []);
  
  const selectedPair = (Array.isArray(characterPairs) ? characterPairs : []).find(p => p.id === selectedPairId);
  const dashboardMenuItems = [ { label: '정보 수정', action: () => handleOpenPairSettingsModal(dashboardContextMenu.pairId) }, { isSeparator: true }, { label: '삭제', className: 'delete', action: () => handleDeletePair(dashboardContextMenu.pairId) }, ];

  return (
    <>
      <TitleBar 
        bgColor={globalTheme.titleBarBg} 
        onOpenSettings={() => setIsSettingsModalOpen(true)} 
        titleText={titleBarText}
      />
      <div className="app-container-root" style={{ paddingTop: '32px' }}>
        {currentView === 'dashboard' ? (
          <Dashboard logs={Array.isArray(characterPairs) ? characterPairs : []} onSelectLog={handleSelectPair} onOpenAddLogModal={() => setIsAddPairModalOpen(true)} bgColor={globalTheme.dashboardBg} onContextMenu={handleDashboardContextMenu} onReorder={handleReorderPairs} />
        ) : (
          selectedPair && (
            <Workspace
              pairData={selectedPair} 
              onGoToDashboard={handleGoToDashboard} 
              onAddConversation={handleAddConversation} 
              onAddMessage={handleAddMessage}
              onUpdateBackgroundImage={handleUpdateBackgroundImage} 
              onAddSlideImage={handleAddSlideImage} 
              onDeleteSlideImage={handleDeleteSlideImage}
              onUpdateCharacters={handleUpdateCharacters} 
              onUpdatePairDetails={handleUpdatePairDetails} 
              onEditConversation={handleOpenConvoSettingsModal}
              onDeleteConversation={handleDeleteConversation} 
              onUpdateTheme={handleUpdatePairTheme} 
              onEditMessage={handleEditMessage}
              onAddMessageInBetween={handleAddMessageInBetween} 
              onDeleteMessage={handleDeleteMessage} 
              onUpdateStickers={handleUpdateStickers}
              onToggleBookmark={handleToggleBookmark}
              onImportMessages={handleImportMessages}
              availableFonts={availableFonts}
              onAddOrUpdateTextSticker={handleAddOrUpdateTextSticker}
              onUpdateStickerOrder={handleUpdateStickerOrder}
              onDeleteSticker={handleDeleteSticker}
              onAddFolder={handleAddFolder}
              onRenameFolder={handleRenameFolder}
              onDeleteFolder={handleDeleteFolder}
              onReorderItems={handleReorderItems}
              onMoveConversationToFolder={handleMoveConversationToFolder}
            />
          )
        )}
        <AddPairModal isOpen={isAddPairModalOpen} onClose={() => setIsAddPairModalOpen(false)} onAddLog={handleCreatePairRequest} />
        <ThemeSelectionModal
          isOpen={isThemeSelectorOpen}
          onClose={() => { if (newPairDataBuffer) { handleThemeSelectedForNewPair(DEFAULT_WORKSPACE_THEME); } setIsThemeSelectorOpen(false); }}
          themes={themeOptionsForNewPair} onSelectTheme={handleThemeSelectedForNewPair}
        />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="전역 설정">
          <SettingsPanel 
            availableFonts={availableFonts} 
            selectedFont={selectedFont} 
            onFontChange={(e) => setSelectedFont(e.target.value)} 
            theme={globalTheme} 
            onThemeChange={handleUpdateGlobalTheme} 
            fontSize={fontSize} 
            onFontSizeChange={(e) => setFontSize(parseFloat(e.target.value))}
            letterSpacing={letterSpacing} 
            onLetterSpacingChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
            titleBarText={titleBarText}
            onTitleBarTextChange={handleUpdateTitleBarText}
          />
        </SettingsModal>
        <PairSettingsModal 
          isOpen={!!editingPair} onClose={() => setEditingPair(null)} pairData={editingPair} 
          onSave={(updatedDetails) => { handleUpdatePairDetails(editingPair.id, updatedDetails); setEditingPair(null); }}
        />
        <ConversationSettingsModal isOpen={!!editingConvo} onClose={() => setEditingConvo(null)} convoData={editingConvo} onSave={(updatedData) => handleUpdateConversation(editingConvo.id, updatedData)} />
        {dashboardContextMenu.isOpen && ( <ContextMenu position={dashboardContextMenu.position} items={dashboardMenuItems.map(item => ({...item, action: () => { if(item.action) item.action(); closeDashboardContextMenu(); }}))} onClose={closeDashboardContextMenu} /> )}
      </div>
    </>
  );
}

export default App;