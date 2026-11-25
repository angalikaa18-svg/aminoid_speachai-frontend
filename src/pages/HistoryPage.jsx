import React, { useState, useEffect } from 'react';
import {
  History,
  Mic,
  Volume2,
  Wand2,
  Sparkles,
  Search,
  Download,
  Copy,
  Play,
  RefreshCw,
  Check,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import historyApi from '../api/historyApi';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { downloadText } from '../utils/downloadFile';

export function HistoryPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('stt'); // 'stt' | 'tts' | 'clone' | 'design'
  const [historyData, setHistoryData] = useState({ stt: [], tts: [], clone: [], design: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Audio player & copy state
  const [playingItem, setPlayingItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Delete modal state
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [clearingCategory, setClearingCategory] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resStt, resTts, resClone, resDesign] = await Promise.all([
        historyApi.getHistory('stt', '', 100, 0).catch(() => ({ items: [] })),
        historyApi.getHistory('tts', '', 100, 0).catch(() => ({ items: [] })),
        historyApi.getHistory('clone', '', 100, 0).catch(() => ({ items: [] })),
        historyApi.getHistory('design', '', 100, 0).catch(() => ({ items: [] })),
      ]);
      setHistoryData({
        stt: resStt.items || [],
        tts: resTts.items || [],
        clone: resClone.items || [],
        design: resDesign.items || [],
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch history logs from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Text copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTranscript = (text, filename) => {
    downloadText(text, `${filename || 'transcript'}.txt`);
  };

  const handleDeleteItem = async () => {
    if (!deletingRecord) return;
    try {
      await historyApi.deleteHistoryItem(deletingRecord.category, deletingRecord.id);
      addToast('History record deleted.', 'info');
      // Update local state immediately
      setHistoryData((prev) => ({
        ...prev,
        [deletingRecord.category]: prev[deletingRecord.category].filter(
          (item) => item.id !== deletingRecord.id
        ),
      }));
    } catch (err) {
      addToast(err.message || 'Failed to delete record.', 'error');
    } finally {
      setDeletingRecord(null);
    }
  };

  const handleClearCategory = async () => {
    if (!clearingCategory) return;
    try {
      await historyApi.clearHistory(clearingCategory);
      addToast(`Cleared all ${clearingCategory.toUpperCase()} history.`, 'info');
      setHistoryData((prev) => ({
        ...prev,
        [clearingCategory]: [],
      }));
    } catch (err) {
      addToast(err.message || 'Failed to clear history.', 'error');
    } finally {
      setClearingCategory(null);
    }
  };

  // Get current active items and filter by search term
  const currentItems = historyData[activeTab] || [];
  const filteredItems = currentItems.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.text && item.text.toLowerCase().includes(term)) ||
      (item.filename && item.filename.toLowerCase().includes(term)) ||
      (item.voice && item.voice.toLowerCase().includes(term)) ||
      (item.voice_name && item.voice_name.toLowerCase().includes(term)) ||
      (item.language && item.language.toLowerCase().includes(term)) ||
      (item.instruct && item.instruct.toLowerCase().includes(term)) ||
      (item.target_text && item.target_text.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <History size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Activity & History Logs</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadHistory}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh History</span>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Audit, search, replay, and manage historical speech recognition transcripts, syntheses, voice clones, and acoustic designs.
          All records persist locally in your offline database.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="studio-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          {/* Sub Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'stt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('stt')}
            >
              <Mic size={14} />
              <span>STT Transcriptions ({historyData.stt.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'tts' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('tts')}
            >
              <Volume2 size={14} />
              <span>TTS Syntheses ({historyData.tts.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'clone' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('clone')}
            >
              <Wand2 size={14} />
              <span>Voice Clones ({historyData.clone.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'design' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('design')}
            >
              <Sparkles size={14} />
              <span>Voice Designs ({historyData.design.length})</span>
            </button>
          </div>

          {/* Search Input & Clear All */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ minWidth: 220 }}>
              <Search size={15} className="search-icon" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-search"
              />
            </div>
            {currentItems.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setClearingCategory(activeTab)}
                style={{ color: 'var(--color-danger)' }}
                title="Clear all records in this tab"
              >
                <Trash2 size={14} />
                <span>Clear Tab</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Audio Player (if an item is playing) */}
      {playingItem && (
        <div className="studio-card" style={{ borderColor: 'var(--color-mint-green)' }}>
          <div className="studio-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} style={{ color: 'var(--color-mint-green)' }} />
              <strong>Now Playing: {playingItem.filename || playingItem.voice_name || 'Speech Audio'}</strong>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPlayingItem(null)}
            >
              Close Player
            </button>
          </div>
          <AudioPlayer
            src={playingItem.full_audio_url || (playingItem.audio_url ? `http://127.0.0.1:8080${playingItem.audio_url}` : null) || (playingItem.filename ? `http://127.0.0.1:8080/api/v1/tts/audio/${playingItem.filename}` : null)}
            downloadFilename={playingItem.filename || 'audio.wav'}
            autoPlay
          />
        </div>
      )}

      {/* Error Message */}
      {error && <ErrorMessage message={error} onRetry={loadHistory} />}

      {/* Loading State */}
      {loading ? (
        <LoadingState message="Loading historical speech records from backend..." />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title={`No ${activeTab.toUpperCase()} Records Found`}
          description={
            searchTerm
              ? `No records match "${searchTerm}". Try another search term.`
              : `No ${activeTab} operations have been logged to local storage yet.`
          }
          icon={activeTab === 'stt' ? Mic : activeTab === 'tts' ? Volume2 : Wand2}
        />
      ) : (
        /* Records List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map((item, idx) => {
            const itemId = item.id || `${activeTab}-${idx}`;
            const displayText = item.text || item.target_text || item.instruct || '(No text preview)';
            const hasAudio = Boolean(item.audio_url || item.filename);

            return (
              <div
                key={itemId}
                className="studio-card"
                style={{
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        backgroundColor: 'rgba(101, 230, 165, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-mint-green)',
                      }}
                    >
                      {activeTab === 'stt' ? <Mic size={16} /> : activeTab === 'tts' ? <Volume2 size={16} /> : activeTab === 'clone' ? <Wand2 size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--color-mist-white)' }}>
                        {item.filename || item.voice_name || (item.instruct ? `Prompt: ${item.instruct.slice(0, 30)}...` : 'Audio Job')}
                      </strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {item.timestamp || 'Recorded'}
                        {item.duration ? ` • ${item.duration}s duration` : ''}
                        {item.language ? ` • Lang: ${item.language.toUpperCase()}` : ''}
                        {item.voice ? ` • Voice: ${item.voice}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.duration && (
                      <span className="badge badge-mint">{item.duration}s</span>
                    )}

                    {hasAudio && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPlayingItem(item)}
                      >
                        <Play size={13} />
                        <span>Play Audio</span>
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyText(displayText, itemId)}
                    >
                      {copiedId === itemId ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadTranscript(displayText, item.filename || 'history_text')}
                    >
                      <Download size={13} />
                      <span>Text</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeletingRecord({ category: activeTab, id: item.id || itemId })}
                      style={{ color: 'var(--color-danger)' }}
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content Box */}
                <div
                  style={{
                    backgroundColor: 'var(--color-forest-black)',
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--color-mist-white)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {displayText}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Single Record Dialog */}
      {deletingRecord && (
        <ConfirmDialog
          isOpen={Boolean(deletingRecord)}
          title="Delete History Record"
          message="Are you sure you want to permanently delete this task record from local history?"
          confirmLabel="Delete Record"
          onConfirm={handleDeleteItem}
          onCancel={() => setDeletingRecord(null)}
          danger
        />
      )}

      {/* Confirm Clear Tab History Dialog */}
      {clearingCategory && (
        <ConfirmDialog
          isOpen={Boolean(clearingCategory)}
          title={`Clear All ${clearingCategory.toUpperCase()} History`}
          message={`Are you sure you want to delete all ${clearingCategory.toUpperCase()} records from your local storage? This action cannot be undone.`}
          confirmLabel="Clear All Records"
          onConfirm={handleClearCategory}
          onCancel={() => setClearingCategory(null)}
          danger
        />
      )}
    </div>
  );
}

export default HistoryPage;
