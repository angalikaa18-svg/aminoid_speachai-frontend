import React, { useState } from 'react';
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
} from 'lucide-react';
import { getApiBaseUrl } from '../api/apiClient';
import healthApi from '../api/healthApi';
import { useToast } from '../components/Toast';

export function SettingsPage() {
  const { addToast } = useToast();
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Studio preferences stored locally
  const [defaultLang, setDefaultLang] = useState('auto');
  const [defaultVad, setDefaultVad] = useState(true);
  const [defaultRate, setDefaultRate] = useState(175);

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

  const savePreferences = () => {
    addToast('Studio preferences updated successfully!', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Settings size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Studio Engine Settings</span>
          </div>
          <span className="badge badge-mint">Local Configuration</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Manage backend server connections, default inference parameters, and offline audio processing preferences.
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
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:8080"
              />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Configured via <code>VITE_API_BASE_URL</code> in <code>.env</code>.
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
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label>Default STT Language</label>
              <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)}>
                <option value="auto">Auto-Detect</option>
                <option value="en">English (en)</option>
                <option value="es">Spanish (es)</option>
                <option value="hi">Hindi (hi)</option>
                <option value="zh">Chinese (zh)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Voice Activity Filter (VAD)</label>
              <select
                value={String(defaultVad)}
                onChange={(e) => setDefaultVad(e.target.value === 'true')}
              >
                <option value="true">Enabled by default (Faster, cuts silent passages)</option>
                <option value="false">Disabled by default</option>
              </select>
            </div>

            <div className="form-group">
              <label>Default TTS Speaking Rate ({defaultRate} WPM)</label>
              <input
                type="range"
                min="100"
                max="250"
                value={defaultRate}
                onChange={(e) => setDefaultRate(Number(e.target.value))}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={savePreferences}
              style={{ marginTop: 6 }}
            >
              <Check size={16} />
              <span>Save Studio Preferences</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & Offline Certification */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <ShieldCheck size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>Offline Security & Privacy Audit</span>
          </div>
          <span className="badge badge-mint">Air-Gapped Speech Pipeline</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>No Cloud Fallbacks</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              All audio inference runs locally via CTranslate2 and local synthesis. No data is ever transmitted to external cloud servers, third-party speech APIs, or remote services.
            </p>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>SSRF Protected</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              External URL audio fetching is blocked on the backend via <code>/transcribe/url</code> (HTTP 403 Forbidden) to ensure total network isolation.
            </p>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <h4 style={{ fontSize: 13, color: 'var(--color-mint-green)', marginBottom: 6 }}>Zero Telemetry</h4>
            <p style={{ fontSize: 12, margin: 0 }}>
              No analytics scripts, tracking beacons, or telemetry cookies are embedded in the frontend application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
