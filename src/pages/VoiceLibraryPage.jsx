import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Search,
  Play,
  Pause,
  Square,
  Volume2,
  RefreshCw,
  Sparkles,
  Users,
  Edit3,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Sliders,
  Globe,
  FileText,
} from 'lucide-react';
import ttsApi from '../api/ttsApi';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { downloadUrl } from '../utils/downloadFile';
import {
  DEFAULT_ENGLISH_TEST_SCRIPT,
  LANGUAGE_TEST_SCRIPTS,
  getScriptForVoice,
  getLanguageScriptLabel,
  getSavedCustomScript,
  saveCustomScript,
  clearCustomScript,
} from '../utils/testScripts';

export function VoiceLibraryPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all'); // 'all', 'male', 'female', 'unknown'
  const [langFilter, setLangFilter] = useState('all');

  // Multi-voice selection for comparison
  const [selectedVoiceIds, setSelectedVoiceIds] = useState([]);

  // Test Script Configuration State
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [customScriptText, setCustomScriptText] = useState(getSavedCustomScript());
  const [activeScriptMode, setActiveScriptMode] = useState(getSavedCustomScript() ? 'custom' : 'default');
  const [previewLanguage, setPreviewLanguage] = useState('en');

  // Test Results per Voice ID: { [voiceId]: { status: 'generating'|'completed'|'failed', result, error, timestamp, scriptUsed } }
  const [testResults, setTestResults] = useState({});

  // Batch comparison generation state
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Exclusive audio playback tracking (only one voice plays at a time)
  const [activePlayingId, setActivePlayingId] = useState(null);

  const loadVoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ttsApi.getVoices();
      if (Array.isArray(data)) {
        setVoices(data);
      } else {
        setVoices([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch voices from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVoices();
  }, []);

  // Filter voices dynamically based on metadata returned by the installed engine
  const filteredVoices = voices.filter((v) => {
    const matchesSearch =
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.language?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.engine?.toLowerCase().includes(searchTerm.toLowerCase());

    const g = (v.gender || '').toLowerCase();
    let matchesGender = true;
    if (genderFilter === 'male') {
      matchesGender = g === 'male';
    } else if (genderFilter === 'female') {
      matchesGender = g === 'female';
    } else if (genderFilter === 'unknown') {
      matchesGender = g !== 'male' && g !== 'female';
    }

    const matchesLang =
      langFilter === 'all' || v.language?.toLowerCase().includes(langFilter.toLowerCase());

    return matchesSearch && matchesGender && matchesLang;
  });

  // Dynamic voice counts
  const totalCount = voices.length;
  const maleCount = voices.filter((v) => (v.gender || '').toLowerCase() === 'male').length;
  const femaleCount = voices.filter((v) => (v.gender || '').toLowerCase() === 'female').length;
  const unknownCount = voices.filter(
    (v) => (v.gender || '').toLowerCase() !== 'male' && (v.gender || '').toLowerCase() !== 'female'
  ).length;

  const uniqueLangs = Array.from(new Set(voices.map((v) => v.language).filter(Boolean)));

  // Resolve active testing script for a specific voice
  const resolveScriptForVoice = (voice) => {
    if (activeScriptMode === 'custom' && customScriptText.trim()) {
      return customScriptText.trim();
    }
    return getScriptForVoice(voice, null);
  };

  // Test Voice for a specific voice card
  const handleTestVoice = async (voice) => {
    if (!voice) return;
    const voiceId = voice.id;
    const scriptToUse = resolveScriptForVoice(voice);

    setTestResults((prev) => ({
      ...prev,
      [voiceId]: {
        ...(prev[voiceId] || {}),
        status: 'generating',
        voice,
        scriptUsed: scriptToUse,
      },
    }));

    try {
      const res = await ttsApi.generateSpeech({
        text: scriptToUse,
        voice_id: voiceId,
        rate: 175,
        volume: 1.0,
      });

      setTestResults((prev) => ({
        ...prev,
        [voiceId]: {
          status: 'completed',
          result: res,
          voice,
          scriptUsed: scriptToUse,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      addToast(`Synthesized test evaluation for ${voice.name}!`, 'success');
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [voiceId]: {
          status: 'failed',
          error: err.message || 'Failed to synthesize voice preview.',
          voice,
          scriptUsed: scriptToUse,
        },
      }));
      addToast(err.message || 'Failed to synthesize voice preview.', 'error');
    }
  };

  // Batch Test for all selected voices with identical testing script
  const handleBatchTestSelected = async () => {
    if (selectedVoiceIds.length === 0) {
      addToast('Please select at least one voice to test.', 'error');
      return;
    }

    setIsBatchTesting(true);
    setBatchProgress({ current: 0, total: selectedVoiceIds.length });

    // Mark selected voices as generating in results
    const updated = { ...testResults };
    selectedVoiceIds.forEach((id) => {
      const v = voices.find((item) => item.id === id);
      const script = resolveScriptForVoice(v);
      updated[id] = {
        status: 'generating',
        voice: v,
        scriptUsed: script,
      };
    });
    setTestResults(updated);

    let count = 0;
    for (const voiceId of selectedVoiceIds) {
      const voice = voices.find((v) => v.id === voiceId);
      if (!voice) continue;

      const scriptToUse = resolveScriptForVoice(voice);

      try {
        const res = await ttsApi.generateSpeech({
          text: scriptToUse,
          voice_id: voiceId,
          rate: 175,
          volume: 1.0,
        });

        setTestResults((prev) => ({
          ...prev,
          [voiceId]: {
            status: 'completed',
            result: res,
            voice,
            scriptUsed: scriptToUse,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
      } catch (err) {
        setTestResults((prev) => ({
          ...prev,
          [voiceId]: {
            status: 'failed',
            error: err.message || 'Speech generation failed.',
            voice,
            scriptUsed: scriptToUse,
          },
        }));
      }

      count += 1;
      setBatchProgress({ current: count, total: selectedVoiceIds.length });
    }

    setIsBatchTesting(false);
    addToast(
      `Finished batch evaluation for ${selectedVoiceIds.length} voices!`,
      'success'
    );
  };

  // Multi-voice selection handlers
  const toggleVoiceSelection = (voiceId) => {
    setSelectedVoiceIds((prev) =>
      prev.includes(voiceId) ? prev.filter((id) => id !== voiceId) : [...prev, voiceId]
    );
  };

  const selectAllMale = () => {
    const maleIds = voices
      .filter((v) => (v.gender || '').toLowerCase() === 'male')
      .map((v) => v.id);
    setSelectedVoiceIds((prev) => Array.from(new Set([...prev, ...maleIds])));
    addToast(`Selected all ${maleIds.length} male voices.`, 'info');
  };

  const selectAllFemale = () => {
    const femaleIds = voices
      .filter((v) => (v.gender || '').toLowerCase() === 'female')
      .map((v) => v.id);
    setSelectedVoiceIds((prev) => Array.from(new Set([...prev, ...femaleIds])));
    addToast(`Selected all ${femaleIds.length} female voices.`, 'info');
  };

  const selectAllVoices = () => {
    setSelectedVoiceIds(voices.map((v) => v.id));
    addToast(`Selected all ${voices.length} available voices.`, 'info');
  };

  const clearVoiceSelection = () => {
    setSelectedVoiceIds([]);
  };

  // Custom Script Management
  const handleSaveCustomScript = () => {
    if (!customScriptText.trim()) {
      addToast('Script cannot be empty.', 'error');
      return;
    }
    saveCustomScript(customScriptText);
    setActiveScriptMode('custom');
    addToast('Custom testing script saved successfully!', 'success');
  };

  const handleResetToDefault = () => {
    clearCustomScript();
    setCustomScriptText('');
    setActiveScriptMode('default');
    addToast('Reset to standard default evaluation script.', 'info');
  };

  const handleLoadLanguageScript = (langKey) => {
    setPreviewLanguage(langKey);
    const langObj = LANGUAGE_TEST_SCRIPTS[langKey];
    if (langObj) {
      setCustomScriptText(langObj.script);
    }
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

  // Tested voices count
  const testedVoiceCount = Object.values(testResults).filter(
    (item) => item.status === 'completed'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Layers size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Installed Local Voice Library & Testing Studio</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn ${showScriptEditor ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setShowScriptEditor((prev) => !prev)}
            >
              <Edit3 size={14} />
              <span>{showScriptEditor ? 'Hide Test Script' : 'Edit Test Script'}</span>
              {activeScriptMode === 'custom' && (
                <span className="badge badge-mint" style={{ fontSize: 10, padding: '1px 6px' }}>
                  Custom
                </span>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/tts?mode=multi')}
            >
              <Users size={14} />
              <span>Multi-Voice Studio</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadVoices}
              disabled={loading}
            >
              <RefreshCw size={14} />
              <span>Refresh Voices</span>
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Discover and evaluate all installed speech synthesis voices on your local system.
          Click <strong>Test Voice</strong> on any voice card to instantly generate speech using the standard test evaluation script.
        </p>
      </div>

      {/* Test Script Configuration Panel (Collapsible / Expandable) */}
      {showScriptEditor && (
        <div className="script-config-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText size={20} style={{ color: 'var(--color-mint-green)' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>
                  Standard Voice Evaluation Test Script
                </h4>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Designed to evaluate clarity, pronunciation, question intonation, numbers, dates, emails, and natural flow.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                className={`badge ${activeScriptMode === 'custom' ? 'badge-mint' : 'badge-moss'}`}
                style={{ fontSize: 11 }}
              >
                {activeScriptMode === 'custom' ? 'Custom Script Active' : 'Default Standard Script Active'}
              </span>
            </div>
          </div>

          {/* Language Presets Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Globe size={13} />
              <span>Load Language Preset:</span>
            </span>
            {Object.entries(LANGUAGE_TEST_SCRIPTS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                className={`btn btn-secondary btn-sm ${previewLanguage === key ? 'active' : ''}`}
                style={{ fontSize: 11, padding: '3px 8px' }}
                onClick={() => handleLoadLanguageScript(key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Script Textarea */}
          <textarea
            className="script-editor-textarea"
            rows={5}
            placeholder="Enter standard evaluation text or load one of the presets above..."
            value={customScriptText || DEFAULT_ENGLISH_TEST_SCRIPT}
            onChange={(e) => {
              setCustomScriptText(e.target.value);
              setActiveScriptMode('custom');
            }}
          />

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              {(customScriptText || DEFAULT_ENGLISH_TEST_SCRIPT).length} characters • Evaluates numbers, dates, emails & pauses
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleResetToDefault}
              >
                <RotateCcw size={13} />
                <span>Reset to Default Script</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveCustomScript}
              >
                <Sparkles size={13} />
                <span>Save Custom Script</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Selection & Comparison Controls */}
      <div className="studio-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Top Filter & Batch Selection Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Gender Filter Pills */}
          <div className="gender-pills">
            <button
              type="button"
              className={`gender-pill ${genderFilter === 'all' ? 'active' : ''}`}
              onClick={() => setGenderFilter('all')}
            >
              All Voices ({totalCount})
            </button>
            <button
              type="button"
              className={`gender-pill ${genderFilter === 'male' ? 'active' : ''}`}
              onClick={() => setGenderFilter('male')}
            >
              Male Voices ({maleCount})
            </button>
            <button
              type="button"
              className={`gender-pill ${genderFilter === 'female' ? 'active' : ''}`}
              onClick={() => setGenderFilter('female')}
            >
              Female Voices ({femaleCount})
            </button>
            {unknownCount > 0 && (
              <button
                type="button"
                className={`gender-pill ${genderFilter === 'unknown' ? 'active' : ''}`}
                onClick={() => setGenderFilter('unknown')}
              >
                Unknown ({unknownCount})
              </button>
            )}
          </div>

          {/* Batch Selection Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={selectAllMale}
              disabled={isBatchTesting || maleCount === 0}
            >
              Select All Male ({maleCount})
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={selectAllFemale}
              disabled={isBatchTesting || femaleCount === 0}
            >
              Select All Female ({femaleCount})
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={selectAllVoices}
              disabled={isBatchTesting || totalCount === 0}
            >
              Select All ({totalCount})
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={clearVoiceSelection}
              disabled={isBatchTesting || selectedVoiceIds.length === 0}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Search, Language Filter & Batch Test Trigger Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, minWidth: 280, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search voice by name, engine, or language..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ margin: 0, paddingLeft: 38 }}
              />
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }}
              />
            </div>

            <div style={{ width: 170 }}>
              <select
                value={langFilter}
                onChange={(e) => setLangFilter(e.target.value)}
                style={{ margin: 0 }}
                aria-label="Filter by language"
              >
                <option value="all">All Languages</option>
                {uniqueLangs.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Selected Voices Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {selectedVoiceIds.length > 0 && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleBatchTestSelected}
                disabled={isBatchTesting}
              >
                <Play size={14} />
                <span>
                  {isBatchTesting
                    ? `Testing (${batchProgress.current}/${batchProgress.total})...`
                    : `Test Selected Voices (${selectedVoiceIds.length})`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadVoices} />}

      {/* Voice Comparison Output Gallery (if voices tested) */}
      {testedVoiceCount > 0 && (
        <div className="studio-card" style={{ borderColor: 'var(--color-moss-border)' }}>
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Volume2 size={20} style={{ color: 'var(--color-mint-green)' }} />
              <span>Voice Comparison Gallery ({testedVoiceCount} Evaluated)</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-mint">{testedVoiceCount} Ready to Compare</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setTestResults({})}
              >
                Clear Results
              </button>
            </div>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Compare naturalness, pronunciation, dates, numbers, and pitch using the identical evaluation script. Only one voice plays at a time.
          </p>

          <div className="comparison-grid">
            {Object.entries(testResults)
              .filter(([_, item]) => item.status === 'completed' && item.result)
              .map(([vId, item]) => {
                const voice = item.voice || voices.find((v) => v.id === vId) || { name: 'Voice', id: vId };
                const isPlaying = activePlayingId === vId;

                return (
                  <div
                    key={vId}
                    className={`comparison-card ${isPlaying ? 'active-playback' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <h4 style={{ fontSize: 15, margin: 0, color: 'var(--color-mist-white)' }}>
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

                      <span className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={12} />
                        <span>{item.result?.duration}s</span>
                      </span>
                    </div>

                    {/* Audio Player with Exclusive Playback & Stop support */}
                    <AudioPlayer
                      src={item.result.full_audio_url}
                      downloadFilename={item.result.filename || `${voice.name}.wav`}
                      playerId={vId}
                      activePlayerId={activePlayingId}
                      onPlay={setActivePlayingId}
                      compact={true}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid rgba(49, 86, 71, 0.4)' }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                        {item.result.file_size_bytes ? `${(item.result.file_size_bytes / 1024).toFixed(1)} KB` : ''} • {item.timestamp}
                      </span>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleTestVoice(voice)}
                          title="Regenerate this voice"
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
                );
              })}
          </div>
        </div>
      )}

      {/* Voice Cards Grid */}
      {loading ? (
        <LoadingState message="Discovering installed voices from local speech subsystem..." />
      ) : filteredVoices.length === 0 ? (
        <EmptyState
          title="No Voices Found"
          description={
            searchTerm || genderFilter !== 'all' || langFilter !== 'all'
              ? 'No installed voices match your current filters. Try resetting search.'
              : 'No voices detected from backend /api/v1/tts/voices.'
          }
          icon={Layers}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoiceIds.includes(voice.id);
            const testItem = testResults[voice.id];
            const isTestingThis = testItem?.status === 'generating';
            const isCompleted = testItem?.status === 'completed';
            const isFailed = testItem?.status === 'failed';

            return (
              <div
                key={voice.id}
                className={`studio-card ${isSelected ? 'selected' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderColor: isSelected ? 'var(--color-mint-green)' : undefined,
                  transition: 'all var(--transition-fast)',
                }}
              >
                {/* Header with Checkbox & Badges */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleVoiceSelection(voice.id)}
                    className="voice-checkbox"
                    aria-label={`Select ${voice.name} for comparison`}
                    style={{ marginTop: 3 }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 16, margin: 0, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {voice.name}
                    </h4>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {voice.language || 'English'}
                      </span>
                      <span style={{ color: 'var(--color-moss-border)' }}>•</span>
                      <span className="badge badge-moss" style={{ fontSize: 10, padding: '1px 6px' }}>
                        {voice.engine || 'SAPI5'}
                      </span>
                      <span style={{ color: 'var(--color-moss-border)' }}>•</span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        Script: {getLanguageScriptLabel(voice)}
                      </span>
                    </div>
                  </div>

                  {getGenderBadge(voice.gender)}
                </div>

                {/* Voice Token ID */}
                <div
                  style={{
                    padding: 8,
                    backgroundColor: 'var(--color-forest-black)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  ID: {voice.id}
                </div>

                {/* Inline Audio Player if this voice was tested */}
                {isCompleted && testItem.result && (
                  <div className="voice-card-audio-preview">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-mint-green)', fontWeight: 600 }}>
                        Evaluation Sample ({testItem.result.duration}s)
                      </span>
                      <span style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {testItem.result.file_size_bytes ? `${(testItem.result.file_size_bytes / 1024).toFixed(1)} KB` : ''}
                      </span>
                    </div>

                    <AudioPlayer
                      src={testItem.result.full_audio_url}
                      downloadFilename={testItem.result.filename || `${voice.name}.wav`}
                      playerId={voice.id}
                      activePlayerId={activePlayingId}
                      onPlay={setActivePlayingId}
                      compact={true}
                    />
                  </div>
                )}

                {/* Inline Generation Loading */}
                {isTestingThis && (
                  <div style={{ padding: '14px 0', textAlign: 'center' }}>
                    <LoadingState message="Synthesizing evaluation audio..." size={20} />
                  </div>
                )}

                {/* Inline Error if failed */}
                {isFailed && (
                  <ErrorMessage message={testItem.error || 'Failed to synthesize speech'} />
                )}

                {/* Footer Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', gap: 8, paddingTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/tts?mode=multi&voice=${encodeURIComponent(voice.id)}`)}
                    title="Open in Multi-Voice Comparison Studio"
                  >
                    <Users size={13} />
                    <span>Studio</span>
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {isCompleted && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleTestVoice(voice)}
                        title="Regenerate evaluation sample"
                        disabled={isTestingThis}
                      >
                        <RotateCw size={13} />
                        <span>Regenerate</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleTestVoice(voice)}
                      disabled={isTestingThis}
                    >
                      <Play size={13} />
                      <span>{isTestingThis ? 'Synthesizing...' : isCompleted ? 'Re-test Voice' : 'Test Voice'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default VoiceLibraryPage;
