import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = 'var(--color-deep-green)';
          let border = 'var(--color-moss-green)';
          let Icon = Info;
          let iconColor = 'var(--color-mint-green)';

          if (toast.type === 'success') {
            border = 'var(--color-mint-green)';
            Icon = CheckCircle2;
            iconColor = 'var(--color-mint-green)';
          } else if (toast.type === 'error') {
            border = 'var(--color-danger)';
            Icon = AlertCircle;
            iconColor = 'var(--color-danger)';
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                color: 'var(--color-mist-white)',
                fontSize: 14,
                fontWeight: 500,
                minWidth: 260,
                maxWidth: 420,
                animation: 'slideIn 0.2s ease',
              }}
            >
              <Icon size={18} style={{ color: iconColor, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeToast(toast.id)}
                style={{ padding: 2, color: 'var(--color-text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { addToast: () => {} };
  }
  return context;
}

export default ToastProvider;
