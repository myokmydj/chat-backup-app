// 파일: src/components/ImageCropModal.js

import React, { useRef } from 'react';
import Cropper from 'react-cropper';
import SettingsModal from './SettingsModal';

// outputWidth prop을 추가로 받습니다.
const ImageCropModal = ({ isOpen, onClose, imageSrc, onCropComplete, aspectRatio = 16 / 9, outputWidth }) => {
  const cropperRef = useRef(null);

  const handleCrop = () => {
    const cropper = cropperRef.current?.cropper;
    if (typeof cropper !== 'undefined') {
      // --- ▼▼▼ 핵심 변경 부분 ▼▼▼ ---
      const options = {
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      };

      // outputWidth prop이 전달되었다면, 결과물 캔버스의 너비를 고정합니다.
      if (outputWidth) {
        options.width = outputWidth;
        // 높이는 Cropper가 가로세로 비율(aspectRatio)에 맞춰 자동으로 계산해줍니다.
      }
      
      // getCroppedCanvas에 옵션을 전달합니다.
      const canvas = cropper.getCroppedCanvas(options);

      // toDataURL을 사용하여 이미지 퀄리티를 지정하여 용량을 최적화할 수 있습니다. (JPEG, 90% 품질)
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      // --- ▲▲▲ 핵심 변경 부분 ▲▲▲ ---
      
      onCropComplete(croppedDataUrl);
      onClose();
    }
  };

  return (
    <SettingsModal
      isOpen={isOpen}
      onClose={onClose}
      title="이미지 편집"
      customContentClass="image-crop-modal-content"
    >
      <div className="crop-container">
        {imageSrc ? (
          <Cropper
            key={imageSrc}
            ref={cropperRef}
            src={imageSrc}
            style={{ height: '100%', width: '100%' }}
            aspectRatio={aspectRatio}
            guides={true}
            viewMode={1}
            background={false}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
          />
        ) : (
          <div className="crop-placeholder"><p>이미지를 불러오는 중...</p></div>
        )}
      </div>
      <button className="crop-button" onClick={handleCrop}>자르기 및 저장</button>
    </SettingsModal>
  );
};

export default ImageCropModal;