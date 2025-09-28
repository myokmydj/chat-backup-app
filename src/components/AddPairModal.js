// 파일: src/components/AddPairModal.js (단순화 완료)

import React, { useState, useRef } from 'react';
import SettingsModal from './SettingsModal';
import ImageCropModal from './ImageCropModal';

const AddPairModal = ({ isOpen, onClose, onAddLog }) => {
  const [title, setTitle] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(''); // Base64 URL
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleCropComplete = (croppedDataUrl) => {
    setBackgroundImage(croppedDataUrl);
    setIsCropperOpen(false);
  };

  const handleClearImage = () => {
    setBackgroundImage('');
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    // 테마 생성 없이, 수집된 데이터만 부모에게 전달합니다.
    onAddLog({ title, backgroundImage });
    
    // 상태 초기화 및 모달 닫기
    setTitle('');
    setBackgroundImage('');
    onClose();
  };

  return (
    <>
      <SettingsModal isOpen={isOpen} onClose={onClose} title="새 대화 구성">
        <form onSubmit={handleSubmit} className="add-pair-form utility-panel">
          
          <div className="form-card">
            <label htmlFor="pair-title" className="card-label">제목</label>
            <input
              id="pair-title"
              type="text"
              placeholder="대화의 고유한 제목을 입력"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-card">
            <label className="card-label">배경 이미지 (선택)</label>
            <div className="image-upload-grid">
              <div className="image-preview-box">
                {backgroundImage ? (
                  <img src={backgroundImage} alt="배경 미리보기" className="image-preview-instance" />
                ) : (
                  <div className="image-placeholder">
                    <i className="fas fa-image"></i>
                    <span>이미지 없음</span>
                  </div>
                )}
              </div>
              <div className="file-upload-controls">
                <p className="upload-description">
                  대표 이미지를 선택하면 어울리는 테마를 추천해 드립니다.
                </p>
                <button type="button" className="btn-secondary" onClick={() => fileInputRef.current.click()}>
                  이미지 선택...
                </button>
                {backgroundImage && (
                  <button type="button" className="btn-tertiary" onClick={handleClearImage}>
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <button type="submit" className="btn-primary">생성하기</button>
          
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
        </form>
      </SettingsModal>
      
      <ImageCropModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        outputWidth={512}
      />
    </>
  );
};
export default AddPairModal;