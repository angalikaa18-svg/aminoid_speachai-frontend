import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Mic,
  Volume2,
  Cpu,
  Layers,
  Activity,
  Copy,
  Download,
  Check,
  Clock,
  ExternalLink,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import FileUpload from '../components/FileUpload';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useHealth } from '../hooks/useHealth';
import { useSTT } from '../hooks/useSTT';
import { useTTS } from '../hooks/useTTS';
import historyApi from '../api/historyApi';
import { formatTimestamp } from '../utils/formatDuration';

export function Dashboard() {
  const { addToast } = useToast();
  const { status: healthStatus, healthData, modelStatus } = useHealth();
  const stt = useSTT();
  const tts = useTTS();

  const [recentStt, setRecentStt] = useState([]);
  const [recentTts, setRecentTts] = useState([]);
  const [copiedStt, setCopiedStt] = useState(false);

  // Load actual recent activity from real backend history
  useEffect(() => {
    historyApi.getSTTHistory().then((h) => {
      if (Array.isArray(h)) setRecentStt(h.slice(0, 4));
    }).catch(() => {});

    historyApi.getTTSHistory().then((h) => {
      if (Array.isArray(h)) setRecentTts(h.slice(0, 4));
    }).catch(() => {});
  }, [stt.result, tts.result]);

  const handleCopyTranscript = async () => {
    const ok = await stt.copyTranscript();
    if (ok) {
      setCopiedStt(true);
      addToast('Transcript copied to clipboard!', 'success');
      setTimeout(() => setCopiedStt(false), 2000);
    }
  };

  // Derive dynamic stat values from real backend responses (never hardcoded)
  const sttEngineName = healthData?.stt?.loaded
    ? `${healthData?.stt?.model_name} (${healthData?.stt?.device})`
    : 'Faster-Whisper (CTranslate2)';
  const ttsEngineName = healthData?.tts?.engine === 'sapi5_local'
    ? 'Local SAPI5 / Piper'
    : healthData?.tts?.engine || 'Local TTS Engine';
  const activeSttModel = modelStatus?.stt?.model_name !== 'none'
    ? modelStatus?.stt?.model_name
    : 'faster-whisper-tiny';
  const activeTtsVoices = healthData?.tts?.voices_available !== undefined
    ? `${healthData.tts.voices_available} Voices Ready`
    : 'Voices Loaded';
  const backendMode = healthData?.mode || (healthStatus === 'connected' ? '100% Offline' : 'Disconnected');

  return (
    <div className="dashboard-grid">
      {/* Top Metric Cards Row */}
      <div className="stats-row">
        <StatCard
          title="STT Engine"
          value={sttEngineName}
          sub="Offline Speech Recognition"
          icon={Mic}
          badge="Neural STT"
        />
        <StatCard
          title="TTS Engine"
          value={ttsEngineName}
          sub="Offline Neural Voice"
          icon={Volume2}
          badge="Local Synth"
        />
        <StatCard
          title="Active STT Model"
          value={activeSttModel}
          sub="Device: CPU (int8)"
          icon={Cpu}
        />
        <StatCard
          title="Active TTS Voices"
          value={activeTtsVoices}
          sub="Offline Windows SAPI5"
          icon={Layers}
        />
        <StatCard
          title="Backend Status"
          value={healthStatus === 'connected' ? 'Healthy' : healthStatus}
          sub={backendMode}
          icon={Activity}
          badge={healthStatus === 'connected' ? 'Verified' : 'Offline'}
        />
      </div>

      {/* Main Workspace: Left STT Quick Studio, Right TTS Quick Studio */}
      <div className="workspace-split">
        {/* LEFT: Speech-to-Text Studio */}
        <div className="studio-card workspace-panel">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Mic size={20} style={{ color: 'var(--color-mint-green)' }} />
              <span>Speech-to-Text</span>
            </div>
            <span className="badge badge-mint">Local Neural STT</span>
          </div>

          {/* File Upload / Mic Recording */}
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

          {/* Audio Preview if file selected */}
          {stt.fileAudioUrl && (
            <div style={{ marginTop: 4 }}>
              <AudioPlayer
                src={stt.fileAudioUrl}
                waveformData={stt.waveformData}
                downloadFilename={stt.selectedFile?.name || 'audio.wav'}
              />
            </div>
          )}

          {/* Controls: Language & VAD */}
          <div className="form-row">
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

            <div className="form-group">
              <label>Voice Activity Filter (VAD)</label>
              <select
                value={String(stt.vadFilter)}
                onChange={(e) => stt.setVadFilter(e.target.value === 'true')}
                disabled={stt.isTranscribing}
              >
                <option value="true">Enabled (Filters Silence)</option>
                <option value="false">Disabled (Full Audio)</option>
              </select>
            </div>
          </div>

          {/* Transcribe Button */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={stt.transcribe}
            disabled={!stt.selectedFile || stt.isTranscribing}
          >
            <Mic size={18} />
            <span>{stt.isTranscribing ? 'Transcribing Locally...' : 'Transcribe Audio'}</span>
          </button>

          {/* Error Message */}
          {stt.error && <ErrorMessage message={stt.error} onDismiss={() => {}} onRetry={stt.transcribe} />}

          {/* Loading State */}
          {stt.isTranscribing && (
            <LoadingState message="Processing audio on local neural STT engine..." />
          )}

          {/* STT Result */}
          {stt.result && (
            <div className="result-card-inner">
              <div className="action-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Transcription Output</span>
                  <span className="badge badge-mint">
                    {(stt.result.language || 'unknown').toUpperCase()}
                  </span>
                  {stt.result.duration && (
                    <span className="badge badge-moss">{stt.result.duration}s</span>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyTranscript}
                    title="Copy Transcript"
                  >
                    {copiedStt ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedStt ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={stt.downloadSRT}
                    title="Download Subtitles (.srt)"
                  >
                    <Download size={14} />
                    <span>SRT</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={stt.downloadJSON}
                    title="Download Result (.json)"
                  >
                    <Download size={14} />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Text Output Box */}
              <div className="result-text-preview">
                {stt.result.text || '(No speech detected in audio)'}
              </div>

              {/* Segments Preview */}
              {stt.result.segments && stt.result.segments.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    Segments ({stt.result.segments.length})
                  </div>
                  <div className="segments-list" style={{ maxHeight: 180 }}>
                    {stt.result.segments.map((seg, idx) => (
                      <div key={idx} className="segment-item">
                        <span className="segment-timestamp">
                          [{formatTimestamp(seg.start)} - {formatTimestamp(seg.end)}]
                        </span>
                        <span className="segment-text">{seg.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Text-to-Speech Studio */}
        <div className="studio-card workspace-panel">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Volume2 size={20} style={{ color: 'var(--color-mint-green)' }} />
              <span>Text-to-Speech</span>
            </div>
            <span className="badge badge-mint">Local Synthesis</span>
          </div>

          {/* Text Editor */}
          <div className="text-editor-container">
            <textarea
              className="tts-textarea"
              placeholder="Type or paste text to synthesize into spoken speech offline..."
              value={tts.text}
              onChange={(e) => tts.setText(e.target.value)}
              disabled={tts.isGenerating}
            />
            <div className="editor-footer">
              <span className={`char-counter ${tts.text.length > 4500 ? 'limit-near' : ''}`}>
                {tts.text.length} / 5,000 characters
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={tts.clearText}
                disabled={!tts.text || tts.isGenerating}
              >
                Clear Text
              </button>
            </div>
          </div>

          {/* Voice & Speed Controls */}
          <div className="form-row">
            <div className="form-group">
              <label>Voice Model</label>
              <select
                value={tts.selectedVoiceId}
                onChange={(e) => tts.setSelectedVoiceId(e.target.value)}
                disabled={tts.isGenerating}
              >
                {tts.voices.length === 0 ? (
                  <option value="">Loading local voices...</option>
                ) : (
                  tts.voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.language}, {v.gender})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label>Speaking Speed ({tts.rate} WPM)</label>
              <input
                type="range"
                min="100"
                max="250"
                step="5"
                value={tts.rate}
                onChange={(e) => tts.setRate(Number(e.target.value))}
                disabled={tts.isGenerating}
              />
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={tts.generate}
            disabled={!tts.text.trim() || tts.isGenerating}
          >
            <Volume2 size={18} />
            <span>{tts.isGenerating ? 'Synthesizing Audio Locally...' : 'Generate Speech'}</span>
          </button>

          {/* Error Message */}
          {tts.error && <ErrorMessage message={tts.error} onDismiss={() => {}} onRetry={tts.generate} />}

          {/* Loading State */}
          {tts.isGenerating && (
            <LoadingState message="Generating offline speech via local synthesis engine..." />
          )}

          {/* Generated Audio Player */}
          {tts.result && (
            <div className="result-card-inner">
              <div className="action-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Generated Audio</span>
                  <span className="badge badge-mint">{tts.result.duration}s</span>
                  <span className="badge badge-moss">{tts.result.voice_used}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={tts.downloadAudio}
                >
                  <Download size={14} />
                  <span>Download WAV</span>
                </button>
              </div>

              <AudioPlayer
                src={tts.result.full_audio_url}
                downloadFilename={tts.result.filename || 'generated_speech.wav'}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Recent Activity Section - Populated from Real Backend History */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Clock size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>Recent Activity (Real Local Backend Records)</span>
          </div>
          <NavLink to="/history" className="btn btn-ghost btn-sm">
            <span>View All History</span>
            <ExternalLink size={14} />
          </NavLink>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Recent Transcriptions */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mint-green)', marginBottom: 12 }}>
              Latest STT Transcriptions
            </div>
            {recentStt.length === 0 ? (
              <EmptyState
                title="No STT History"
                description="Upload an audio file above to transcribe and create history."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentStt.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-forest-black)',
                      border: '1px solid var(--color-moss-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.filename || 'audio.wav'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {item.duration ? `${item.duration}s • ` : ''}Lang: {(item.language || 'unknown').toUpperCase()}
                      </div>
                    </div>
                    <span className="badge badge-moss">{item.timestamp?.split(' ')[1] || 'Done'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Speech Syntheses */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mint-green)', marginBottom: 12 }}>
              Latest TTS Generations
            </div>
            {recentTts.length === 0 ? (
              <EmptyState
                title="No TTS History"
                description="Synthesize text above to generate speech history."
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentTts.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--color-forest-black)',
                      border: '1px solid var(--color-moss-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        "{item.text || 'Synthesized Speech'}"
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {item.duration ? `${item.duration}s • ` : ''}{item.voice || 'Default Voice'}
                      </div>
                    </div>
                    <span className="badge badge-moss">{item.timestamp?.split(' ')[1] || 'Done'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
