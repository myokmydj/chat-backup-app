// File: src/components/InputDialog.js (수정 완료)

import React, { useState, useEffect } from 'react';
import SettingsModal from './SettingsModal';

// ▼▼▼ [핵심 수정] fields prop에 기본값으로 빈 배열([])을 할당하여 오류를 방지합니다. ▼▼▼
const InputDialog = ({ isOpen, title, fields = [], initialData, onConfirm, onCancel }) => {
  const [formState, setFormState] = useState({});

  useEffect(() => {
    if (isOpen) {
      // initialData prop으로 상태를 초기화합니다.
      setFormState(initialData || {});
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormState = { ...formState, [name]: value };
    
    // sender가 변경되면, 해당 캐릭터의 첫 번째 버전 ID를 자동으로 설정
    if (name === 'sender') {
      const fieldWithOptions = fields.find(f => f.name === 'characterVersionId');
      if (fieldWithOptions && fieldWithOptions.options.length > 0) {
        // 이 로직은 Workspace의 useEffect로 대체되었으므로, 여기서는 단순 상태 업데이트만 수행합니다.
        // Workspace에서 sender 변경을 감지하고 fields를 다시 내려주면,
        // 아래의 useEffect가 characterVersionId를 올바르게 설정합니다.
      }
    }
    setFormState(newFormState);
  };
  
  // 필드(특히 버전 옵션)가 변경되면 formState의 버전 ID를 유효한 값으로 업데이트
  useEffect(() => {
    if (isOpen) {
      const versionField = fields.find(f => f.name === 'characterVersionId');
      if (versionField) {
        const currentVersionId = formState.characterVersionId;
        const availableVersionIds = versionField.options.map(opt => opt.value);
        if (!availableVersionIds.includes(currentVersionId)) {
          setFormState(prev => ({ ...prev, characterVersionId: availableVersionIds[0] || null }));
        }
      }
    }
  }, [isOpen, fields, formState.characterVersionId]);


  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirm(formState);
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <SettingsModal isOpen={isOpen} onClose={handleCancel} title={title}>
      <form onSubmit={handleConfirm} className="input-dialog-form utility-panel">
        {fields.map(field => (
          <div key={field.name} className="form-card">
            <label htmlFor={field.name} className="card-label">{field.label}</label>
            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                name={field.name}
                value={formState[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                rows="3"
                required
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={formState[field.name] || ''}
                onChange={handleChange}
              >
                {(field.options || []).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                id={field.name}
                name={field.name}
                value={formState[field.name] || ''}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
              />
            )}
          </div>
        ))}
        <div className="dialog-buttons">
          <button type="button" className="btn-secondary" onClick={handleCancel}>취소</button>
          <button type="submit" className="btn-primary">확인</button>
        </div>
      </form>
    </SettingsModal>
  );
};

export default InputDialog;