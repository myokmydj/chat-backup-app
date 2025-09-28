// 파일: src/db.js

import Dexie from 'dexie';

// 'chatBackupDB'라는 이름의 데이터베이스를 생성합니다.
export const db = new Dexie('chatBackupDB');

// 데이터베이스 스키마(구조)를 정의합니다.
db.version(1).stores({
  // 'images'라는 테이블(저장소)을 만듭니다.
  // '++id'는 자동으로 증가하는 고유 ID를 의미합니다.
  // 'data'는 이미지 파일(Blob)을 저장할 필드입니다.
  images: '++id, data'
});