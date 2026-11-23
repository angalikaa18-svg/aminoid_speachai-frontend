import React from 'react';

export function StatusBadge({ status, text, size = 'md' }) {
  let badgeClass = 'badge-moss';
  let dotClass = '';

  const s = (status || '').toLowerCase();
  if (s === 'connected' || s === 'healthy' || s === 'ready' || s === 'active') {
    badgeClass = 'badge-mint';
    dotClass = 'status-dot connected';
  } else if (s === 'connecting' || s === 'loading') {
    badgeClass = 'badge-warning';
    dotClass = 'status-dot connecting';
  } else if (s === 'disconnected' || s === 'error' || s === 'failed') {
    badgeClass = 'badge-danger';
    dotClass = 'status-dot disconnected';
  }

  return (
    <span className={`badge ${badgeClass} ${size === 'sm' ? 'btn-sm' : ''}`}>
      {dotClass && <span className={dotClass} style={{ width: 6, height: 6 }} />}
      {text || status}
    </span>
  );
}

export default StatusBadge;
