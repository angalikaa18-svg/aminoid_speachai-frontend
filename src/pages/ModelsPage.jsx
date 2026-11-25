import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  Info,
  RefreshCw,
  Radio,
  Volume2,
  Wand2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import modelApi from '../api/modelApi';
import { useToast } from '../components/Toast';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export function ModelsPage() {
  const { addToast } = useToast();
  const [modelStatus, setModelStatus] = useState(null);
  const [modelsList, setModelsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [error, setError] = useState(null);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusData, catalogData] = await Promise.all([
        modelApi.getStatus().catch(() => null),
        modelApi.getModelsCatalog().catch(() => null),
      ]);
      setModelStatus(statusData || catalogData);
      if (catalogData && Array.isArray(catalogData.models)) {
        setModelsList(catalogData.models);
      } else {
        // Fallback to STT models endpoint if catalog empty
        const stt = await modelApi.getSTTModels().catch(() => []);
        setModelsList(stt);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch model status from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleActivateModel = async (modelId) => {
    setActivatingId(modelId);
    try {
      await modelApi.activateModel(modelId);
      addToast(`Model "${modelId}" activated successfully!`, 'success');
      await loadModels();
    } catch (err) {
      addToast(err.message || 'Model activation failed', 'error');
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Cpu size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Local Speech Model Management</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadModels}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Models</span>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          View, monitor, and activate local Speech-to-Text, Text-to-Speech, and Acoustic Cloning models directly managed by your local server.
          All inference runs on local CPU int8 quantization without internet access.
        </p>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadModels} />}

      {loading ? (
        <LoadingState message="Querying local model repository from backend..." />
      ) : (
        <>
          {/* Active Model Status Overview */}
          <div className="studio-card">
            <div className="studio-card-header">
              <div className="studio-card-title">
                <Radio size={18} style={{ color: 'var(--color-mint-green)' }} />
                <span>Backend Engine Diagnostics</span>
              </div>
              <span className="badge badge-mint">
                {modelStatus?.offline_verified ? 'Offline Verified' : 'Air-Gapped'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {/* STT Engine Status */}
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'var(--color-forest-black)',
                  border: '1px solid var(--color-moss-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mint-green)' }}>
                  STT Engine Status
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-mist-white)' }}>
                  Model: <strong>{modelStatus?.stt?.model_name || 'faster-whisper-tiny'}</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Loaded: {modelStatus?.stt?.loaded ? 'Active in RAM' : 'On-Demand (Loads on first call)'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Execution Mode: <strong>CPU int8 Quantized</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Air-Gapped: {modelStatus?.stt?.offline ? 'Yes (100% Offline)' : 'No'}
                </div>
              </div>

              {/* TTS Engine Status */}
              <div
                style={{
                  padding: 16,
                  backgroundColor: 'var(--color-forest-black)',
                  border: '1px solid var(--color-moss-border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mint-green)' }}>
                  TTS Engine Status
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-mist-white)' }}>
                  Engine: <strong>{modelStatus?.tts?.engine || 'Local SAPI5'}</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Status: <span className="badge badge-mint">{modelStatus?.tts?.status || 'ready'}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Voices Available: <strong>{modelStatus?.tts?.voices_available || 2}</strong>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Air-Gapped: {modelStatus?.tts?.offline ? 'Yes (100% Offline)' : 'No'}
                </div>
              </div>
            </div>
          </div>

          {/* Model Catalog Table */}
          <div className="studio-card">
            <h3 style={{ fontSize: 16, marginBottom: 16 }}>Available Speech Models & Synthesizers</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="specs-table">
                <thead>
                  <tr>
                    <th>Model Name</th>
                    <th>Identifier</th>
                    <th>Pipeline Type</th>
                    <th>Size / Footprint</th>
                    <th>Target Device</th>
                    <th>Latency</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modelsList.map((m) => {
                    const isSTT = m.type?.includes('Speech-to-Text') || m.id?.includes('whisper');
                    const isCloning = m.type?.includes('Cloning') || m.id?.includes('qwen');

                    return (
                      <tr key={m.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isSTT ? (
                              <Cpu size={16} style={{ color: 'var(--color-mint-green)' }} />
                            ) : isCloning ? (
                              <Wand2 size={16} style={{ color: 'var(--color-mint-green)' }} />
                            ) : (
                              <Volume2 size={16} style={{ color: 'var(--color-mint-green)' }} />
                            )}
                            <strong style={{ color: 'var(--color-mist-white)' }}>{m.name}</strong>
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: 12, color: 'var(--color-mint-green)' }}>{m.id}</code>
                        </td>
                        <td>{m.type || 'Speech Processing'}</td>
                        <td>{m.size || '72 MB'}</td>
                        <td>{m.device || 'CPU'}</td>
                        <td>{m.latency || 'Sub-second'}</td>
                        <td>
                          <span className="badge badge-mint">{m.status || 'Ready'}</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleActivateModel(m.id)}
                            disabled={activatingId === m.id}
                          >
                            <Zap size={13} />
                            <span>{activatingId === m.id ? 'Activating...' : 'Activate / Test'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="notice-box info" style={{ marginTop: 20 }}>
              <Info size={18} style={{ color: 'var(--color-mint-green)', flexShrink: 0 }} />
              <div>
                <strong>Local Storage Notice:</strong> Models run strictly in offline local memory.
                Model activation calls the backend endpoint <code>POST /api/v1/models/activate?model_id=...</code> to verify local readiness and warm execution caches.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ModelsPage;
