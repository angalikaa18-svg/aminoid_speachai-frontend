import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Info,
  ShieldCheck,
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  ExternalLink,
  Terminal,
  Activity,
  HardDrive,
} from 'lucide-react';
import healthApi from '../api/healthApi';

export function AboutPage() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    healthApi.getHealth().then(setHealth).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Info size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>About AMINOID Local Speech AI Studio</span>
          </div>
          <span className="badge badge-mint">Version 2.0.0 (Local Engine)</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          AMINOID is a 100% offline, privacy-first Speech-to-Text and Text-to-Speech studio designed to run directly on consumer hardware.
          It completely replaces external cloud speech APIs with high-efficiency local machine learning models.
        </p>
      </div>

      {/* Live System Diagnostics */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Activity size={18} style={{ color: 'var(--color-mint-green)' }} />
            <span>Live Local Diagnostics (Backend: 127.0.0.1:8080)</span>
          </div>
          <span className="badge badge-mint">{health?.status === 'healthy' ? 'Active & Healthy' : 'Querying Engine'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>SERVICE NAME</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-mist-white)', marginTop: 4 }}>
              {health?.service || 'Local Speech Platform'}
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>OPERATING MODE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-mint-green)', marginTop: 4 }}>
              {health?.mode || '100% Offline'}
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>CLOUD PROVIDERS</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-mist-white)', marginTop: 4 }}>
              {health?.cloud_providers || 'None (Self-Hosted)'}
            </div>
          </div>

          <div style={{ padding: 14, backgroundColor: 'var(--color-forest-black)', borderRadius: 10, border: '1px solid var(--color-moss-border)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>HARDWARE DEVICE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-mist-white)', marginTop: 4 }}>
              {health?.hardware || 'Local CPU (int8)'}
            </div>
          </div>
        </div>
      </div>

      {/* Architectural Principles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="studio-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Cpu size={20} style={{ color: 'var(--color-mint-green)' }} />
            <h3 style={{ fontSize: 16, margin: 0 }}>Local Neural STT Engine</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Powered by <strong>CTranslate2</strong>, a high-performance C++ inference engine for Transformer models.
            It delivers up to 4x faster transcription than standard speech models on local CPU with int8 quantization.
            Includes integrated Silero VAD (Voice Activity Detection) to filter background silence and dead-air.
          </p>
        </div>

        <div className="studio-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Layers size={20} style={{ color: 'var(--color-mint-green)' }} />
            <h3 style={{ fontSize: 16, margin: 0 }}>Offline SAPI5 / Piper (TTS Engine)</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Text synthesis utilizes local Windows SAPI5 tokens and lightweight offline neural voices.
            Features customizable speaking rate, pitch modulation, and direct WAV audio streaming with zero network latency.
          </p>
        </div>

        <div className="studio-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Zap size={20} style={{ color: 'var(--color-mint-green)' }} />
            <h3 style={{ fontSize: 16, margin: 0 }}>CallZenza Telephony Integration</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Provides immediate REST API endpoints for CallZenza voice calling agents.
            Telephony agents can stream caller audio, obtain word-accurate transcripts, and synthesize voice responses
            without external speech billing or rate limits.
          </p>
        </div>

        <div className="studio-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-mint-green)' }} />
            <h3 style={{ fontSize: 16, margin: 0 }}>Privacy & Air-Gapped Operation</h3>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            No audio bytes, text transcripts, or telemetry ever leave your device.
            The studio operates cleanly in secure environments, hospitals, legal chambers, and offline edge systems.
          </p>
        </div>
      </div>

      {/* Specifications Card */}
      <div className="studio-card">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>System Specifications</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="specs-table">
            <tbody>
              <tr>
                <td style={{ width: 220, color: 'var(--color-text-secondary)' }}>Frontend Architecture</td>
                <td>React 18, Vite 6, React Router 6, Axios, Lucide Icons, Neural Green Theme</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)' }}>Backend Framework</td>
                <td>FastAPI, Uvicorn, Python 3.13 (CTranslate2 & SAPI5)</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)' }}>Default Port Binding</td>
                <td>Frontend: <code>http://localhost:5173</code> • Backend: <code>http://127.0.0.1:8080</code></td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)' }}>Supported Audio Formats</td>
                <td>WAV, MP3, FLAC, OGG, M4A, WebM, AAC, WMA</td>
              </tr>
              <tr>
                <td style={{ color: 'var(--color-text-secondary)' }}>Audio Processing</td>
                <td>Native Web Audio API (Browser Waveform Rendering) & FFmpeg (Backend Normalization)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <NavLink to="/stt" className="btn btn-primary btn-sm">
            <span>Launch STT Studio</span>
          </NavLink>
          <NavLink to="/tts" className="btn btn-secondary btn-sm">
            <span>Launch TTS Studio</span>
          </NavLink>
          <NavLink to="/webhooks" className="btn btn-secondary btn-sm">
            <span>View CallZenza Code</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
