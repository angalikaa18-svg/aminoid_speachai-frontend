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
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'rgba(12, 21, 20, 0.4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-moss-border)',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'rgba(65, 107, 88, 0.2)',
          color: 'var(--color-mint-green)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={26} />
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
        {title}
      </div>

      <p style={{ fontSize: 13, maxWidth: 360, color: 'var(--color-text-secondary)', margin: 0 }}>
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
