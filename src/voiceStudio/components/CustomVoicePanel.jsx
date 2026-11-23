import React, { useState } from 'react';
import { Users, Search, Sparkles, Volume2, Save, Filter } from 'lucide-react';
import VoicePromptEditor from './VoicePromptEditor';
import GenerationStatus from './GenerationStatus';
import AudioPlayer from '../../components/AudioPlayer';
import { useCustomVoices } from '../hooks/useCustomVoices';
import { SUPPORTED_LANGUAGES } from '../types/voiceStudioTypes';
import { useToast } from '../../components/Toast';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function CustomVoicePanel({ onProfileSaved }) {
  const { addToast } = useToast();
  const [profileName, setProfileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const {
    speakers,
    filteredSpeakers,
    loading,
    selectedSpeaker,
    setSelectedSpeaker,
    text,
    setText,
    instruct,
    setInstruct,
    language,
    setLanguage,
    searchQuery,
    setSearchQuery,
    genderFilter,
    setGenderFilter,
    isGenerating,
    customResult,
    error,
    backendEndpointAvailable,
    generateVoice,
  } = useCustomVoices();

  const handleSaveProfile = async () => {
    if (!selectedSpeaker) return;
    const name = profileName.trim() || `${selectedSpeaker.name} (Custom Persona)`;
    setIsSaving(true);
    try {
      await qwenVoiceApi.saveProfile({
        name,
        type: 'custom_voice',
        language,
        model: selectedSpeaker.model || 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
        description: selectedSpeaker.description,
        audioUrl: customResult?.full_audio_url || customResult?.audio_url,
      });
      addToast(`Saved persona "${name}" to My Voices!`, 'success');
      if (onProfileSaved) onProfileSaved();
    } catch (err) {
      addToast(err.message || 'Failed to save profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1.2fr)', gap: 24 }}>
      {/* Left Column: Speaker Catalog & Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Users size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>1. Select Speaker Persona</span>
            </div>
            <span className="badge badge-mint">{filteredSpeakers.length} Available</span>
          </div>

          <p style={{ margin: '0 0 14px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Choose from predefined speaker timbres supported by Qwen3-TTS CustomVoice models. Each persona offers unique vocal characteristics.
          </p>

          {/* Search & Gender Filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search speaker or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ margin: 0, paddingLeft: 34, fontSize: 13 }}
              />
              <Search
                size={14}
                style={{ position: 'absolute', left: 10, top: 12, color: 'var(--color-text-muted)' }}
              />
            </div>

            <div style={{ width: 130 }}>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                style={{ margin: 0, fontSize: 13 }}
              >
                <option value="all">All Genders</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          {/* Speaker Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 10,
              maxHeight: 340,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {filteredSpeakers.map((spk) => {
              const isSelected = selectedSpeaker?.speaker_id === spk.speaker_id;
              return (
                <div
                  key={spk.speaker_id}
                  className={`voice-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedSpeaker(spk)}
                  style={{ padding: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                        {spk.name}
                      </span>
                      <span className={`badge ${spk.gender === 'female' ? 'badge-gender-female' : 'badge-gender-male'}`} style={{ fontSize: 10 }}>
                        {spk.gender}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {spk.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Persona Detail */}
        {selectedSpeaker && (
          <div className="studio-card" style={{ borderColor: 'var(--color-mint-green)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-mint-green)' }}>
                Active Persona: {selectedSpeaker.name}
              </span>
              <span className="badge badge-moss">{selectedSpeaker.model}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {selectedSpeaker.description}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Style Instruction, Script & Generation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Style Instruction & Language */}
        <div className="studio-card">
          <h3 style={{ fontSize: 16, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>2. Style Instruction & Language</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Style & Emotion Instruction (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Say it in a cheerful and excited tone, or with quiet whisper..."
                value={instruct}
                onChange={(e) => setInstruct(e.target.value)}
                style={{ margin: 0 }}
                disabled={isGenerating}
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setInstruct('Speak with high enthusiasm and energy.')}
                >
                  Enthusiastic
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setInstruct('Speak gently in a calm and comforting manner.')}
                >
                  Calm & Gentle
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '2px 8px' }}
                  onClick={() => setInstruct('')}
                >
                  Natural (Neutral)
                </button>
              </div>
            </div>

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

        {/* Target Script to Synthesize */}
        <div className="studio-card">
          <VoicePromptEditor
            label="3. Text to Speak"
            value={text}
            onChange={setText}
            placeholder="Enter speech script for the selected persona..."
            minHeight={100}
            disabled={isGenerating}
            presets={[
              { label: 'Introduction', text: 'Welcome to Aminoid Custom Voice studio. How may I help you today?' },
              { label: 'Dialogue', text: 'It is truly fascinating how local neural speech generation preserves human warmth.' },
            ]}
          />

          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={generateVoice}
            disabled={isGenerating || !selectedSpeaker || !text.trim()}
            style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}
          >
            <Sparkles size={18} />
            <span>{isGenerating ? 'Synthesizing Custom Voice...' : `Generate as ${selectedSpeaker?.name || 'Selected Speaker'}`}</span>
          </button>
        </div>

        {/* Output Audio Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Volume2 size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>Persona Audio Output</span>
            </div>
            {customResult && (
              <span className="badge badge-mint">{customResult.duration}s</span>
            )}
          </div>

          <GenerationStatus
            isGenerating={isGenerating}
            statusMessage={`Synthesizing speech for speaker ${selectedSpeaker?.name || ''}...`}
            error={error}
          />

          {customResult?.audio_url && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
              <AudioPlayer
                src={qwenVoiceApi.getAudioUrl(customResult.audio_url || customResult.full_audio_url)}
                downloadFilename="custom_voice.wav"
              />

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, paddingTop: 12, borderTop: '1px solid var(--color-moss-border)' }}>
                <input
                  type="text"
                  placeholder="Profile name..."
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
        </div>
      </div>
    </div>
  );
}

export default CustomVoicePanel;
