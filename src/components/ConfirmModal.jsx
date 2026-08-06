import React from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm' }) {
  if (!open) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#444' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button style={btnCancel} onClick={onCancel}>Cancel</button>
          <button style={btnConfirm} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const modal = {
  width: 420,
  background: '#fff',
  padding: 20,
  borderRadius: 10,
  boxShadow: '0 10px 30px rgba(0,0,0,0.12)'
};

const btnConfirm = {
  backgroundColor: '#00b894',
  color: '#fff',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 6,
  cursor: 'pointer'
};

const btnCancel = {
  backgroundColor: '#e0e0e0',
  color: '#111',
  border: 'none',
  padding: '8px 14px',
  borderRadius: 6,
  cursor: 'pointer'
};
