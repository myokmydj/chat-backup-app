// 파일: src/components/ConversationSettingsModal.js (새 파일)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';

const ConversationSettingsModal = ({ isOpen, onClose, convoData, onSave }) => {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isOpen && convoData) {
      setTitle(convoData.title || '');
      setTags(convoData.tags || []);
    }
  }, [isOpen, convoData]);

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
    // convoData.id는 필요 없고, title과 tags만 전달합니다.
    onSave({ title, tags });
    onClose();
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={onClose} title="개별 대화 수정">
      <form onSubmit={handleSubmit} className="pair-settings-form">
        <div className="form-group">
          <label htmlFor="convo-title">제목</label>
          <input
            id="convo-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>태그</label>
          <div className="tag-input-container">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              placeholder="태그 입력 후 Enter"
            />
            <button type="button" onClick={handleAddTag}>추가</button>
          </div>
          <div className="tags-list">
            {(tags || []).map((tag, index) => (
              <div key={index} className="tag-item">
                {tag}
                <button type="button" className="remove-tag-btn" onClick={() => handleRemoveTag(tag)}>&times;</button>
              </div>
            ))}
          </div>
        </div>
        <button type="submit" className="save-button">저장하기</button>
      </form>
    </SettingsModal>
  );
};

export default ConversationSettingsModal;