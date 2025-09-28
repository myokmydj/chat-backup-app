// 파일: src/components/Dashboard.js (수정 완료)

import React from 'react';
import ConversationCard from './ConversationCard';

// onContextMenu prop을 추가로 받도록 수정
const Dashboard = ({ logs, onSelectLog, onOpenAddLogModal, bgColor, onContextMenu }) => {
  const dashboardStyle = {
    backgroundColor: bgColor || '#1a1a1a',
  };

  return (
    <main className="dashboard" style={dashboardStyle}>
      <div className="dashboard-grid">
        {logs.map((log) => (
          <ConversationCard
            key={log.id}
            log={log}
            onSelect={onSelectLog}
            // ▼▼▼ NEW ▼▼▼: 우클릭 이벤트를 부모에게 전달
            onContextMenu={(e) => onContextMenu(e, log.id)}
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