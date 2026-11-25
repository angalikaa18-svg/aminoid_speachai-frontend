import React from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';

export function ErrorMessage({ message, onDismiss, onRetry }) {
  if (!message) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: 'var(--color-danger-bg)',
        border: '1px solid rgba(217, 83, 79, 0.35)',
        borderRadius: 'var(--radius-small)',
        color: '#a82a27',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
        <AlertCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
        <span>{message}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {onRetry && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRetry}
            style={{ padding: '3px 8px', fontSize: 11 }}
          >
            <RotateCcw size={12} />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onDismiss}
            style={{ padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorMessage;
