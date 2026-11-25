import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No Data Available',
  description = 'No records found from local speech backend.',
  icon: Icon = Inbox,
  actionText = null,
  onAction = null,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '44px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-medium)',
        border: '1.5px dashed var(--color-border)',
        gap: 12,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'rgba(75, 166, 154, 0.12)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={26} />
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
        {title}
      </div>

      <p style={{ fontSize: 13, maxWidth: 380, color: 'var(--color-text-secondary)', margin: 0 }}>
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onAction}
          style={{ marginTop: 8 }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
