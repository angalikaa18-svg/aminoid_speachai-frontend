import React from 'react';
import { FileText, Clipboard, RotateCcw } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function VoicePromptEditor({
  label = 'Target Script to Synthesize',
  value,
  onChange,
  placeholder = 'Enter text to synthesize...',
  maxLength = 5000,
  minHeight = 110,
  presets = [],
  disabled = false,
}) {
  const { addToast } = useToast();

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(value ? `${value} ${text}` : text);
        addToast('Text pasted from clipboard!', 'info');
      }
    } catch {
      addToast('Cannot access clipboard.', 'error');
    }
  };

  const handleClear = () => {
    onChange('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FileText size={15} style={{ color: 'var(--color-mint-green)' }} />
          <span>{label}</span>
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handlePaste}
            disabled={disabled}
            style={{ fontSize: 11, padding: '3px 8px' }}
          >
            <Clipboard size={12} />
            <span>Paste</span>
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            disabled={disabled || !value}
            style={{ fontSize: 11, padding: '3px 8px' }}
          >
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <textarea
        className="tts-textarea"
        style={{ minHeight, margin: 0 }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {presets.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => onChange(p.text)}
                disabled={disabled}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <span className="char-counter" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {value.length} / {maxLength} chars
        </span>
      </div>
    </div>
  );
}

export default VoicePromptEditor;
