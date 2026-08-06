import React from 'react';

export default function TaskCard({ task, onAccept, onComplete, showAccept }) {
  return (
    <div style={row}>
      <div>
        <div style={{ fontWeight: 700 }}>{task.title}</div>
        <div style={{ color: '#666', fontSize: 13 }}>{task.description}</div>
        <div style={{ color: '#444', marginTop: 6 }}>Budget: R{task.budget}</div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {showAccept && (
          <button style={acceptBtn} onClick={() => onAccept(task.id)}>Accept</button>
        )}
        {onComplete && (
          <button style={completeBtn} onClick={() => onComplete(task.id)}>Mark Completed</button>
        )}
      </div>
    </div>
  );
}

const row = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #f0f0f0'
};

const acceptBtn = {
  backgroundColor: '#0984e3',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
};

const completeBtn = {
  backgroundColor: '#00b894',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  cursor: 'pointer'
};
