import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Volume2,
  Download,
  Play,
  Sparkles,
  History,
  Sliders,
  Users,
  CheckSquare,
  Square,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useTTS } from '../hooks/useTTS';
import ttsApi from '../api/ttsApi';
import { downloadUrl } from '../utils/downloadFile';
import { DEFAULT_ENGLISH_TEST_SCRIPT } from '../utils/testScripts';

const DEFAULT_TEST_TEXT = DEFAULT_ENGLISH_TEST_SCRIPT;

export function TTSPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'multi' ? 'multi' : 'single';
  const preselectedVoiceId = searchParams.get('voice');

  const [studioMode, setStudioMode] = useState(initialMode);
  const { addToast } = useToast();

  // Single Voice Studio Hook
  const tts = useTTS();
  const [activeHistoryAudio, setActiveHistoryAudio] = useState(null);

  // Multi-Voice Studio States
  const [multiText, setMultiText] = useState(DEFAULT_TEST_TEXT);
  const [selectedVoiceIds, setSelectedVoiceIds] = useState([]);
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female', 'unknown'
  const [voiceSearch, setVoiceSearch] = useState('');
  const [multiRate, setMultiRate] = useState(175);
  const [multiVolume, setMultiVolume] = useState(1.0);
  const [multiPitch, setMultiPitch] = useState(50);

  // Comparison generation & playback
  const [isMultiGenerating, setIsMultiGenerating] = useState(false);
  const [multiProgress, setMultiProgress] = useState({ current: 0, total: 0 });
  const [comparisonResults, setComparisonResults] = useState({}); // { [voiceId]: { status, result, error } }
  const [activePlayingVoiceId, setActivePlayingVoiceId] = useState(null);

  // Sync mode changes with URL
  const switchStudioMode = (mode) => {
    setStudioMode(mode);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === 'multi') {
        next.set('mode', 'multi');
      } else {
        next.delete('mode');
      }
      return next;
    });
  };

  // Pre-select voices if provided in query or on initial voice load
  useEffect(() => {
    if (tts.voices.length > 0 && selectedVoiceIds.length === 0) {
      if (preselectedVoiceId && tts.voices.some((v) => v.id === preselectedVoiceId)) {
        setSelectedVoiceIds([preselectedVoiceId]);
      } else {
        // By default select the first male voice and first female voice for immediate comparison
        const maleVoice = tts.voices.find((v) => (v.gender || '').toLowerCase() === 'male');
        const femaleVoice = tts.voices.find((v) => (v.gender || '').toLowerCase() === 'female');
        const initial = [];
        if (maleVoice) initial.push(maleVoice.id);
        if (femaleVoice && femaleVoice.id !== maleVoice?.id) initial.push(femaleVoice.id);
        if (initial.length === 0) initial.push(tts.voices[0].id);
        setSelectedVoiceIds(initial);
      }
    }
  }, [tts.voices, preselectedVoiceId]);

  // Voice filtering for Multi-Voice Studio
  const filteredVoices = tts.voices.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.language?.toLowerCase().includes(voiceSearch.toLowerCase()) ||
      v.engine?.toLowerCase().includes(voiceSearch.toLowerCase());

    const g = (v.gender || '').toLowerCase();
    let matchesGender = true;
    if (genderFilter === 'male') {
      matchesGender = g === 'male';
    } else if (genderFilter === 'female') {
      matchesGender = g === 'female';
    } else if (genderFilter === 'unknown') {
      matchesGender = g !== 'male' && g !== 'female';
    }

    return matchesSearch && matchesGender;
  });

  // Dynamic voice counts
  const totalVoiceCount = tts.voices.length;
  const maleVoiceCount = tts.voices.filter((v) => (v.gender || '').toLowerCase() === 'male').length;
  const femaleVoiceCount = tts.voices.filter((v) => (v.gender || '').toLowerCase() === 'female').length;
  const unknownVoiceCount = tts.voices.filter(
    (v) => (v.gender || '').toLowerCase() !== 'male' && (v.gender || '').toLowerCase() !== 'female'
  ).length;

  // Multi-voice selection helpers
  const toggleVoiceSelection = (voiceId) => {
    setSelectedVoiceIds((prev) =>
      prev.includes(voiceId) ? prev.filter((id) => id !== voiceId) : [...prev, voiceId]
    );
  };

  const selectAllMale = () => {
    const maleIds = tts.voices
      .filter((v) => (v.gender || '').toLowerCase() === 'male')
      .map((v) => v.id);
    setSelectedVoiceIds((prev) => Array.from(new Set([...prev, ...maleIds])));
    addToast(`Selected all ${maleIds.length} male voices.`, 'info');
  };

  const selectAllFemale = () => {
    const femaleIds = tts.voices
      .filter((v) => (v.gender || '').toLowerCase() === 'female')
      .map((v) => v.id);
    setSelectedVoiceIds((prev) => Array.from(new Set([...prev, ...femaleIds])));
    addToast(`Selected all ${femaleIds.length} female voices.`, 'info');
  };

  const selectAllVoices = () => {
    setSelectedVoiceIds(tts.voices.map((v) => v.id));
    addToast(`Selected all ${tts.voices.length} available voices.`, 'info');
  };

  const clearVoiceSelection = () => {
    setSelectedVoiceIds([]);
  };

  // Quick preset texts
  const applyPresetText = (preset) => {
    setMultiText(preset);
  };

  // Generate speech for a single voice within comparison
  const generateSingleVoice = async (voiceId) => {
    const voice = tts.voices.find((v) => v.id === voiceId);
    if (!voice) return;

    setComparisonResults((prev) => ({
      ...prev,
      [voiceId]: {
        ...(prev[voiceId] || {}),
        status: 'generating',
        voice,
      },
    }));

    try {
      const res = await ttsApi.generateSpeech({
        text: multiText.trim(),
        voice_id: voiceId,
        rate: multiRate,
        volume: multiVolume,
        pitch: multiPitch,
      });

      setComparisonResults((prev) => ({
        ...prev,
        [voiceId]: {
          status: 'completed',
          result: res,
          voice,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      addToast(`Synthesized audio for ${voice.name}`, 'success');
    } catch (err) {
      setComparisonResults((prev) => ({
        ...prev,
        [voiceId]: {
          status: 'failed',
          error: err.message || 'Speech generation failed.',
          voice,
        },
      }));
      addToast(`Failed for ${voice.name}: ${err.message}`, 'error');
    }
  };

  // Batch Generation for all selected voices
  const handleBatchGenerate = async () => {
    const trimmed = multiText.trim();
    if (!trimmed) {
      addToast('Please enter text to synthesize.', 'error');
      return;
    }
    if (selectedVoiceIds.length === 0) {
      addToast('Please select at least one voice to test.', 'error');
      return;
    }

    setIsMultiGenerating(true);
    setMultiProgress({ current: 0, total: selectedVoiceIds.length });

    // Mark all selected voices as pending
    const initialBatch = { ...comparisonResults };
    selectedVoiceIds.forEach((vid) => {
      const v = tts.voices.find((item) => item.id === vid);
      initialBatch[vid] = {
        ...(initialBatch[vid] || {}),
        status: 'pending',
        voice: v,
      };
    });
    setComparisonResults(initialBatch);

    let completedCount = 0;

    for (const voiceId of selectedVoiceIds) {
      const voice = tts.voices.find((v) => v.id === voiceId);
      if (!voice) continue;

      setComparisonResults((prev) => ({
        ...prev,
        [voiceId]: {
          ...(prev[voiceId] || {}),
          status: 'generating',
          voice,
        },
      }));

      try {
        const res = await ttsApi.generateSpeech({
          text: trimmed,
          voice_id: voiceId,
          rate: multiRate,
          volume: multiVolume,
          pitch: multiPitch,
        });

        setComparisonResults((prev) => ({
          ...prev,
          [voiceId]: {
            status: 'completed',
            result: res,
            voice,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      } catch (err) {
        setComparisonResults((prev) => ({
          ...prev,
          [voiceId]: {
            status: 'failed',
            error: err.message || 'Synthesis failed.',
            voice,
          },
        }));
      }

      completedCount += 1;
      setMultiProgress({ current: completedCount, total: selectedVoiceIds.length });
    }

    setIsMultiGenerating(false);
    addToast(
      `Synthesized speech for ${selectedVoiceIds.length} voices successfully.`,
      'success'
    );
  };

  // Single Voice Studio Helpers
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        tts.setText((prev) => (prev ? prev + ' ' + text : text));
        addToast('Text pasted from clipboard!', 'info');
      }
    } catch {
      addToast('Cannot access clipboard.', 'error');
    }
  };

  const playHistoryAudio = (item) => {
    const fullUrl = ttsApi.getAudioUrl(item.filename);
    setActiveHistoryAudio({
      url: fullUrl,
      filename: item.filename,
      text: item.text,
      duration: item.duration,
      voice: item.voice,
    });
  };

  const getGenderBadge = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male') {
      return <span className="badge badge-gender-male">Male</span>;
    }
    if (g === 'female') {
      return <span className="badge badge-gender-female">Female</span>;
    }
    return <span className="badge badge-gender-unknown">Unknown</span>;
  };

  return (
    <div className="tts-container">
      {/* Studio Header Card & Mode Switcher */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Volume2 size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Text-to-Speech Studio</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="tts-mode-nav">
            <button
              type="button"
              className={`tts-mode-tab ${studioMode === 'single' ? 'active' : ''}`}
              onClick={() => switchStudioMode('single')}
            >
              <Volume2 size={15} />
              <span>Single Voice Studio</span>
            </button>
            <button
              type="button"
              className={`tts-mode-tab ${studioMode === 'multi' ? 'active' : ''}`}
              onClick={() => switchStudioMode('multi')}
            >
              <Users size={15} />
              <span>Multi-Voice Testing & Comparison Studio</span>
              <span className="badge badge-mint" style={{ fontSize: 10, padding: '2px 6px' }}>
                Male & Female
              </span>
            </button>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: 14 }}>
          {studioMode === 'single'
            ? 'Convert text, voice responses, and announcements into spoken audio completely on your local device. Zero network latency and total privacy.'
            : 'Select multiple male and female voices dynamically from your installed speech engines to synthesize test audio side-by-side for acoustic and timbre comparison.'}
        </p>
      </div>

      {/* ----------------- MODE A: SINGLE VOICE STUDIO (PRESERVED) ----------------- */}
      {studioMode === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(320px, 1fr)', gap: 24 }}>
          {/* Left Column: Text Input & Generation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="studio-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, margin: 0 }}>Script Editor</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePaste}
                    disabled={tts.isGenerating}
                  >
                    Paste
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={tts.clearText}
                    disabled={!tts.text || tts.isGenerating}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                className="tts-textarea"
                style={{ minHeight: 220 }}
                placeholder="Enter text here to synthesize into local speech. Try reading an article, voice assistant response, or notification..."
                value={tts.text}
                onChange={(e) => tts.setText(e.target.value)}
                disabled={tts.isGenerating}
              />

              <div className="editor-footer" style={{ marginTop: 8 }}>
                <span className={`char-counter ${tts.text.length > 4500 ? 'limit-near' : ''}`}>
                  {tts.text.length} / 5,000 characters
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Max 5,000 characters per synthesis batch
                </span>
              </div>
            </div>

            {/* Synthesis Controls */}
            <div className="studio-card">
              <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} style={{ color: 'var(--color-mint-green)' }} />
                <span>Voice & Acoustic Modulation</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Voice Selector */}
                <div className="form-group">
                  <label>Available Local Voice</label>
                  <select
                    value={tts.selectedVoiceId}
                    onChange={(e) => tts.setSelectedVoiceId(e.target.value)}
                    disabled={tts.isGenerating}
                  >
                    {tts.voices.length === 0 ? (
                      <option value="">No local voices detected</option>
                    ) : (
                      tts.voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} — ({v.language}, {v.gender || 'Unknown'}, {v.engine || 'Local'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Sliders: Rate & Volume */}
                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Speaking Rate</label>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                        {tts.rate} WPM
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="250"
                      step="5"
                      value={tts.rate}
                      onChange={(e) => tts.setRate(Number(e.target.value))}
                      disabled={tts.isGenerating}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Standard: 175 WPM (100 slow, 250 fast)
                    </span>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Volume</label>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                        {Math.round(tts.volume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={tts.volume}
                      onChange={(e) => tts.setVolume(Number(e.target.value))}
                      disabled={tts.isGenerating}
                    />
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      Gain multiplier (0.1 to 1.0)
                    </span>
                  </div>
                </div>

                {/* Pitch */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Pitch</label>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                      {tts.pitch}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={tts.pitch}
                    onChange={(e) => tts.setPitch(Number(e.target.value))}
                    disabled={tts.isGenerating}
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={tts.generate}
                  disabled={!tts.text.trim() || tts.isGenerating}
                  style={{ marginTop: 8 }}
                >
                  <Volume2 size={18} />
                  <span>{tts.isGenerating ? 'Synthesizing Speech Offline...' : 'Synthesize Speech'}</span>
                </button>

                {tts.error && (
                  <ErrorMessage message={tts.error} onDismiss={() => {}} onRetry={tts.generate} />
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Audio Output Player & Recent Syntheses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Latest Generated Audio Card */}
            <div className="studio-card">
              <div className="studio-card-header">
                <div className="studio-card-title">
                  <Sparkles size={18} style={{ color: 'var(--color-mint-green)' }} />
                  <span>Generated Audio Output</span>
                </div>
                {tts.result && (
                  <span className="badge badge-mint">{tts.result.duration}s</span>
                )}
              </div>

              {tts.isGenerating ? (
                <LoadingState message="Synthesizing audio on local speech pipeline..." size={32} />
              ) : !tts.result ? (
                <EmptyState
                  title="No Speech Generated Yet"
                  description="Type or paste text on the left and click 'Synthesize Speech' to listen and download."
                  icon={Volume2}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                      Voice: <strong style={{ color: 'var(--color-mist-white)' }}>{tts.result.voice_used}</strong>
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

                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    File: {tts.result.filename} ({tts.result.file_size_bytes ? `${(tts.result.file_size_bytes / 1024).toFixed(1)} KB` : ''})
                  </div>
                </div>
              )}
            </div>

            {/* Real Backend Generated Speech History */}
            <div className="studio-card" style={{ flex: 1 }}>
              <div className="studio-card-header">
                <div className="studio-card-title">
                  <History size={18} style={{ color: 'var(--color-mint-green)' }} />
                  <span>Generated Audio History</span>
                </div>
                <span className="badge badge-moss">{tts.ttsHistory.length} files</span>
              </div>

              {/* Currently playing history item player */}
              {activeHistoryAudio && (
                <div style={{ marginBottom: 14, padding: 12, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-mint-green)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--color-mint-green)' }}>Playing: {activeHistoryAudio.filename}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{activeHistoryAudio.voice}</span>
                  </div>
                  <AudioPlayer
                    src={activeHistoryAudio.url}
                    downloadFilename={activeHistoryAudio.filename}
                  />
                </div>
              )}

              {tts.ttsHistory.length === 0 ? (
                <EmptyState
                  title="No Audio History"
                  description="Audio files synthesized will appear here automatically from local backend storage."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
                  {tts.ttsHistory.map((item, idx) => (
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
                        gap: 12,
                      }}
                    >
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          "{item.text || 'Generated speech'}"
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {item.duration ? `${item.duration}s • ` : ''}{item.voice || 'Local voice'} • {item.timestamp}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => playHistoryAudio(item)}
                        title="Play Audio"
                        style={{ padding: '6px 10px' }}
                      >
                        <Play size={13} />
                        <span>Play</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODE B: MULTI-VOICE TESTING & COMPARISON STUDIO ----------------- */}
      {studioMode === 'multi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Row: Script Editor & Acoustic Parameters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.3fr) minmax(300px, 1fr)', gap: 24 }}>
            {/* Multi-Voice Script Editor */}
            <div className="studio-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} style={{ color: 'var(--color-mint-green)' }} />
                  <span>Comparison Test Script</span>
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setMultiText(DEFAULT_TEST_TEXT)}
                  disabled={isMultiGenerating}
                >
                  Reset Sample
                </button>
              </div>

              <textarea
                className="tts-textarea"
                style={{ minHeight: 140 }}
                placeholder="Enter text to synthesize across all selected voices..."
                value={multiText}
                onChange={(e) => setMultiText(e.target.value)}
                disabled={isMultiGenerating}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                {/* Presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => applyPresetText('Hello, welcome to AminoidSpeech. How can I assist you today?')}
                  >
                    Greeting
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => applyPresetText('Thank you for calling Aminoid. Your request is being handled by our local AI studio.')}
                  >
                    Customer Care
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11, padding: '4px 8px' }}
                    onClick={() => applyPresetText('System alert: local speech synthesis pipeline successfully started on your device.')}
                  >
                    Announcement
                  </button>
                </div>

                <span className="char-counter" style={{ fontSize: 12 }}>
                  {multiText.length} / 5,000 chars
                </span>
              </div>
            </div>

            {/* Acoustic Modulation Parameters for Batch Testing */}
            <div className="studio-card">
              <h3 style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={18} style={{ color: 'var(--color-mint-green)' }} />
                <span>Modulation Parameters (Applied to all voices)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Speaking Speed</label>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                      {multiRate} WPM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="250"
                    step="5"
                    value={multiRate}
                    onChange={(e) => setMultiRate(Number(e.target.value))}
                    disabled={isMultiGenerating}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span>100 WPM (Slow)</span>
                    <span>175 WPM (Default)</span>
                    <span>250 WPM (Fast)</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Volume</label>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                        {Math.round(multiVolume * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={multiVolume}
                      onChange={(e) => setMultiVolume(Number(e.target.value))}
                      disabled={isMultiGenerating}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Pitch Modulation</label>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                        {multiPitch}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={multiPitch}
                      onChange={(e) => setMultiPitch(Number(e.target.value))}
                      disabled={isMultiGenerating}
                    />
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-forest-black)', padding: '8px 12px', borderRadius: 8 }}>
                  Modulation is supported natively by OneCore & SAPI5 local speech engines.
                </div>
              </div>
            </div>
          </div>

          {/* Voice Selection Section */}
          <div className="studio-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: 'var(--color-mint-green)' }} />
                  <span>Select Voices for Comparative Synthesis</span>
                </h3>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Selected: <strong style={{ color: 'var(--color-mint-green)' }}>{selectedVoiceIds.length}</strong> voices
                  {selectedVoiceIds.length > 0 && ` (${
                    tts.voices.filter((v) => selectedVoiceIds.includes(v.id) && (v.gender || '').toLowerCase() === 'male').length
                  } Male, ${
                    tts.voices.filter((v) => selectedVoiceIds.includes(v.id) && (v.gender || '').toLowerCase() === 'female').length
                  } Female)`}
                </span>
              </div>

              {/* Batch Selection Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={selectAllMale}
                  disabled={isMultiGenerating || maleVoiceCount === 0}
                >
                  Select All Male ({maleVoiceCount})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={selectAllFemale}
                  disabled={isMultiGenerating || femaleVoiceCount === 0}
                >
                  Select All Female ({femaleVoiceCount})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={selectAllVoices}
                  disabled={isMultiGenerating || totalVoiceCount === 0}
                >
                  Select All Available ({totalVoiceCount})
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearVoiceSelection}
                  disabled={isMultiGenerating || selectedVoiceIds.length === 0}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            {/* Gender Filter Pills & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div className="gender-pills">
                <button
                  type="button"
                  className={`gender-pill ${genderFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setGenderFilter('all')}
                >
                  All Voices ({totalVoiceCount})
                </button>
                <button
                  type="button"
                  className={`gender-pill ${genderFilter === 'male' ? 'active' : ''}`}
                  onClick={() => setGenderFilter('male')}
                >
                  Male Voices ({maleVoiceCount})
                </button>
                <button
                  type="button"
                  className={`gender-pill ${genderFilter === 'female' ? 'active' : ''}`}
                  onClick={() => setGenderFilter('female')}
                >
                  Female Voices ({femaleVoiceCount})
                </button>
                {unknownVoiceCount > 0 && (
                  <button
                    type="button"
                    className={`gender-pill ${genderFilter === 'unknown' ? 'active' : ''}`}
                    onClick={() => setGenderFilter('unknown')}
                  >
                    Unknown ({unknownVoiceCount})
                  </button>
                )}
              </div>

              <div style={{ position: 'relative', width: 260 }}>
                <input
                  type="text"
                  placeholder="Filter voices by name..."
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  style={{ margin: 0, paddingLeft: 34, paddingRight: 10, fontSize: 13 }}
                />
                <Search
                  size={14}
                  style={{ position: 'absolute', left: 10, top: 12, color: 'var(--color-text-muted)' }}
                />
              </div>
            </div>

            {/* Voice Selection Cards Grid */}
            <div className="voice-selection-grid">
              {filteredVoices.map((voice) => {
                const isSelected = selectedVoiceIds.includes(voice.id);
                return (
                  <div
                    key={voice.id}
                    className={`voice-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => !isMultiGenerating && toggleVoiceSelection(voice.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent onClick
                      className="voice-checkbox"
                      aria-label={`Select voice ${voice.name}`}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {voice.name}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        {getGenderBadge(voice.gender)}
                        <span className="badge badge-moss" style={{ fontSize: 10, padding: '1px 5px' }}>
                          {voice.engine || 'SAPI5'}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {voice.language}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary Batch Generate Button */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                {isMultiGenerating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="status-dot status-loading" />
                    <span style={{ fontSize: 13, color: 'var(--color-mint-green)', fontWeight: 600 }}>
                      Synthesizing {multiProgress.current} of {multiProgress.total} voices locally...
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleBatchGenerate}
                disabled={isMultiGenerating || selectedVoiceIds.length === 0 || !multiText.trim()}
              >
                <Sparkles size={18} />
                <span>
                  {isMultiGenerating
                    ? `Generating (${multiProgress.current}/${multiProgress.total})...`
                    : `Generate Speech for Selected Voices (${selectedVoiceIds.length})`}
                </span>
              </button>
            </div>
          </div>

          {/* Voice Comparison Output Gallery */}
          <div className="studio-card">
            <div className="studio-card-header">
              <div className="studio-card-title">
                <Volume2 size={20} style={{ color: 'var(--color-mint-green)' }} />
                <span>Voice Comparison Output Gallery</span>
              </div>
              <span className="badge badge-moss">
                {Object.keys(comparisonResults).length} Voices Compared
              </span>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Compare generated male and female voices for pitch, clarity, accent, and timbre. Only one voice plays at a time to prevent audio overlap.
            </p>

            {Object.keys(comparisonResults).length === 0 ? (
              <EmptyState
                title="No Voice Outputs Yet"
                description="Select voices above and click 'Generate Speech for Selected Voices' to synthesize and compare audio outputs."
                icon={Users}
              />
            ) : (
              <div className="comparison-grid">
                {Object.entries(comparisonResults).map(([voiceId, item]) => {
                  const voice = item.voice || tts.voices.find((v) => v.id === voiceId) || { name: 'Voice', id: voiceId };
                  const isPlayingThis = activePlayingVoiceId === voiceId;

                  return (
                    <div
                      key={voiceId}
                      className={`comparison-card ${isPlayingThis ? 'active-playback' : ''}`}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: 15, margin: 0, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {voice.name}
                          </h4>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                            {getGenderBadge(voice.gender)}
                            <span className="badge badge-moss" style={{ fontSize: 10, padding: '1px 5px' }}>
                              {voice.engine || 'OneCore'}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {voice.language}
                            </span>
                          </div>
                        </div>

                        {/* Status badge */}
                        {item.status === 'pending' && (
                          <span className="badge badge-moss" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={12} />
                            <span>Queued</span>
                          </span>
                        )}
                        {item.status === 'generating' && (
                          <span className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RotateCw size={12} className="spin-slow" />
                            <span>Synthesizing...</span>
                          </span>
                        )}
                        {item.status === 'completed' && (
                          <span className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle2 size={12} />
                            <span>{item.result?.duration}s</span>
                          </span>
                        )}
                        {item.status === 'failed' && (
                          <span className="badge" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={12} />
                            <span>Failed</span>
                          </span>
                        )}
                      </div>

                      {/* Card Content based on status */}
                      {item.status === 'pending' && (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                          Waiting in local synthesis queue...
                        </div>
                      )}

                      {item.status === 'generating' && (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                          <LoadingState message="Synthesizing audio on local engine..." size={24} />
                        </div>
                      )}

                      {item.status === 'failed' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <ErrorMessage message={item.error || 'Failed to synthesize speech'} />
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => generateSingleVoice(voiceId)}
                          >
                            <RotateCw size={14} />
                            <span>Retry This Voice</span>
                          </button>
                        </div>
                      )}

                      {item.status === 'completed' && item.result && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* Audio Player with Exclusive Playback */}
                          <AudioPlayer
                            src={item.result.full_audio_url}
                            downloadFilename={item.result.filename || `${voice.name}.wav`}
                            playerId={voiceId}
                            activePlayerId={activePlayingVoiceId}
                            onPlay={setActivePlayingVoiceId}
                            compact={true}
                          />

                          {/* Card Footer Actions */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 86, 71, 0.4)' }}>
                            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                              {item.result.file_size_bytes ? `${(item.result.file_size_bytes / 1024).toFixed(1)} KB` : ''} • {item.timestamp}
                            </span>

                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => generateSingleVoice(voiceId)}
                                title="Regenerate this voice"
                                disabled={isMultiGenerating}
                              >
                                <RotateCw size={13} />
                                <span>Regenerate</span>
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => downloadUrl(item.result.full_audio_url, item.result.filename || 'voice.wav')}
                                title="Download WAV"
                              >
                                <Download size={13} />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TTSPage;
