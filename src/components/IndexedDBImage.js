// 파일: src/components/IndexedDBImage.js (수정 완료)

import React, { useState, useEffect } from 'react';
import { db } from '../db';

const IndexedDBImage = ({ imageId, onUrlLoad, ...props }) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    let objectUrl = null;

    const loadImage = async () => {
      if (!imageId) {
        setImageUrl('');
        if (onUrlLoad) onUrlLoad(null); // imageId가 없으면 URL도 null
        return;
      }

      try {
        const imageRecord = await db.images.get(imageId);
        if (imageRecord && imageRecord.data) {
          objectUrl = URL.createObjectURL(imageRecord.data);
          setImageUrl(objectUrl);
          // ▼▼▼ [핵심] 로드된 URL을 부모 컴포넌트로 전달 ▼▼▼
          if (onUrlLoad) {
            onUrlLoad(objectUrl);
          }
        }
      } catch (error) {
        console.error(`Failed to load image (id: ${imageId}) from IndexedDB`, error);
      }
    };

    loadImage();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageId, onUrlLoad]); // onUrlLoad를 의존성 배열에 추가

  if (!imageUrl) {
    // ▼▼▼ [핵심] ...props를 전달하여 style 등이 적용되도록 함 ▼▼▼
    return <div className={`${props.className} image-loading-placeholder`} {...props}></div>;
  }

  // ▼▼▼ [핵심] ...props를 img 태그에 전달하여 style 등이 적용되도록 함 ▼▼▼
  return (
    <img src={imageUrl} alt={`db-img-${imageId}`} {...props} />
  );
};

export default IndexedDBImage;