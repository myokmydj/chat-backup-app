// 파일: src/components/FolderSettingsModal.js (새 파일)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';

const FolderSettingsModal = ({ isOpen, onClose, folderData, onSave }) => {
  const [name, setName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(folderData?.name || '');
      setTags(folderData?.tags || []);
      setTagInput('');
    }
  }, [isOpen, folderData]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (!e.nativeEvent.isComposing && e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('폴더 이름을 입력해주세요.');
      return;
    }
    onSave({ name, tags });
    onClose();
  };

  const isEditing = !!folderData?.id;

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title={isEditing ? "폴더 수정" : "새 폴더 생성"}>
      <form onSubmit={handleSubmit} className="utility-panel">
        <div className="form-card">
          <label htmlFor="folder-name" className="card-label">폴더 이름</label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="폴더의 이름을 입력하세요"
            required
          />
        </div>
        <div className="form-card">
          <label className="card-label">태그 (선택)</label>
          <div className="tag-input-container">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="태그 입력 후 Enter 또는 추가"
            />
            <button type="button" onClick={handleAddTag}>+</button>
          </div>
          <div className="tags-list">
            {(tags || []).map((tag, index) => (
              <div key={index} className="tag-item">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="btn-primary">{isEditing ? '저장하기' : '생성하기'}</button>
      </form>
    </SettingsModal>
  );
};

export default FolderSettingsModal;