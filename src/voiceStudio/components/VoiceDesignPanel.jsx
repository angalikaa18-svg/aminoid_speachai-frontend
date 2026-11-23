import React, { useState } from 'react';
import { Sparkles, Sliders, Volume2, Save, Wand2 } from 'lucide-react';
import ModelSelector from './ModelSelector';
import VoicePromptEditor from './VoicePromptEditor';
import GenerationStatus from './GenerationStatus';
import AudioPlayer from '../../components/AudioPlayer';
import { useVoiceDesign } from '../hooks/useVoiceDesign';
import { SUPPORTED_LANGUAGES } from '../types/voiceStudioTypes';
import { useToast } from '../../components/Toast';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function VoiceDesignPanel({ onProfileSaved }) {
  const { addToast } = useToast();
  const [profileName, setProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    description,
    setDescription,
    text,
    setText,
    selectedModel,
    setSelectedModel,
    language,
    setLanguage,
    isGenerating,
    designResult,
    error,
    backendEndpointAvailable,
    generateVoice,
  } = useVoiceDesign();

  const handleSaveProfile = async () => {
    const name = profileName.trim() || `Designed Voice (${new Date().toLocaleDateString()})`;
    setIsSaving(true);
    try {
      await qwenVoiceApi.saveProfile({
        name,
        type: 'designed',
        language,
        model: selectedModel,
        description,
        audioUrl: designResult?.full_audio_url || designResult?.audio_url,
      });
      addToast(`Saved designed voice "${name}" successfully!`, 'success');
      if (onProfileSaved) onProfileSaved();
    } catch (err) {
      addToast(err.message || 'Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.2fr)', gap: 24 }}>
      {/* Left Column: Voice Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Wand2 size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>1. Voice Description Prompt</span>
            </div>
            <span className="badge badge-mint">Qwen3 VoiceDesign</span>
          </div>

          <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Describe the acoustic timbre, pitch, gender, age, cadence, emotion, and accent in natural language.
            The Qwen3-TTS VoiceDesign model generates a synthetic voice matching your prompt.
          </p>

          <textarea
            className="tts-textarea"
            style={{ minHeight: 140, margin: 0 }}
            placeholder="e.g. Create a warm, natural Indian English female voice suitable for a professional AI receptionist. Friendly, confident, clear pronunciation, medium pitch..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isGenerating}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span className="char-counter" style={{ fontSize: 11 }}>
              {description.length} characters
            </span>

            {/* Quick Inspiration Presets */}
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() =>
                  setDescription(
                    'Warm, empathetic female healthcare assistant voice with calm pacing and clear articulation.'
                  )
                }
              >
                Healthcare
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() =>
                  setDescription(
                    'Authoritative, crisp male news anchor voice with baritone resonance and professional broadcast cadence.'
                  )
                }
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Synthesis Configuration */}
        <div className="studio-card">
          <h3 style={{ fontSize: 16, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>2. Model & Language</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={setSelectedModel}
              targetType="voice_design"
            />

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Language</label>
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
      </div>

      {/* Right Column: Generation Script & Output */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="studio-card">
          <VoicePromptEditor
            label="3. Sample Text to Synthesize"
            value={text}
            onChange={setText}
            placeholder="Enter text to speak with the designed voice..."
            minHeight={110}
            disabled={isGenerating}
            presets={[
              { label: 'Receptionist', text: 'Hello! Thank you for calling Aminoid AI Studio. How may I direct your call today?' },
              { label: 'Support', text: 'Thank you for your patience. Your inquiry has been routed to our technical support team.' },
              { label: 'Notification', text: 'Your meeting has been scheduled for tomorrow morning at 10:00 AM.' },
            ]}
          />

          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={generateVoice}
            disabled={isGenerating || !description.trim() || !text.trim()}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
          >
            <Sparkles size={18} />
            <span>{isGenerating ? 'Synthesizing Designed Voice...' : 'Generate Designed Voice'}</span>
          </button>
        </div>

        {/* Output Audio Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Volume2 size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>Designed Voice Output</span>
            </div>
            {designResult && (
              <span className="badge badge-mint">{designResult.duration}s</span>
            )}
          </div>

          <GenerationStatus
            isGenerating={isGenerating}
            statusMessage="Synthesizing audio using Qwen3-TTS VoiceDesign model..."
            error={error}
          />

          {designResult?.audio_url && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <AudioPlayer
                src={qwenVoiceApi.getAudioUrl(designResult.audio_url || designResult.full_audio_url)}
                downloadFilename="designed_voice.wav"
              />

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, paddingTop: 12, borderTop: '1px solid var(--color-moss-border)' }}>
                <input
                  type="text"
                  placeholder="Voice profile name (e.g. Executive Receptionist)..."
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
                  <span>{isSaving ? 'Saving...' : 'Save to My Voices'}</span>
                </button>
              </div>
            </div>
          )}

          {!isGenerating && !designResult && !error && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
              Enter a voice description above and click 'Generate Designed Voice' to synthesize audio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceDesignPanel;
