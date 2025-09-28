// File: src/App.js (수정 완료)

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

// ▼▼▼ [수정] 캐릭터 프로필 기본값 생성 함수 ▼▼▼
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

function App() {
  const [characterPairs, setCharacterPairs] = useState(() => getInitialState('pair-chat-data', []));
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPairId, setSelectedPairId] = useState(null);
  const [isAddPairModalOpen, setIsAddPairModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [globalTheme, setGlobalTheme] = useState(() => getInitialState('chat-app-global-theme', DEFAULT_GLOBAL_THEME));
  const [selectedFont, setSelectedFont] = useState(() => getInitialState('chat-backup-font', WEB_FONTS[0].value));
  const [availableFonts] = useState({ web: WEB_FONTS, system: [] });
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
  useEffect(() => { localStorage.setItem('chat-backup-font', JSON.stringify(selectedFont)); }, [selectedFont]);
  useEffect(() => { localStorage.setItem('chat-backup-font-size', fontSize); document.documentElement.style.setProperty('--global-font-size', `${fontSize}px`); }, [fontSize]);
  useEffect(() => { localStorage.setItem('chat-backup-letter-spacing', letterSpacing); document.documentElement.style.setProperty('--global-letter-spacing', `${letterSpacing}px`); }, [letterSpacing]);
  useEffect(() => { document.documentElement.style.setProperty('--global-accent-color', globalTheme.titleBarBg || '#FFFFFF'); }, [globalTheme.titleBarBg]);

  const handleThemeSelectedForNewPair = useCallback((selectedTheme) => {
    if (!newPairDataBuffer) return;
    const newPair = {
      ...newPairDataBuffer,
      id: `pair_${Date.now()}`,
      conversations: [],
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
      const newPair = { ...pairData, id: `pair_${Date.now()}`, conversations: [], slideImages: [], characters: { ...DEFAULT_CHARACTERS }, tags: [], theme: { ...DEFAULT_WORKSPACE_THEME } };
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
    // ▼▼▼ [수정] 메시지 데이터에서 characterVersionId를 추출 ▼▼▼
    const { characterVersionId } = messageData;

    if (messageData.type === 'file') {
      const { file, sender } = messageData;
      try {
        const imageId = await db.images.add({ data: file });
        const fileType = file.type.startsWith('image/') ? 'image' : 'video';
        newMessage = { id: Date.now(), sender, type: fileType, content: imageId, characterVersionId };
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
            newMessage = { id: Date.now(), sender, type: 'link', content: { ...parsedData.content, ...metadata }, characterVersionId };
          } else {
            newMessage = { id: Date.now(), sender, type: 'text', content: text, characterVersionId };
          }
        } catch (error) {
          newMessage = { id: Date.now(), sender, type: 'text', content: text, characterVersionId };
        }
      } else if (parsedData && parsedData.type === 'embed') {
        newMessage = { id: Date.now(), sender, ...parsedData, characterVersionId };
      } else {
        newMessage = { id: Date.now(), sender, type: 'text', content: text, characterVersionId };
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

  const handleDashboardContextMenu = (e, pairId) => { e.preventDefault(); setDashboardContextMenu({ isOpen: true, position: { x: e.clientX, y: e.clientY }, pairId }); };
  const closeDashboardContextMenu = () => setDashboardContextMenu({ ...dashboardContextMenu, isOpen: false });
  const handleDeletePair = useCallback((pairIdToDelete) => { if (window.confirm("정말로 이 대화 로그 전체를 삭제하시겠습니까? 모든 내용이 영구적으로 사라집니다.")) { setCharacterPairs(pairs => pairs.filter(p => p.id !== pairIdToDelete)); } }, []);
  const handleOpenPairSettingsModal = useCallback((pairId) => { const pairToEdit = characterPairs.find(p => p.id === pairId); if (pairToEdit) { setEditingPair(pairToEdit); } }, [characterPairs]);
  const handleUpdateGlobalTheme = useCallback((newTheme) => setGlobalTheme(newTheme), []);
  const handleUpdatePairTheme = useCallback((pairId, newTheme) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, theme: newTheme } : p)); }, []);
  const handleSelectPair = useCallback((pairId) => { setSelectedPairId(pairId); setCurrentView('workspace'); }, []);
  const handleGoToDashboard = useCallback(() => { setSelectedPairId(null); setCurrentView('dashboard'); }, []);
  const handleUpdatePairDetails = useCallback((pairId, updatedDetails) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, title: updatedDetails.title, tags: updatedDetails.tags } : p)); }, []);
  const handleAddConversation = useCallback((pairId, convoData) => { const newConversation = { id: `convo_${Date.now()}`, title: convoData.title, tags: convoData.tags || [], messages: [], stickers: [] }; setCharacterPairs(pairs => pairs.map(p => { if (p.id === pairId) { const conversations = p.conversations || []; return { ...p, conversations: [...conversations, newConversation] }; } return p; })); }, []);
  const handleUpdateBackgroundImage = useCallback((pairId, newImageUrl) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, backgroundImage: newImageUrl } : p)); }, []);
  const handleAddSlideImage = useCallback((pairId, newImageId) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id === pairId) { const existingImages = p.slideImages || []; return { ...p, slideImages: [...existingImages, newImageId] }; } return p; })); }, []);
  const handleDeleteSlideImage = useCallback(async (pairId, imageIdToDelete) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id === pairId) { const updatedImages = (p.slideImages || []).filter(id => id !== imageIdToDelete); return { ...p, slideImages: updatedImages }; } return p; })); try { await db.images.delete(imageIdToDelete); } catch (error) { console.error("IndexedDB에서 이미지 삭제 실패:", error); } }, []);
  const handleUpdateCharacters = useCallback((pairId, newCharacterData) => { setCharacterPairs(pairs => pairs.map(p => p.id === pairId ? { ...p, characters: newCharacterData } : p)); }, []);
  const handleOpenConvoSettingsModal = useCallback((convoId) => { const pair = (Array.isArray(characterPairs) ? characterPairs : []).find(p => p.id === selectedPairId); const convo = (pair?.conversations || []).find(c => c.id === convoId); if (convo) setEditingConvo(convo); }, [characterPairs, selectedPairId]);
  const handleUpdateConversation = useCallback((convoId, updatedData) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id !== selectedPairId) return p; const updatedConversations = (p.conversations || []).map(c => c.id !== convoId ? c : { ...c, ...updatedData }); return { ...p, conversations: updatedConversations }; })); setEditingConvo(null); }, [selectedPairId]);
  const handleDeleteConversation = useCallback((convoId) => { setCharacterPairs(pairs => pairs.map(p => { if (p.id !== selectedPairId) return p; const updatedConversations = (p.conversations || []).filter(c => c.id !== convoId); return { ...p, conversations: updatedConversations }; })); }, [selectedPairId]);
  const handleEditMessage = useCallback((convoId, messageId, newText, newSender) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, messages: convo.messages.map(msg => msg.id === messageId ? { ...msg, content: newText, sender: newSender } : msg) }; }) }; })); }, [selectedPairId]);
  const handleAddMessageInBetween = useCallback((convoId, targetMessageId, messageData, position) => { const newMessage = { ...messageData, id: Date.now(), type: 'text', content: messageData.text }; setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; const targetIndex = convo.messages.findIndex(msg => msg.id === targetMessageId); if (targetIndex === -1) return convo; const newMessages = [...convo.messages]; const insertIndex = position === 'before' ? targetIndex : targetIndex + 1; newMessages.splice(insertIndex, 0, newMessage); return { ...convo, messages: newMessages }; }) }; })); }, [selectedPairId]);
  const handleDeleteMessage = useCallback((convoId, messageId) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, messages: convo.messages.filter(msg => msg.id !== messageId) }; }) }; })); }, [selectedPairId]);
  const handleUpdateStickers = useCallback((convoId, newStickers) => { setCharacterPairs(pairs => pairs.map(pair => { if (pair.id !== selectedPairId) return pair; return { ...pair, conversations: pair.conversations.map(convo => { if (convo.id !== convoId) return convo; return { ...convo, stickers: newStickers }; }) }; })); }, [selectedPairId]);
  
  const selectedPair = (Array.isArray(characterPairs) ? characterPairs : []).find(p => p.id === selectedPairId);
  const dashboardMenuItems = [ { label: '정보 수정', action: () => handleOpenPairSettingsModal(dashboardContextMenu.pairId) }, { isSeparator: true }, { label: '삭제', className: 'delete', action: () => handleDeletePair(dashboardContextMenu.pairId) }, ];

  return (
    <>
      <TitleBar bgColor={globalTheme.titleBarBg} onOpenSettings={() => setIsSettingsModalOpen(true)} />
      <div className="app-container-root" style={{ paddingTop: '32px' }}>
        {currentView === 'dashboard' ? (
          <Dashboard logs={Array.isArray(characterPairs) ? characterPairs : []} onSelectLog={handleSelectPair} onOpenAddLogModal={() => setIsAddPairModalOpen(true)} bgColor={globalTheme.dashboardBg} onContextMenu={handleDashboardContextMenu} />
        ) : (
          selectedPair && (
            <Workspace
              pairData={selectedPair} onGoToDashboard={handleGoToDashboard} onAddConversation={handleAddConversation} onAddMessage={handleAddMessage}
              onUpdateBackgroundImage={handleUpdateBackgroundImage} onAddSlideImage={handleAddSlideImage} onDeleteSlideImage={handleDeleteSlideImage}
              onUpdateCharacters={handleUpdateCharacters} onUpdatePairDetails={handleUpdatePairDetails} onEditConversation={handleOpenConvoSettingsModal}
              onDeleteConversation={handleDeleteConversation} onUpdateTheme={handleUpdatePairTheme} onEditMessage={handleEditMessage}
              onAddMessageInBetween={handleAddMessageInBetween} onDeleteMessage={handleDeleteMessage} onUpdateStickers={handleUpdateStickers}
              onToggleBookmark={handleToggleBookmark}
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
            availableFonts={availableFonts} selectedFont={selectedFont} onFontChange={(e) => setSelectedFont(e.target.value)} 
            theme={globalTheme} onThemeChange={handleUpdateGlobalTheme} fontSize={fontSize} onFontSizeChange={(e) => setFontSize(parseFloat(e.target.value))}
            letterSpacing={letterSpacing} onLetterSpacingChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
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