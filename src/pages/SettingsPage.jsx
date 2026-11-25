import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  ShieldCheck,
  RotateCcw,
  Check,
  AlertCircle,
  Wifi,
  Sliders,
  Database,
  Save,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { getApiBaseUrl } from '../api/apiClient';
import healthApi from '../api/healthApi';
import settingsApi from '../api/settingsApi';
import { useToast } from '../components/Toast';
import LoadingState from '../components/LoadingState';

export function SettingsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Settings State mapped to storage/settings.json
  const [settings, setSettings] = useState({
    api_base_url: getApiBaseUrl(),
    default_stt_language: 'auto',
    default_vad_filter: true,
    default_tts_rate: 175,
    default_tts_volume: 1.0,
    default_tts_pitch: 50,
    offline_strict_mode: true,
    auto_webhook_dispatch: true,
    max_history_items: 100,
  });

  // Load real settings from backend on mount
  useEffect(() => {
    settingsApi.getSettings()
      .then((data) => {
        if (data && typeof data === 'object') {
          setSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const data = await healthApi.getHealth();
      const latency = Math.round(performance.now() - start);
      setTestResult({
        success: true,
        latency,
        data,
      });
      addToast(`Connected to backend in ${latency}ms!`, 'success');
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message || 'Connection failed',
      });
      addToast('Cannot reach backend at this URL.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.saveSettings(settings);
      if (res && res.settings) {
        setSettings(res.settings);
      }
      addToast('Studio preferences saved persistently to local database!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to persist settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      const res = await settingsApi.resetSettings();
      if (res && res.settings) {
        setSettings(res.settings);
      }
      addToast('Settings reset to default values.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to reset settings.', 'error');
    }
  };

  if (loading) {
    return <LoadingState message="Loading studio preferences from backend..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Settings size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Studio Engine Settings & Preferences</span>
          </div>
          <span className="badge badge-mint">Persistent (storage/settings.json)</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Manage your local speech engine parameters, defaults, hardware limits, and air-gapped network policies.
          All settings persist across server reboots.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        {/* API Connection Card */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Server size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>Backend API Server</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>API Base URL</label>
              <input
                type="text"
                value={settings.api_base_url || 'http://127.0.0.1:8080'}
                onChange={(e) => handleChange('api_base_url', e.target.value)}
                placeholder="http://127.0.0.1:8080"
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Configured via <code>VITE_API_BASE_URL</code> or active server bind.
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={testConnection}
              disabled={testingConnection}
            >
              <Wifi size={16} />
              <span>{testingConnection ? 'Testing Loopback...' : 'Test Backend Connection'}</span>
            </button>

            {testResult && (
              <div
                style={{
                  padding: 14,
                  backgroundColor: testResult.success ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  border: `1px solid ${testResult.success ? 'var(--color-mint-green)' : 'var(--color-danger)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                }}
              >
                {testResult.success ? (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-mint-green)', marginBottom: 4 }}>
                      Connection Healthy ({testResult.latency}ms latency)
                    </div>
                    <div style={{ color: 'var(--color-mist-white)' }}>
                      Service: {testResult.data?.service} • Mode: {testResult.data?.mode}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-danger)', marginBottom: 4 }}>
                      Connection Failed
                    </div>
                    <div style={{ color: '#ffb3ba' }}>{testResult.error}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Inference Defaults */}
        <div className="studio-card">
          <div className="studio-card-header">
            <div className="studio-card-title">
              <Sliders size={18} style={{ color: 'var(--color-mint-green)' }} />
              <span>Default Inference Parameters</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResetDefaults}
              title="Reset to factory defaults"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Default STT Language</label>
              <select
                value={settings.default_stt_language}
                onChange={(e) => handleChange('default_stt_language', e.target.value)}
              >
                <option value="auto">Auto-Detect</option>
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="zh">Chinese (zh)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="ja">Japanese (ja)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Voice Activity Filter (VAD)</label>
              <select
                value={String(settings.default_vad_filter)}
                onChange={(e) => handleChange('default_vad_filter', e.target.value === 'true')}
              >
                <option value="true">Enabled by default (Faster, cuts silent dead-air)</option>
                <option value="false">Disabled by default (Process full audio uninterrupted)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Default TTS Speaking Rate ({settings.default_tts_rate} WPM)</label>
              <input
                type="range"
                min="100"
                max="250"
                step="5"
                value={settings.default_tts_rate}
                onChange={(e) => handleChange('default_tts_rate', Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Automatic Webhook Event Dispatch</label>
              <select
                value={String(settings.auto_webhook_dispatch)}
                onChange={(e) => handleChange('auto_webhook_dispatch', e.target.value === 'true')}
              >
                <option value="true">Enabled (Dispatch events on STT/TTS completion)</option>
                <option value="false">Disabled (Quiet offline mode)</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{ marginTop: 6 }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Preferences...' : 'Save Studio Preferences'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Offline Certification */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <ShieldCheck size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>Air-Gapped Security & Privacy Guarantees</span>
          </div>
          <span className="badge badge-mint">100% Offline Certified</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>Zero Cloud Transmission</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              All audio inference executes in local memory using CTranslate2 and native synthesis. No audio, transcript, or credentials ever leave your host.
            </p>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>SSRF Protected</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              Arbitrary external audio fetching is blocked at the backend root via <code>/transcribe/url</code> (HTTP 403 Forbidden).
            </p>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>Zero Telemetry / Trackers</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              No analytics scripts, tracking beacons, or third-party cookies are present in the frontend bundle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
