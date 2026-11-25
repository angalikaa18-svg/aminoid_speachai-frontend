import React, { useRef, useState } from 'react';
import { UploadCloud, Mic, Square, Trash2, Music } from 'lucide-react';
import { formatBytes, SUPPORTED_AUDIO_EXTENSIONS } from '../utils/validators';

export function FileUpload({
  selectedFile,
  onFileSelect,
  onClearFile,
  isRecording,
  recordingSeconds,
  onStartRecord,
  onStopRecord,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_AUDIO_EXTENSIONS.join(',')}
        style={{ display: 'none' }}
        onChange={handleInputChange}
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          className={`upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && !isRecording && fileInputRef.current?.click()}
        >
          <div className="dropzone-icon">
            <UploadCloud size={24} />
          </div>
          <div>
            <div className="dropzone-title">Click to browse or drag and drop audio</div>
            <div className="dropzone-sub">
              Supported formats: WAV, MP3, FLAC, OGG, M4A, WebM (Max 100MB)
            </div>
          </div>

          {/* Record with Mic option */}
          <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
            {!isRecording ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onStartRecord}
                disabled={disabled}
              >
                <Mic size={14} style={{ color: 'var(--color-mint-green)' }} />
                <span>Record with Microphone</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-danger btn-sm glow-pulse"
                onClick={onStopRecord}
              >
                <Square size={14} />
                <span>Stop Recording ({recordingSeconds}s)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="selected-file-info">
          <div className="file-meta">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-small)',
                background: 'rgba(75, 166, 154, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
              }}
            >
              <Music size={20} />
            </div>
            <div>
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">{formatBytes(selectedFile.size)} • Ready for local transcription</div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClearFile}
            title="Remove File"
            disabled={disabled}
          >
            <Trash2 size={16} style={{ color: 'var(--color-danger)' }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
