// File: src/components/CharacterSettingsModal.js (수정 완료)

import React, { useState, useEffect, useRef } from 'react';
import SettingsModal from './SettingsModal';
import IndexedDBImage from './IndexedDBImage';
import { db } from '../db';

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

const createNewVersion = (name) => ({
  id: `v_${Date.now()}`,
  name: name || '새 버전',
  username: '', avatar: null, profileBanner: null, headerColor1: '#232428', headerColor2: '#232428', statusMessage: '', memo: '', tags: []
});

const CharacterSettingsModal = ({ isOpen, onClose, pairData, onUpdate, onOpenCropper }) => {
  const [characters, setCharacters] = useState({ me: [], other: [] });
  const [selectedVersion, setSelectedVersion] = useState({ me: null, other: null });
  const [tagInputs, setTagInputs] = useState({ me: '', other: '' });

  const fileInputRefs = {
    me_avatar: useRef(null), other_avatar: useRef(null),
    me_banner: useRef(null), other_banner: useRef(null),
  };

  useEffect(() => {
    if (isOpen && pairData) {
      const initialMe = Array.isArray(pairData.characters?.me) && pairData.characters.me.length > 0
        ? pairData.characters.me
        : [createNewVersion('A 캐릭터')];
      const initialOther = Array.isArray(pairData.characters?.other) && pairData.characters.other.length > 0
        ? pairData.characters.other
        : [createNewVersion('B 캐릭터')];
      
      setCharacters({ me: initialMe, other: initialOther });
      setSelectedVersion({ me: initialMe[0]?.id, other: initialOther[0]?.id });
    }
  }, [isOpen, pairData]);

  const handleVersionChange = (key, versionId) => {
    setSelectedVersion(prev => ({ ...prev, [key]: versionId }));
  };

  const handleAddVersion = (key) => {
    const newVersion = createNewVersion(`버전 ${characters[key].length + 1}`);
    setCharacters(prev => ({ ...prev, [key]: [...prev[key], newVersion] }));
    setSelectedVersion(prev => ({ ...prev, [key]: newVersion.id }));
  };
  
  const handleCloneVersion = (key) => {
    const sourceVersion = characters[key].find(v => v.id === selectedVersion[key]);
    if (!sourceVersion) return;
    const clonedVersion = { ...sourceVersion, id: `v_${Date.now()}`, name: `${sourceVersion.name} (복제)` };
    setCharacters(prev => ({ ...prev, [key]: [...prev[key], clonedVersion] }));
    setSelectedVersion(prev => ({ ...prev, [key]: clonedVersion.id }));
  };

  const handleDeleteVersion = (key) => {
    if (characters[key].length <= 1) {
      alert('최소 한 개의 프로필 버전은 유지해야 합니다.');
      return;
    }
    if (window.confirm('이 프로필 버전을 삭제하시겠습니까?')) {
      const newVersions = characters[key].filter(v => v.id !== selectedVersion[key]);
      setCharacters(prev => ({ ...prev, [key]: newVersions }));
      setSelectedVersion(prev => ({ ...prev, [key]: newVersions[0]?.id }));
    }
  };

  const handleFieldChange = (key, field, value) => {
    setCharacters(prev => ({
      ...prev,
      [key]: prev[key].map(v => v.id === selectedVersion[key] ? { ...v, [field]: value } : v)
    }));
  };

  const handleFileSelect = (key, field, e) => {
    const file = e.target.files[0];
    if (file) {
      const callback = async (croppedDataUrl) => {
        try {
          const imageBlob = dataURLtoBlob(croppedDataUrl);
          const imageId = await db.images.add({ data: imageBlob });
          handleFieldChange(key, field, imageId);
        } catch (error) { console.error("이미지 저장 실패:", error); }
      };
      const aspectRatio = field === 'avatar' ? 1 : 3;
      onOpenCropper(file, aspectRatio, callback);
    }
    e.target.value = null;
  };

  const handleAddTag = (key) => {
    const currentVersion = characters[key].find(v => v.id === selectedVersion[key]);
    if (!currentVersion) return;
    const trimmedTag = tagInputs[key].trim();
    if (trimmedTag && !(currentVersion.tags || []).includes(trimmedTag)) {
      handleFieldChange(key, 'tags', [...(currentVersion.tags || []), trimmedTag]);
      setTagInputs(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleRemoveTag = (key, tagToRemove) => {
    const currentVersion = characters[key].find(v => v.id === selectedVersion[key]);
    if (!currentVersion) return;
    const newTags = (currentVersion.tags || []).filter(tag => tag !== tagToRemove);
    handleFieldChange(key, 'tags', newTags);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(pairData.id, characters);
    onClose();
  };

  const renderCharacterForm = (key, label) => {
    const currentVersion = characters[key].find(v => v.id === selectedVersion[key]);
    if (!currentVersion) return null;

    return (
      <div className="character-profile-editor">
        <h3 className="character-editor-title">{label}</h3>
        
        <div className="form-card version-manager">
          <label className="card-label">프로필 버전 관리</label>
          <select value={selectedVersion[key]} onChange={(e) => handleVersionChange(key, e.target.value)}>
            {characters[key].map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <div className="version-buttons">
            <button type="button" onClick={() => handleAddVersion(key)} title="새 버전 추가"><i className="fas fa-plus"></i></button>
            <button type="button" onClick={() => handleCloneVersion(key)} title="현재 버전 복제"><i className="fas fa-clone"></i></button>
            <button type="button" onClick={() => handleDeleteVersion(key)} title="현재 버전 삭제" disabled={characters[key].length <= 1}><i className="fas fa-trash-alt"></i></button>
          </div>
        </div>

        <div className="form-card">
          <label className="card-label">기본 정보</label>
          <div className="image-upload-grid avatar-grid">
            <div className="image-preview-box avatar-preview" onClick={() => fileInputRefs[`${key}_avatar`].current.click()}>
              {currentVersion.avatar ? <IndexedDBImage imageId={currentVersion.avatar} className="image-preview-instance" /> : <div className="image-placeholder"><i className="fas fa-user"></i><span>아바타</span></div>}
            </div>
            <div className="file-upload-controls">
              <input type="text" placeholder="버전 이름 (예: 평상복)" value={currentVersion.name || ''} onChange={(e) => handleFieldChange(key, 'name', e.target.value)} />
              <input type="text" placeholder="사용자명" value={currentVersion.username || ''} onChange={(e) => handleFieldChange(key, 'username', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="form-card">
          <label className="card-label">프로필 꾸미기</label>
          <div className="image-preview-box banner-preview" onClick={() => fileInputRefs[`${key}_banner`].current.click()}>
            {currentVersion.profileBanner ? <IndexedDBImage imageId={currentVersion.profileBanner} className="image-preview-instance" /> : <div className="image-placeholder"><i className="fas fa-image"></i><span>프로필 배너 (3:1 비율)</span></div>}
          </div>
          <div className="color-picker-group">
            <label>헤더 그라데이션:</label>
            <input type="color" value={currentVersion.headerColor1 || '#232428'} onChange={(e) => handleFieldChange(key, 'headerColor1', e.target.value)} />
            <span>→</span>
            <input type="color" value={currentVersion.headerColor2 || '#232428'} onChange={(e) => handleFieldChange(key, 'headerColor2', e.target.value)} />
          </div>
          <input type="text" placeholder="상태 메시지 (선택)" value={currentVersion.statusMessage || ''} onChange={(e) => handleFieldChange(key, 'statusMessage', e.target.value)} />
        </div>
        <div className="form-card">
          <label className="card-label">메모 및 태그</label>
          <textarea placeholder="메모 (선택)" rows="3" value={currentVersion.memo || ''} onChange={(e) => handleFieldChange(key, 'memo', e.target.value)} />
          <div className="tag-input-container" style={{marginTop: '1rem'}}>
            <input type="text" placeholder="태그 추가 후 Enter" value={tagInputs[key]} onChange={(e) => setTagInputs(prev => ({ ...prev, [key]: e.target.value }))} onKeyDown={(e) => { if (!e.nativeEvent.isComposing && e.key === 'Enter') { e.preventDefault(); handleAddTag(key); }}} />
            <button type="button" onClick={() => handleAddTag(key)}>+</button>
          </div>
          <div className="tags-list">
            {(currentVersion.tags || []).map(tag => <div key={tag} className="tag-item">{tag}<button type="button" onClick={() => handleRemoveTag(key, tag)}>&times;</button></div>)}
          </div>
        </div>
        <input type="file" ref={fileInputRefs[`${key}_avatar`]} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileSelect(key, 'avatar', e)} />
        <input type="file" ref={fileInputRefs[`${key}_banner`]} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileSelect(key, 'banner', e)} />
      </div>
    );
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="캐릭터 설정" customContentClass="character-settings-modal-content">
      <form onSubmit={handleSubmit} className="character-settings-form">
        <div className="character-form-grid">
          {renderCharacterForm('me', 'A 캐릭터 (나)')}
          {renderCharacterForm('other', 'B 캐릭터 (상대)')}
        </div>
        <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>저장하기</button>
      </form>
    </SettingsModal>
  );
};

export default CharacterSettingsModal;