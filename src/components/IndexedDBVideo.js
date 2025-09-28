// 파일: src/components/IndexedDBVideo.js (새 파일)

import React, { useState, useEffect } from 'react';
import { db } from '../db';

const IndexedDBVideo = ({ videoId, className, ...props }) => {
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    let objectUrl = null;

    const loadVideo = async () => {
      if (!videoId) {
        setVideoUrl('');
        return;
      }
      try {
        const videoRecord = await db.images.get(videoId);
        if (videoRecord && videoRecord.data) {
          objectUrl = URL.createObjectURL(videoRecord.data);
          setVideoUrl(objectUrl);
        }
      } catch (error) {
        console.error(`Failed to load video (id: ${videoId}) from IndexedDB`, error);
      }
    };

    loadVideo();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoId]);

  if (!videoUrl) {
    return <div className={`${className} media-loading-placeholder`}>비디오 로딩 중...</div>;
  }

  return (
    <video src={videoUrl} className={className} controls {...props} />
  );
};

export default IndexedDBVideo;