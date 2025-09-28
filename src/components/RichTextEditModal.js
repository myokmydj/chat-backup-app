// File: src/components/RichTextEditModal.js (수정 완료)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';
import TiptapEditor from './TiptapEditor';
import InputDialog from './InputDialog';
import { getMarkAttributes } from '@tiptap/core';

const RichTextEditModal = ({ isOpen, onClose, onSave, initialContent, initialSender, initialVersionId, characters }) => {
  const [content, setContent] = useState('');
  const [sender, setSender] = useState('Me');
  const [characterVersionId, setCharacterVersionId] = useState(null); // ▼▼▼ [신규] 버전 ID 상태

  const [commentDialog, setCommentDialog] = useState({
    isOpen: false,
    editor: null,
    defaultValue: '',
  });

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
      const currentSender = initialSender || 'Me';
      setSender(currentSender);

      // ▼▼▼ [수정] 초기 버전 ID 설정 로직
      const characterKey = currentSender === 'Me' ? 'me' : 'other';
      const versions = characters[characterKey] || [];
      // 초기 버전 ID가 유효하면 사용하고, 아니면 해당 캐릭터의 첫 번째 버전을 기본값으로 설정
      const validInitialVersionId = versions.some(v => v.id === initialVersionId)
        ? initialVersionId
        : (versions[0]?.id || null);
      setCharacterVersionId(validInitialVersionId);
    }
  }, [isOpen, initialContent, initialSender, initialVersionId, characters]);

  // ▼▼▼ [신규] 화자가 변경될 때, 해당 화자의 첫 번째 버전을 기본으로 선택
  useEffect(() => {
    if (!isOpen) return;
    const characterKey = sender === 'Me' ? 'me' : 'other';
    const versions = characters[characterKey] || [];
    setCharacterVersionId(versions[0]?.id || null);
  }, [sender, isOpen, characters]);

  const handleSave = () => {
    onSave({ content, sender, characterVersionId }); // ▼▼▼ [수정] 버전 ID도 함께 저장
    onClose();
  };

  const handleSetComment = (editor) => {
    const existingComment = getMarkAttributes(editor.state, 'comment').comment || '';
    setCommentDialog({
      isOpen: true,
      editor: editor,
      defaultValue: existingComment,
    });
  };

  const handleCloseCommentDialog = () => {
    setCommentDialog({ isOpen: false, editor: null, defaultValue: '' });
  };
  
  const handleConfirmComment = (formData) => {
    const { editor } = commentDialog;
    const commentText = formData.comment.trim();
    if (editor && commentText) {
      editor.chain().focus().setComment({ comment: commentText }).run();
    } else if (editor) {
      editor.chain().focus().unsetComment().run();
    }
    handleCloseCommentDialog();
  };
  
  const isCharactersValid = characters && characters.me && characters.other;
  const versionsForSelectedSender = characters ? (sender === 'Me' ? characters.me : characters.other) : [];

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={onClose} title="메시지 수정">
        <div className="rich-text-edit-container">
          
          {isCharactersValid && (
            <div className="form-group-row">
              <div className="form-group">
                <label>화자</label>
                <select value={sender} onChange={(e) => setSender(e.target.value)}>
                  <option value="Me">{characters.me[0]?.name || 'A 캐릭터'}</option>
                  <option value="Other">{characters.other[0]?.name || 'B 캐릭터'}</option>
                </select>
              </div>
              {/* ▼▼▼ [신규] 버전 선택 드롭다운 ▼▼▼ */}
              <div className="form-group">
                <label>프로필 버전</label>
                <select value={characterVersionId || ''} onChange={(e) => setCharacterVersionId(e.target.value)}>
                  {(versionsForSelectedSender || []).map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <TiptapEditor
            content={content}
            onUpdate={setContent}
            onSetComment={handleSetComment}
          />
          <div className="dialog-buttons">
            <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
            <button type="button" className="btn-primary" onClick={handleSave}>저장</button>
          </div>
        </div>
      </SettingsModal>
      
      <InputDialog
        isOpen={commentDialog.isOpen}
        title="주석 추가/수정"
        fields={[
          {
            name: 'comment',
            label: '주석 내용',
            type: 'textarea',
            placeholder: '표시할 주석을 입력하세요...',
            defaultValue: commentDialog.defaultValue,
          },
        ]}
        onConfirm={handleConfirmComment}
        onCancel={handleCloseCommentDialog}
      />
    </>
  );
};

export default RichTextEditModal;