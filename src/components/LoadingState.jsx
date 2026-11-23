import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Processing on local speech engine...', size = 32 }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        gap: 14,
        color: 'var(--color-text-secondary)',
      }}
    >
      <Loader2
        size={size}
        style={{
          color: 'var(--color-mint-green)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
    </div>
  );
}

export default LoadingState;
