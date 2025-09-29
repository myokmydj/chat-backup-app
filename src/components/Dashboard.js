// 파일: src/components/Dashboard.js (수정 완료)

import React, { useState } from 'react';
import ConversationCard from './ConversationCard';

// onContextMenu, onReorder prop을 추가로 받도록 수정
const Dashboard = ({ logs, onSelectLog, onOpenAddLogModal, bgColor, onContextMenu, onReorder }) => {
  const [draggedItemId, setDraggedItemId] = useState(null);
  
  const dashboardStyle = {
    backgroundColor: bgColor || '#1a1a1a',
  };

  // ▼▼▼ NEW: 드래그 앤 드롭 이벤트 핸들러들 ▼▼▼
  const handleDragStart = (e, id) => {
    setDraggedItemId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // 필수: drop 이벤트를 허용하기 위함
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (draggedItemId && draggedItemId !== targetId) {
      onReorder(draggedItemId, targetId);
    }
    setDraggedItemId(null);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
  };

  return (
    <main className="dashboard" style={dashboardStyle}>
      <div className="dashboard-grid">
        {logs.map((log) => (
          <ConversationCard
            key={log.id}
            log={log}
            onSelect={onSelectLog}
            onContextMenu={(e) => onContextMenu(e, log.id)}
            // ▼▼▼ NEW: 드래그 앤 드롭 관련 props와 상태 전달 ▼▼▼
            draggable="true"
            onDragStart={(e) => handleDragStart(e, log.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, log.id)}
            onDragEnd={handleDragEnd}
            isDragging={draggedItemId === log.id}
          />
        ))}
        <div className="add-log-card" onClick={onOpenAddLogModal}>
          +
        </div>
      </div>
    </main>
  );
};

export default Dashboard;