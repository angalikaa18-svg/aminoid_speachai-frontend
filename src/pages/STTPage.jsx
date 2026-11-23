import React, { useState } from 'react';
import {
  Mic,
  Copy,
  Download,
  Check,
  FileText,
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useSTT } from '../hooks/useSTT';
import { formatTimestamp, formatDuration } from '../utils/formatDuration';

export function STTPage() {
  const { addToast } = useToast();
  const stt = useSTT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await stt.copyTranscript();
    if (ok) {
      setCopied(true);
      addToast('Transcript copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="stt-container">
      {/* Page Header Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Mic size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Speech-to-Text Transcription Studio</span>
          </div>
          <span className="badge badge-mint">Local Neural STT Engine</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Convert local audio recordings, interviews, podcasts, and calls into accurate text with precise word/segment timestamps.
          Everything runs 100% offline on your device using CTranslate2.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.3fr)', gap: 24 }}>
        {/* Left Column: Upload & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Audio Input Box */}
          <div className="studio-card">
            <h3 style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>1. Audio Source</span>
            </h3>

            <FileUpload
              selectedFile={stt.selectedFile}
              onFileSelect={stt.handleSelectFile}
              onClearFile={stt.clearFile}
              isRecording={stt.isRecording}
              recordingSeconds={stt.recordingSeconds}
              onStartRecord={stt.startRecording}
              onStopRecord={stt.stopRecording}
              disabled={stt.isTranscribing}
            />

            {/* Audio Preview Player */}
            {stt.fileAudioUrl && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                  Audio Playback Preview ({formatDuration(stt.audioDuration)})
                </div>
                <AudioPlayer
                  src={stt.fileAudioUrl}
                  waveformData={stt.waveformData}
                  downloadFilename={stt.selectedFile?.name || 'audio.wav'}
                />
              </div>
            )}
          </div>

          {/* Model & Inference Controls */}
          <div className="studio-card">
            <h3 style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>2. Transcription Options</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Spoken Language */}
              <div className="form-group">
                <label>Spoken Language</label>
                <select
                  value={stt.selectedLanguage}
                  onChange={(e) => stt.setSelectedLanguage(e.target.value)}
                  disabled={stt.isTranscribing}
                >
                  <option value="auto">Auto-Detect Language</option>
                  {stt.languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* VAD Filter */}
              <div className="form-group">
                <label>Voice Activity Detection (VAD Filter)</label>
                <select
                  value={String(stt.vadFilter)}
                  onChange={(e) => stt.setVadFilter(e.target.value === 'true')}
                  disabled={stt.isTranscribing}
                >
                  <option value="true">Enabled — Silero VAD (Recommended, faster, cuts dead air)</option>
                  <option value="false">Disabled — Process complete raw stream</option>
                </select>
              </div>

              {/* Model Selection */}
              <div className="form-group">
                <label>Speech-to-Text Model</label>
                <select
                  value={stt.selectedModel}
                  onChange={(e) => stt.setSelectedModel(e.target.value)}
                  disabled={stt.isTranscribing || stt.models.length <= 1}
                >
                  {stt.models.length === 0 ? (
                    <option value="faster-whisper-tiny">faster-whisper-tiny (72 MB, CPU)</option>
                  ) : (
                    stt.models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.size}, {m.device})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={stt.transcribe}
                disabled={!stt.selectedFile || stt.isTranscribing}
                style={{ marginTop: 8 }}
              >
                <Mic size={18} />
                <span>{stt.isTranscribing ? 'Transcribing Offline...' : 'Transcribe Audio'}</span>
              </button>

              {stt.error && (
                <ErrorMessage message={stt.error} onDismiss={() => {}} onRetry={stt.transcribe} />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transcript Output & Segments */}
        <div className="studio-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="studio-card-header">
            <div className="studio-card-title">
              <FileText size={20} style={{ color: 'var(--color-mint-green)' }} />
              <span>Transcript & Timestamps</span>
            </div>

            {stt.result && (
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopy}
                  title="Copy Transcript"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={stt.downloadSRT}
                  title="Download SRT Subtitle"
                >
                  <Download size={14} />
                  <span>SRT</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={stt.downloadJSON}
                  title="Download JSON Payload"
                >
                  <Download size={14} />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={stt.downloadTXT}
                  title="Download Raw TXT"
                >
                  <Download size={14} />
                  <span>TXT</span>
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          {stt.isTranscribing ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LoadingState message="Executing Speech-to-Text inference on local CPU..." size={36} />
            </div>
          ) : !stt.result ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EmptyState
                title="Awaiting Transcription"
                description="Upload an audio file on the left and click 'Transcribe Audio' to view full text and segment timestamps."
                icon={FileText}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Meta Badges */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge badge-mint">
                  Language: {stt.result.language_name || stt.result.language?.toUpperCase() || 'Auto'}
                </span>
                {stt.result.language_probability !== undefined && (
                  <span className="badge badge-moss">
                    Confidence: {(stt.result.language_probability * 100).toFixed(1)}%
                  </span>
                )}
                {stt.result.duration && (
                  <span className="badge badge-moss">
                    Duration: {stt.result.duration}s
                  </span>
                )}
                <span className="badge badge-moss">
                  Model: {stt.result.model || 'faster-whisper-tiny'}
                </span>
              </div>

              {/* Full Text Box */}
              <div className="result-text-preview" style={{ maxHeight: 240 }}>
                {stt.result.text || '(No speech detected in this audio recording)'}
              </div>

              {/* Segment Timestamps List */}
              <div>
                <h4 style={{ fontSize: 14, margin: '8px 0 10px', color: 'var(--color-mist-white)' }}>
                  Segment Timestamps ({stt.result.segments?.length || 0})
                </h4>
                {(!stt.result.segments || stt.result.segments.length === 0) ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No segment data returned.</p>
                ) : (
                  <div className="segments-list">
                    {stt.result.segments.map((seg, idx) => (
                      <div key={idx} className="segment-item">
                        <span className="segment-timestamp">
                          [{formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}]
                        </span>
                        <span className="segment-text">{seg.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default STTPage;
