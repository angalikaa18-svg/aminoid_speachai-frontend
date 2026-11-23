import React, { useState, useEffect } from 'react';
import {
  History,
  Mic,
  Volume2,
  Search,
  Download,
  Copy,
  Play,
  RefreshCw,
  Check,
} from 'lucide-react';
import historyApi from '../api/historyApi';
import ttsApi from '../api/ttsApi';
import AudioPlayer from '../components/AudioPlayer';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { downloadText } from '../utils/downloadFile';

export function HistoryPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('stt'); // 'stt' | 'tts'
  const [sttHistory, setSttHistory] = useState([]);
  const [ttsHistory, setTtsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Active audio player for TTS history item
  const [playingItem, setPlayingItem] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sttData, ttsData] = await Promise.all([
        historyApi.getSTTHistory().catch(() => []),
        historyApi.getTTSHistory().catch(() => []),
      ]);
      setSttHistory(Array.isArray(sttData) ? sttData : []);
      setTtsHistory(Array.isArray(ttsData) ? ttsData : []);
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

  // Filter STT records
  const filteredStt = sttHistory.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.filename && item.filename.toLowerCase().includes(term)) ||
      (item.text && item.text.toLowerCase().includes(term)) ||
      (item.language && item.language.toLowerCase().includes(term))
    );
  });

  // Filter TTS records
  const filteredTts = ttsHistory.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.text && item.text.toLowerCase().includes(term)) ||
      (item.voice && item.voice.toLowerCase().includes(term)) ||
      (item.filename && item.filename.toLowerCase().includes(term))
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
            <RefreshCw size={14} />
            <span>Refresh History</span>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Search and review historical speech recognition transcripts and generated audio files saved on your local backend.
        </p>
      </div>

      {/* Tabs & Search */}
      <div className="studio-card" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'stt' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('stt')}
            >
              <Mic size={14} />
              <span>Transcriptions ({sttHistory.length})</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'tts' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('tts')}
            >
              <Volume2 size={14} />
              <span>Generated Speech ({ttsHistory.length})</span>
            </button>
          </div>

          <div style={{ position: 'relative', width: 280 }}>
            <input
              type="text"
              placeholder="Search history by text or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ margin: 0, paddingLeft: 36 }}
            />
            <Search
              size={15}
              style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }}
            />
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadHistory} />}

      {/* Audio Player for TTS History Item if selected */}
      {playingItem && activeTab === 'tts' && (
        <div className="studio-card" style={{ borderColor: 'var(--color-mint-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-mint-green)' }}>
              Playing: {playingItem.filename}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setPlayingItem(null)}
            >
              Close
            </button>
          </div>
          <AudioPlayer
            src={ttsApi.getAudioUrl(playingItem.filename)}
            downloadFilename={playingItem.filename}
          />
        </div>
      )}

      {/* History Content */}
      {loading ? (
        <LoadingState message="Loading activity records from local database..." />
      ) : activeTab === 'stt' ? (
        /* STT HISTORY */
        filteredStt.length === 0 ? (
          <EmptyState
            title="No Transcription Records"
            description={
              searchTerm
                ? 'No transcriptions match your search filter.'
                : 'No audio transcriptions have been recorded yet.'
            }
            icon={Mic}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredStt.map((item, idx) => (
              <div
                key={idx}
                className="studio-card"
                style={{
                  padding: 18,
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
                      <Mic size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--color-mist-white)' }}>
                        {item.filename || 'audio.wav'}
                      </strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {item.timestamp || 'Recorded'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-mint">
                      Lang: {(item.language || 'unknown').toUpperCase()}
                    </span>
                    {item.duration && (
                      <span className="badge badge-moss">{item.duration}s</span>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyText(item.text, `stt-${idx}`)}
                    >
                      {copiedId === `stt-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDownloadTranscript(item.text, item.filename)}
                    >
                      <Download size={13} />
                      <span>TXT</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-forest-black)',
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--color-mist-white)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {item.text || '(Empty transcript)'}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* TTS HISTORY */
        filteredTts.length === 0 ? (
          <EmptyState
            title="No Speech Synthesis Records"
            description={
              searchTerm
                ? 'No TTS records match your search filter.'
                : 'No speech audio files have been synthesized yet.'
            }
            icon={Volume2}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredTts.map((item, idx) => (
              <div
                key={idx}
                className="studio-card"
                style={{
                  padding: 18,
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
                      <Volume2 size={16} />
                    </div>
                    <div>
                      <strong style={{ fontSize: 14, color: 'var(--color-mist-white)' }}>
                        {item.filename || 'tts_audio.wav'}
                      </strong>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {item.voice || 'Local Voice'} • {item.timestamp || 'Synthesized'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.duration && (
                      <span className="badge badge-mint">{item.duration}s</span>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPlayingItem(item)}
                    >
                      <Play size={13} />
                      <span>Play Audio</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCopyText(item.text, `tts-${idx}`)}
                    >
                      {copiedId === `tts-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copy Text</span>
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-forest-black)',
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--color-mist-white)',
                  }}
                >
                  "{item.text || '(Empty text)'}"
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default HistoryPage;
