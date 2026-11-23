import React, { useRef } from 'react';
import { Upload, Music, X, CheckCircle2 } from 'lucide-react';
import { formatBytes } from '../utils/audioUtils';
import { AUDIO_CONSTRAINTS } from '../types/voiceStudioTypes';

export function AudioUploader({ file, duration, onSelectFile, onClear }) {
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onSelectFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!file ? (
        <div
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ padding: '28px 20px', cursor: 'pointer' }}
        >
          <Upload size={32} style={{ color: 'var(--color-mint-green)', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-mist-white)' }}>
            Click or drag reference audio here
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Supports {AUDIO_CONSTRAINTS.supportedFormats.join(', ').toUpperCase()} • Max {AUDIO_CONSTRAINTS.maxSizeMB} MB
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-mint-green)', marginTop: 6 }}>
            Recommended: 3 to 20 seconds of clear, noise-free speech
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
        </div>
      ) : (
        <div
          style={{
            padding: 14,
            backgroundColor: 'var(--color-forest-black)',
            border: '1px solid var(--color-mint-green)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <Music size={22} style={{ color: 'var(--color-mint-green)', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                {formatBytes(file.size)} • {duration ? `${duration.toFixed(1)}s duration` : 'Audio loaded'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
            title="Remove reference audio"
            style={{ padding: 6 }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AudioUploader;
