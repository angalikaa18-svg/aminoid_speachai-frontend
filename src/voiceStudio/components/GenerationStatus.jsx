import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, RotateCw, Cpu } from 'lucide-react';

export function GenerationStatus({
  isGenerating = false,
  statusMessage = '',
  error = null,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer = null;
    if (isGenerating) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating]);

  if (!isGenerating && !error && !statusMessage) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Loading State with Live Timer */}
      {isGenerating && (
        <div
          style={{
            padding: 14,
            backgroundColor: 'var(--color-forest-black)',
            border: '1px solid var(--color-mint-green)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <RotateCw size={18} className="spin-slow" style={{ color: 'var(--color-mint-green)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mint-green)' }}>
                Processing Request
              </div>
              <span
                className="badge badge-mint"
                style={{ fontSize: 11, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}
              >
                {elapsed}s elapsed
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>
              {statusMessage || 'Synthesizing voice with local neural engine...'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={12} style={{ color: 'var(--color-text-muted)' }} />
              <span>Offline neural synthesis on local CPU. Autoregressive generation takes 1–3 minutes.</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isGenerating && (
        <div
          style={{
            padding: 12,
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.5 }}>
            {error}
          </div>
        </div>
      )}

      {/* Status Success */}
      {!isGenerating && !error && statusMessage && (
        <div
          style={{
            padding: 10,
            backgroundColor: 'var(--color-success-bg)',
            border: '1px solid var(--color-success)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
          <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
            {statusMessage}
          </span>
        </div>
      )}
    </div>
  );
}

export default GenerationStatus;
