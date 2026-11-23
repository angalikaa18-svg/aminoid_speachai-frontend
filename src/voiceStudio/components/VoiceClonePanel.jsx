import React, { useState } from 'react';
import {
  Mic,
  Upload,
  Sparkles,
  Volume2,
  FileText,
  Save,
  CheckCircle2,
  Sliders,
  Info,
  Activity,
  Layers,
  ArrowRightLeft,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import AudioUploader from './AudioUploader';
import AudioRecorder from './AudioRecorder';
import ModelSelector from './ModelSelector';
import VoicePromptEditor from './VoicePromptEditor';
import GenerationStatus from './GenerationStatus';
import AudioPlayer from '../../components/AudioPlayer';
import { useVoiceCloning } from '../hooks/useVoiceCloning';
import { SUPPORTED_LANGUAGES } from '../types/voiceStudioTypes';
import { useToast } from '../../components/Toast';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function VoiceClonePanel({ onProfileSaved }) {
  const { addToast } = useToast();
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'record'
  const [profileName, setProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    audioFile,
    refAudioUrl,
    audioDuration,
    refTranscript,
    setRefTranscript,
    targetText,
    setTargetText,
    selectedModel,
    setSelectedModel,
    language,
    setLanguage,
    xVectorOnly,
    setXVectorOnly,
    isTranscribing,
    isCloning,
    cloneResult,
    similarityData,
    validationMeta,
    error,
    statusMessage,
    backendEndpointAvailable,
    handleSelectAudio,
    clearAudio,
    autoTranscribe,
    cloneVoice,
  } = useVoiceCloning();

  const handleSaveProfile = async () => {
    const name = profileName.trim() || `Cloned Voice (${new Date().toLocaleDateString()})`;
    setIsSaving(true);
    try {
      await qwenVoiceApi.saveProfile({
        name,
        type: 'cloned',
        language,
        model: selectedModel,
        description: `Cloned voice from ${audioFile?.name || 'recorded speech'} using Qwen3-TTS Base model.`,
        audioUrl: cloneResult?.full_audio_url || cloneResult?.audio_url,
      });
      addToast(`Saved profile "${name}" successfully!`, 'success');
      if (onProfileSaved) onProfileSaved();
    } catch (err) {
      addToast(err.message || 'Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.2fr)', gap: 24 }}>
      {/* Left Column: Reference Audio & Transcript */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Reference Audio Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Mic size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>1. Reference Audio Input</span>
            </div>
            {audioFile && (
              <span className="badge badge-mint">{audioDuration ? `${audioDuration.toFixed(1)}s` : 'Loaded'}</span>
            )}
          </div>

          <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Provide 3 to 15 seconds of clean, single-speaker reference audio. The Qwen3-TTS pipeline extracts acoustic timbre embeddings (x-vector / ICL prompt) to preserve the speaker's vocal characteristics.
          </p>

          {/* Mode Switcher: Upload vs Record */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={`btn ${inputMode === 'upload' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setInputMode('upload')}
            >
              <Upload size={14} />
              <span>Upload Audio File</span>
            </button>
            <button
              type="button"
              className={`btn ${inputMode === 'record' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setInputMode('record')}
            >
              <Mic size={14} />
              <span>Record Microphone</span>
            </button>
          </div>

          {inputMode === 'upload' ? (
            <AudioUploader
              file={audioFile}
              duration={audioDuration}
              onSelectFile={handleSelectAudio}
              onClear={clearAudio}
            />
          ) : (
            <AudioRecorder
              onRecorded={handleSelectAudio}
              onClear={clearAudio}
              recordedFile={audioFile}
            />
          )}

          {/* Audio Preview if audio selected */}
          {refAudioUrl && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-moss-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-mint-green)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Volume2 size={13} />
                  Reference Speaker Preview
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {audioFile?.name || 'Mic Recording'}
                </span>
              </div>
              <AudioPlayer src={refAudioUrl} downloadFilename="reference_speaker.wav" />
            </div>
          )}
        </div>

        {/* Reference Transcript Card */}
        <div className="studio-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="studio-card-title">
              <FileText size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>2. Reference Transcript</span>
            </div>
            {audioFile && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={autoTranscribe}
                disabled={isTranscribing}
                title="Transcribe automatically using local Faster-Whisper"
              >
                <Sparkles size={13} />
                <span>{isTranscribing ? 'Transcribing...' : 'Auto-Transcribe (Whisper)'}</span>
              </button>
            )}
          </div>

          <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Exact text spoken in the reference audio. Used for In-Context Learning (ICL) conditioning to achieve highest timbre similarity.
          </p>

          <textarea
            className="tts-textarea"
            style={{ minHeight: 90, margin: 0 }}
            placeholder={
              xVectorOnly
                ? 'Reference transcript not required in x-vector only mode.'
                : 'Enter what is spoken in the reference audio, or click Auto-Transcribe...'
            }
            value={refTranscript}
            onChange={(e) => setRefTranscript(e.target.value)}
            disabled={xVectorOnly || isCloning}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              id="xvec-checkbox"
              checked={xVectorOnly}
              onChange={(e) => setXVectorOnly(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-mint-green)', margin: 0 }}
            />
            <label htmlFor="xvec-checkbox" style={{ fontSize: 12, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <strong>Use speaker embedding only (x-vector only)</strong> — allows cloning without transcript, but ICL provides higher fidelity.
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Model Selection, Target Script & Generation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Model & Language Configuration */}
        <div className="studio-card">
          <h3 style={{ fontSize: 16, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>3. Clone Configuration & Model</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={setSelectedModel}
              targetType="base"
            />

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Synthesis Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ margin: 0 }}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Target Script to Synthesize */}
        <div className="studio-card">
          <VoicePromptEditor
            label="4. Target Script to Synthesize"
            value={targetText}
            onChange={setTargetText}
            placeholder="Enter the text you want the cloned voice to speak..."
            minHeight={90}
            disabled={isCloning}
            presets={[
              { label: 'Welcome', text: 'Hello, welcome to AminoidSpeech. How can I assist you today?' },
              { label: 'Greeting', text: 'Good morning! It is a pleasure to connect with you on this platform.' },
              { label: 'Assistant', text: 'Your voice clone model has been configured with local privacy guarantees.' },
            ]}
          />

          {/* Clone Action Button */}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={cloneVoice}
            disabled={isCloning || !audioFile || (!xVectorOnly && !refTranscript.trim()) || !targetText.trim()}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
          >
            <Sparkles size={18} />
            <span>{isCloning ? 'Generating Cloned Speech...' : 'Clone Voice & Synthesize'}</span>
          </button>
        </div>

        {/* Generation Status & Result */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Volume2 size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>Cloned Audio Output</span>
            </div>
            {cloneResult && (
              <span className="badge badge-mint">{cloneResult.duration}s</span>
            )}
          </div>

          <GenerationStatus
            isGenerating={isCloning}
            statusMessage={statusMessage}
            error={error}
          />

          {/* A/B Comparison and Objective Similarity Verification */}
          {cloneResult?.audio_url && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
              {/* Objective Similarity Badge */}
              {cloneResult.similarity && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(101, 230, 165, 0.08)',
                  border: '1px solid var(--color-mint-green)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Activity size={18} style={{ color: 'var(--color-mint-green)' }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>
                        Speaker Similarity: {cloneResult.similarity.similarity_percentage ?? cloneResult.similarity.similarity_score}%
                      </span>
                    </div>
                    <span className="badge badge-mint" style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.04em' }}>
                      {cloneResult.similarity.rating || 'High Fidelity'}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {cloneResult.similarity.description}
                  </p>

                  {/* Quality & Preprocessing Metrics */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                      24kHz Peak Normalized
                    </span>
                    {cloneResult.validation && (
                      <>
                        <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                          RMS: {(cloneResult.validation.rms_energy * 100).toFixed(1)}%
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                          Peak: {(cloneResult.validation.peak_amplitude).toFixed(2)}
                        </span>
                        <span className="badge badge-secondary" style={{ fontSize: 11, color: cloneResult.validation.is_clipping ? '#f87171' : 'inherit' }}>
                          Clipping: {cloneResult.validation.is_clipping ? 'Yes' : 'Clean'}
                        </span>
                      </>
                    )}
                    <span className="badge badge-secondary" style={{ fontSize: 11 }}>
                      Mode: {cloneResult.mode === 'icl' ? 'In-Context Learning' : 'Speaker Embedding'}
                    </span>
                  </div>
                </div>
              )}

              {/* A/B Comparison Playback Deck */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-mint-green)' }}>
                  <ArrowRightLeft size={16} />
                  <span>A/B Audio Comparison (Reference vs Cloned Output)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {/* Speaker A: Reference Audio */}
                  {refAudioUrl && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(25, 43, 38, 0.6)',
                      border: '1px solid var(--color-moss-border)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          Speaker A: Reference Audio
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          Original Sample ({audioDuration ? `${audioDuration.toFixed(1)}s` : ''})
                        </span>
                      </div>
                      <AudioPlayer src={refAudioUrl} downloadFilename="reference_sample.wav" />
                    </div>
                  )}

                  {/* Speaker B: Generated Cloned Speech */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(27, 48, 41, 0.8)',
                    border: '1px solid var(--color-mint-green)',
                    boxShadow: 'var(--glow-secondary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-mint-green)' }}>
                        Speaker B: Generated Cloned Voice
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-mint-green)' }}>
                        Synthesized ({cloneResult.duration}s)
                      </span>
                    </div>
                    <AudioPlayer
                      src={qwenVoiceApi.getAudioUrl(cloneResult.audio_url || cloneResult.full_audio_url)}
                      downloadFilename="cloned_speech.wav"
                    />
                  </div>
                </div>
              </div>

              {/* Save Profile Option */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4, paddingTop: 14, borderTop: '1px solid var(--color-moss-border)' }}>
                <input
                  type="text"
                  placeholder="Voice profile name (e.g. My Custom Voice)..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ margin: 0, flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  <Save size={14} />
                  <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </div>
            </div>
          )}

          {!isCloning && !cloneResult && !error && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Select reference audio and click 'Clone Voice & Synthesize' to evaluate voice reproduction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceClonePanel;
