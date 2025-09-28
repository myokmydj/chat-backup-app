// 파일: src/components/PairSettingsModal.js (수정 완료)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';

const PairSettingsModal = ({ isOpen, onClose, pairData, onSave }) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen && pairData) {
      setTitle(pairData.title || '');
      setTags(pairData.tags || []);
    }
  }, [isOpen, pairData]);

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
    onSave({ title, tags });
    onClose();
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="로그 정보 수정">
      {/* ▼▼▼ [핵심 수정] utility-panel 클래스를 적용하여 일관된 폼 레이아웃을 만듭니다. ▼▼▼ */}
      <form onSubmit={handleSubmit} className="utility-panel">
        <div className="form-card">
          <label htmlFor="pair-title" className="card-label">제목</label>
          <input
            id="pair-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-card">
          <label className="card-label">태그</label>
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
        {/* ▼▼▼ [핵심 수정] 버튼에 btn-primary 클래스를 적용합니다. ▼▼▼ */}
        <button type="submit" className="btn-primary">저장하기</button>
      </form>
    </SettingsModal>
  );
};

export default PairSettingsModal;