/**
 * Developer Integration & Webhook Studio Page.
 * Dynamic hub for connecting external applications, AI agents, CRMs, and telephony bots
 * to the local AMINOID Speech Engine (100% offline STT, TTS & Webhooks).
 */

import React, { useState } from 'react';
import {
  Webhook,
  Zap,
  Radio,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Key,
  RefreshCw,
  Play,
  Trash2,
  Shield,
  Plus,
  Search,
  Filter,
  Server,
  Clock,
  ArrowUpRight,
  Globe,
  Activity,
  CheckCircle2,
  XCircle,
  FileAudio,
  Volume2,
  Cpu,
  Layers,
  Terminal,
  ExternalLink
} from 'lucide-react';

import { useIntegrations } from '../hooks/useIntegrations';
import { integrationApi } from '../api/integrationApi';
import { useToast } from '../components/Toast';

export function WebhooksPage() {
  const { addToast } = useToast();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    overview,
    platforms,
    apiKeys,
    webhooks,
    deliveries,
    voices,
    urlMode,
    setUrlMode,
    customBaseUrl,
    setCustomBaseUrl,
    createdKeyData,
    setCreatedKeyData,
    deliveryFilter,
    setDeliveryFilter,
    refreshAll,
    refreshDeliveries,
    getActiveBaseUrl,
    getSnippets
  } = useIntegrations();

  // Copy helper
  const [copiedKey, setCopiedKey] = useState(null);
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    addToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // Tab 2: Connect Platform State & Handlers
  // ---------------------------------------------------------------------------
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [platformForm, setPlatformForm] = useState({
    name: '',
    platform_type: 'voice_agent',
    description: '',
    base_url: '',
    webhook_url: '',
    auth_method: 'none',
    api_key: '',
    secret_key: '',
    timeout_sec: 30
  });
  const [isSubmittingPlatform, setIsSubmittingPlatform] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [isPinging, setIsPinging] = useState(false);

  const handleCreatePlatform = async (e) => {
    e.preventDefault();
    if (!platformForm.name.trim()) {
      addToast('Platform name is required', 'error');
      return;
    }
    setIsSubmittingPlatform(true);
    try {
      await integrationApi.createPlatform(platformForm);
      addToast(`Platform '${platformForm.name}' connected successfully!`, 'success');
      setShowPlatformModal(false);
      setPlatformForm({
        name: '',
        platform_type: 'voice_agent',
        description: '',
        base_url: '',
        webhook_url: '',
        auth_method: 'none',
        api_key: '',
        secret_key: '',
        timeout_sec: 30
      });
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to register platform', 'error');
    } finally {
      setIsSubmittingPlatform(false);
    }
  };

  const handleDeletePlatform = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete platform '${name}'?`)) return;
    try {
      await integrationApi.deletePlatform(id);
      addToast(`Platform '${name}' removed.`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to remove platform', 'error');
    }
  };

  const handleTestPlatform = async (id, name) => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await integrationApi.testPlatformConnection(id);
      setPingResult({ ...res, platformName: name });
      if (res.success) {
        addToast(`Successfully reached ${name} (${res.http_status}) in ${res.duration_ms}ms`, 'success');
      } else {
        addToast(`Could not connect to ${name}: ${res.error || res.message}`, 'error');
      }
    } catch (err) {
      setPingResult({ success: false, error: err.message, platformName: name });
      addToast(err.message || 'Ping failed', 'error');
    } finally {
      setIsPinging(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 3: API Key Generation State & Handlers
  // ---------------------------------------------------------------------------
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyForm, setKeyForm] = useState({
    name: '',
    permissions: ['stt:transcribe', 'tts:generate', 'voices:read', 'audio:read'],
    expires_in_days: ''
  });
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const handleGenerateKey = async (e) => {
    e.preventDefault();
    if (!keyForm.name.trim()) {
      addToast('Key name is required', 'error');
      return;
    }
    setIsGeneratingKey(true);
    try {
      const res = await integrationApi.createApiKey({
        name: keyForm.name,
        permissions: keyForm.permissions,
        expires_in_days: keyForm.expires_in_days ? parseInt(keyForm.expires_in_days, 10) : null
      });
      setCreatedKeyData(res);
      setShowKeyModal(false);
      setKeyForm({
        name: '',
        permissions: ['stt:transcribe', 'tts:generate', 'voices:read', 'audio:read'],
        expires_in_days: ''
      });
      addToast('API key generated successfully!', 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to generate API key', 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleToggleKey = async (keyId, currentStatus) => {
    try {
      await integrationApi.toggleApiKey(keyId, !currentStatus);
      addToast(`API key ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to update key status', 'error');
    }
  };

  const handleRevokeKey = async (keyId, name) => {
    if (!window.confirm(`Permanently revoke API key '${name}'? External clients using it will be blocked immediately.`)) return;
    try {
      await integrationApi.revokeApiKey(keyId);
      addToast(`API key '${name}' revoked permanently`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to revoke key', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 4: Webhook Subscriptions State & Handlers
  // ---------------------------------------------------------------------------
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    name: '',
    target_url: '',
    events: ['stt.completed', 'tts.completed'],
    secret_key: '',
    retry_count: 3,
    timeout_sec: 10
  });
  const [isSubmittingWebhook, setIsSubmittingWebhook] = useState(false);

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!webhookForm.name.trim() || !webhookForm.target_url.trim()) {
      addToast('Name and target URL are required', 'error');
      return;
    }
    if (webhookForm.events.length === 0) {
      addToast('Select at least one event to subscribe to', 'error');
      return;
    }
    setIsSubmittingWebhook(true);
    try {
      await integrationApi.createWebhookSubscription(webhookForm);
      addToast(`Webhook subscription '${webhookForm.name}' created!`, 'success');
      setShowWebhookModal(false);
      setWebhookForm({
        name: '',
        target_url: '',
        events: ['stt.completed', 'tts.completed'],
        secret_key: '',
        retry_count: 3,
        timeout_sec: 10
      });
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to create subscription', 'error');
    } finally {
      setIsSubmittingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id, name) => {
    if (!window.confirm(`Delete webhook subscription '${name}'?`)) return;
    try {
      await integrationApi.deleteWebhookSubscription(id);
      addToast(`Webhook subscription '${name}' deleted`, 'success');
      refreshAll();
    } catch (err) {
      addToast(err.message || 'Failed to delete subscription', 'error');
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 5: Delivery Monitor Modal State
  // ---------------------------------------------------------------------------
  const [inspectDelivery, setInspectDelivery] = useState(null);
  const [isRetryingDelivery, setIsRetryingDelivery] = useState(false);

  const handleRetryDelivery = async (deliveryId) => {
    setIsRetryingDelivery(true);
    try {
      const res = await integrationApi.retryDelivery(deliveryId);
      if (res.success) {
        addToast(`Webhook re-delivered successfully! HTTP ${res.result?.http_status}`, 'success');
      } else {
        addToast(`Webhook retry failed: ${res.result?.error || 'HTTP ' + res.result?.http_status}`, 'error');
      }
      refreshDeliveries(deliveryFilter);
    } catch (err) {
      addToast(err.message || 'Retry delivery failed', 'error');
    } finally {
      setIsRetryingDelivery(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab 6: Live Testing & Code Generator State
  // ---------------------------------------------------------------------------
  const [codeLang, setCodeLang] = useState('python'); // 'python' | 'javascript' | 'curl'
  const [testSTTFile, setTestSTTFile] = useState(null);
  const [testSTTLang, setTestSTTLang] = useState('auto');
  const [sttTestResult, setSttTestResult] = useState(null);
  const [isTestingSTT, setIsTestingSTT] = useState(false);

  const [testTTSText, setTestTTSText] = useState('Welcome to AMINOID AI. All speech processing is running 100% offline.');
  const [testTTSVoice, setTestTTSVoice] = useState('');
  const [ttsTestResult, setTtsTestResult] = useState(null);
  const [isTestingTTS, setIsTestingTTS] = useState(false);

  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [testWebhookSecret, setTestWebhookSecret] = useState('whsec_demo_secret_key');
  const [webhookTestResult, setWebhookTestResult] = useState(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  const handleRunSTTTest = async (e) => {
    e.preventDefault();
    if (!testSTTFile) {
      addToast('Please select an audio file to test STT', 'error');
      return;
    }
    setIsTestingSTT(true);
    setSttTestResult(null);
    try {
      const formData = new FormData();
      formData.append('audio', testSTTFile);
      if (testSTTLang && testSTTLang !== 'auto') {
        formData.append('language', testSTTLang);
      }
      formData.append('vad_filter', 'true');

      const res = await integrationApi.testSTT(formData);
      setSttTestResult(res);
      addToast(`STT completed in ${res.processing_time}s!`, 'success');
    } catch (err) {
      setSttTestResult({ error: err.message });
      addToast(err.message || 'STT test failed', 'error');
    } finally {
      setIsTestingSTT(false);
    }
  };

  const handleRunTTSTest = async (e) => {
    e.preventDefault();
    if (!testTTSText.trim()) {
      addToast('Please enter text to synthesize', 'error');
      return;
    }
    setIsTestingTTS(true);
    setTtsTestResult(null);
    try {
      const res = await integrationApi.testTTS({
        text: testTTSText,
        voice_id: testTTSVoice || undefined,
        rate: 175
      });
      setTtsTestResult(res);
      addToast(`Audio generated in ${res.processing_time}s (${res.duration}s speech)`, 'success');
    } catch (err) {
      setTtsTestResult({ error: err.message });
      addToast(err.message || 'TTS test failed', 'error');
    } finally {
      setIsTestingTTS(false);
    }
  };

  const handleRunWebhookTest = async (e) => {
    e.preventDefault();
    if (!testWebhookUrl.trim()) {
      addToast('Please enter destination webhook URL', 'error');
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const res = await integrationApi.testWebhook({
        target_url: testWebhookUrl,
        secret_key: testWebhookSecret,
        event_name: 'stt.completed',
        sample_payload: {
          request_id: 'test_req_8921',
          text: 'This is a live test speech transcription dispatched by AMINOID.',
          language: 'en',
          duration: 3.4
        }
      });
      setWebhookTestResult(res);
      if (res.success) {
        addToast(`Webhook received HTTP ${res.http_status} in ${res.duration_ms}ms!`, 'success');
      } else {
        addToast(`Webhook failed: ${res.error || 'HTTP ' + res.http_status}`, 'error');
      }
    } catch (err) {
      setWebhookTestResult({ success: false, error: err.message });
      addToast(err.message || 'Webhook test failed', 'error');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Get active snippets
  const snippets = getSnippets(codeLang);

  return (
    <div className="webhooks-container">
      {/* Top Header Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Webhook size={24} style={{ color: 'var(--color-mint-green)' }} />
            <span>Developer Integration & Webhook Studio</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-mint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Activity size={13} />
              {overview?.speech_engine_status || 'Engine Ready'}
            </span>
            <button
              type="button"
              className="btn-secondary"
              onClick={refreshAll}
              title="Refresh all metrics"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Connect external applications, AI agents, CRM platforms, and telephony systems directly to your local offline AMINOID speech engine via authenticated REST APIs and HMAC-signed Webhook events.
        </p>

        {/* Network Topology Bar */}
        <div className="network-bar" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={16} style={{ color: 'var(--color-mint-green)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Localhost:</span>
              <span className="network-pill">{overview?.network?.localhost_url || 'http://localhost:8080'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>LAN Address:</span>
              <span className="network-pill" style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                {overview?.network?.lan_url || 'http://127.0.0.1:8080'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={13} style={{ color: 'var(--color-mint-green)' }} />
            Air-Gapped & Offline Protected
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="integration-tabs">
        <button
          type="button"
          className={`tab-pill ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={15} />
          Overview & Metrics
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'platforms' ? 'active' : ''}`}
          onClick={() => setActiveTab('platforms')}
        >
          <Globe size={15} />
          Connect Platform ({platforms.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'apikeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('apikeys')}
        >
          <Key size={15} />
          API Keys & Access ({apiKeys.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'webhooks' ? 'active' : ''}`}
          onClick={() => setActiveTab('webhooks')}
        >
          <Radio size={15} />
          Webhook Subscriptions ({webhooks.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'deliveries' ? 'active' : ''}`}
          onClick={() => setActiveTab('deliveries')}
        >
          <Clock size={15} />
          Delivery Monitor ({deliveries.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          <Terminal size={15} />
          Live Testing & Code Samples
        </button>
      </div>

      {/* =====================================================================
          TAB 1: OVERVIEW & SYSTEM METRICS
          ===================================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key Metrics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">API Requests Today</span>
                <Activity size={18} style={{ color: 'var(--color-mint-green)' }} />
              </div>
              <span className="stat-value">{overview?.statistics?.api_requests_today ?? 0}</span>
              <span className="stat-sub">
                STT: {overview?.statistics?.stt_requests ?? 0} | TTS: {overview?.statistics?.tts_requests ?? 0}
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Success Rate</span>
                <CheckCircle2 size={18} style={{ color: '#10b981' }} />
              </div>
              <span className="stat-value" style={{ color: '#10b981' }}>
                {overview?.statistics?.api_requests_today > 0
                  ? `${Math.round(((overview.statistics.successful_requests || 0) / overview.statistics.api_requests_today) * 100)}%`
                  : '100%'}
              </span>
              <span className="stat-sub">
                {overview?.statistics?.successful_requests ?? 0} ok / {overview?.statistics?.failed_requests ?? 0} failed
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Avg Processing Time</span>
                <Clock size={18} style={{ color: '#38bdf8' }} />
              </div>
              <span className="stat-value" style={{ color: '#38bdf8' }}>
                {overview?.statistics?.avg_processing_time_ms ? `${Math.round(overview.statistics.avg_processing_time_ms)}ms` : '0ms'}
              </span>
              <span className="stat-sub">Local hardware execution</span>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-label">Webhook Deliveries</span>
                <Radio size={18} style={{ color: '#eab308' }} />
              </div>
              <span className="stat-value" style={{ color: '#eab308' }}>
                {overview?.statistics?.webhook_deliveries_today ?? 0}
              </span>
              <span className="stat-sub">
                {overview?.statistics?.webhook_successful_today ?? 0} delivered / {overview?.statistics?.webhook_failed_today ?? 0} errors
              </span>
            </div>
          </div>

          {/* Engine Status Grid */}
          <div className="studio-card">
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--color-mist-white)' }}>
              Speech Engine & Model Availability
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ background: '#0A1411', border: '1px solid var(--color-moss-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-mint-green)', textTransform: 'uppercase' }}>
                    Speech-to-Text Model
                  </span>
                  <span className="badge-active">Online</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                  {overview?.stt_model_status?.model_name || 'Faster-Whisper Tiny'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  Device: {overview?.stt_model_status?.device?.toUpperCase() || 'CPU'} | Offline Transcription
                </div>
              </div>

              <div style={{ background: '#0A1411', border: '1px solid var(--color-moss-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-mint-green)', textTransform: 'uppercase' }}>
                    Text-to-Speech Engine
                  </span>
                  <span className="badge-active">Online</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                  {overview?.tts_model_status?.engine_name?.toUpperCase() || 'SAPI5 / Piper Local'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {voices.length} System & Neural Voices Ready
                </div>
              </div>

              <div style={{ background: '#0A1411', border: '1px solid var(--color-moss-border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                    Active Integrations
                  </span>
                  <span className="badge-mint">{platforms.length} Platforms</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                  {webhooks.length} Webhook Subscriptions
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {apiKeys.length} Developer API Keys Active
                </div>
              </div>
            </div>
          </div>

          {/* Supported Events Reference */}
          <div className="studio-card">
            <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12, color: 'var(--color-mist-white)' }}>
              Real Webhook Event Catalog
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 0, marginBottom: 16 }}>
              External platforms can subscribe to any of the following events. Every webhook payload is signed with HMAC-SHA256.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="specs-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Category</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview?.supported_events || []).map((evt) => (
                    <tr key={evt.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)', fontWeight: 600 }}>
                        {evt.id}
                      </td>
                      <td>
                        <span className="endpoint-badge get">{evt.category}</span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)' }}>{evt.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CONNECT PLATFORM
          ===================================================================== */}
      {activeTab === 'platforms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: 0, color: 'var(--color-mist-white)' }}>Connected External Platforms</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Configure and manage third-party voice bots, AI agents, CRMs, and telephony engines.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setShowPlatformModal(true)}>
              <Plus size={16} />
              Connect Platform
            </button>
          </div>

          {/* Platform List */}
          {platforms.length === 0 ? (
            <div className="studio-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Globe size={42} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: 0, fontSize: 16, color: 'var(--color-mist-white)' }}>No Platforms Connected Yet</h4>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 460, margin: '8px auto 20px' }}>
                Connect your voice agent, CRM (Salesforce, HubSpot), telephony bot (Asterisk, Twilio, CallZenza), or custom application.
              </p>
              <button type="button" className="btn-primary" onClick={() => setShowPlatformModal(true)}>
                <Plus size={15} />
                Connect Your First Platform
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {platforms.map((plat) => (
                <div key={plat.id} className="platform-card">
                  <div className="platform-header">
                    <div className="platform-title-group">
                      <div className="platform-icon">
                        <Zap size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                          {plat.name}
                        </div>
                        <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-mint-green)', fontWeight: 600 }}>
                          {plat.platform_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className={plat.is_active ? 'badge-active' : 'badge-inactive'}>
                      {plat.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {plat.description && (
                    <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: 0 }}>
                      {plat.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {plat.base_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: 'var(--color-mist-white)' }}>Base:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plat.base_url}</span>
                      </div>
                    )}
                    {plat.webhook_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: 'var(--color-mist-white)' }}>Webhook:</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plat.webhook_url}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}>
                      <span style={{ color: 'var(--color-mist-white)' }}>Auth:</span>
                      <span style={{ textTransform: 'capitalize' }}>{plat.auth_method}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 12, borderTop: '1px solid rgba(49, 86, 71, 0.4)' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: 12, padding: '5px 10px' }}
                      onClick={() => handleTestPlatform(plat.id, plat.name)}
                      disabled={isPinging}
                    >
                      <Activity size={13} />
                      Ping Connection
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDeletePlatform(plat.id, plat.name)}
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ping Result Banner */}
          {pingResult && (
            <div className={`notice-box ${pingResult.success ? 'info' : 'warning'}`}>
              {pingResult.success ? <CheckCircle2 size={18} style={{ color: '#10b981' }} /> : <AlertTriangle size={18} />}
              <div>
                <strong>Connection Test for {pingResult.platformName}:</strong>{' '}
                {pingResult.message || (pingResult.success ? `Connected in ${pingResult.duration_ms}ms` : pingResult.error)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: API KEYS & ACCESS
          ===================================================================== */}
      {activeTab === 'apikeys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: 0, color: 'var(--color-mist-white)' }}>Developer API Keys</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Generate cryptographically secure API keys to authenticate external STT, TTS, and voice catalog requests.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setShowKeyModal(true)}>
              <Plus size={16} />
              Generate API Key
            </button>
          </div>

          {/* Newly Created Key Alert Box (Shows raw key once) */}
          {createdKeyData && (
            <div className="callzenza-banner" style={{ border: '1px solid var(--color-mint-green)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={22} style={{ color: 'var(--color-mint-green)' }} />
                <h4 style={{ margin: 0, fontSize: 16, color: 'var(--color-mist-white)' }}>
                  New API Key Created: {createdKeyData.key_record?.name}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#fca5a5' }}>
                ⚠️ Save this key now! For security reasons, the full API key is hashed with SHA-256 and will never be shown again.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#0A1411', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-mint-green)' }}>
                <code style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)', flex: 1, wordBreak: 'break-all' }}>
                  {createdKeyData.api_key}
                </code>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  onClick={() => copyToClipboard(createdKeyData.api_key, 'new_key')}
                >
                  {copiedKey === 'new_key' ? <Check size={14} /> : <Copy size={14} />}
                  Copy Key
                </button>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ alignSelf: 'flex-start', fontSize: 12 }}
                onClick={() => setCreatedKeyData(null)}
              >
                I have securely saved this key
              </button>
            </div>
          )}

          {/* API Keys Table */}
          <div className="studio-card">
            {apiKeys.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <Key size={38} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 12px' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>No API Keys Created Yet</h4>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '6px 0 16px' }}>
                  Generate an API key to allow external voice bots, Python scripts, or CRMs to call your local speech services.
                </p>
                <button type="button" className="btn-primary" onClick={() => setShowKeyModal(true)}>
                  <Plus size={14} />
                  Generate API Key
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="specs-table">
                  <thead>
                    <tr>
                      <th>Key Name</th>
                      <th>Prefix</th>
                      <th>Permissions</th>
                      <th>Created</th>
                      <th>Last Used</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((k) => (
                      <tr key={k.id}>
                        <td style={{ fontWeight: 600, color: 'var(--color-mist-white)' }}>{k.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)' }}>
                          {k.key_prefix}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(k.permissions || []).map((p) => (
                              <span key={p} className="endpoint-badge get" style={{ fontSize: 10 }}>
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleTimeString() : 'Never'}
                        </td>
                        <td>
                          <span className={k.is_active ? 'badge-active' : 'badge-inactive'}>
                            {k.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleToggleKey(k.id, k.is_active)}
                            >
                              {k.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => handleRevokeKey(k.id, k.name)}
                              title="Permanently revoke key"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: WEBHOOK SUBSCRIPTIONS
          ===================================================================== */}
      {activeTab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: 0, color: 'var(--color-mist-white)' }}>Webhook Event Subscriptions</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Subscribe external endpoints to speech events. Dispatched asynchronously with HMAC-SHA256 signatures.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={() => setShowWebhookModal(true)}>
              <Plus size={16} />
              New Webhook Subscription
            </button>
          </div>

          {/* Subscriptions List */}
          {webhooks.length === 0 ? (
            <div className="studio-card" style={{ textAlign: 'center', padding: '40px 16px' }}>
              <Radio size={40} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 12px' }} />
              <h4 style={{ margin: 0, fontSize: 16, color: 'var(--color-mist-white)' }}>No Webhooks Subscribed</h4>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', maxWidth: 460, margin: '6px auto 16px' }}>
                Add a destination URL to receive instant notification when speech transcription or synthesis completes.
              </p>
              <button type="button" className="btn-primary" onClick={() => setShowWebhookModal(true)}>
                <Plus size={14} />
                Create Subscription
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {webhooks.map((sub) => (
                <div key={sub.id} className="platform-card">
                  <div className="platform-header">
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-mist-white)' }}>
                        {sub.name}
                      </div>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-mint-green)', marginTop: 2 }}>
                        {sub.target_url}
                      </div>
                    </div>
                    <span className={sub.is_active ? 'badge-active' : 'badge-inactive'}>
                      {sub.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Subscribed Events Badges */}
                  <div>
                    <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      Subscribed Events:
                    </span>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {(sub.events || []).map((e) => (
                        <span key={e} className="endpoint-badge post" style={{ fontSize: 11 }}>
                          {e}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', gap: 16 }}>
                    <span>Secret: <code style={{ color: 'var(--color-mist-white)' }}>{sub.secret_key_preview || 'whsec_***'}</code></span>
                    <span>Retries: <strong style={{ color: 'var(--color-mist-white)' }}>{sub.retry_count || 3}x</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4, paddingTop: 10, borderTop: '1px solid rgba(49, 86, 71, 0.4)' }}>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleDeleteWebhook(sub.id, sub.name)}
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: DELIVERY MONITOR
          ===================================================================== */}
      {activeTab === 'deliveries' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: 0, color: 'var(--color-mist-white)' }}>Webhook Delivery Monitor</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Real-time delivery logs, HTTP response codes, latencies, and payload inspector.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                className="form-select"
                style={{ fontSize: 12, padding: '6px 12px' }}
                value={deliveryFilter.status}
                onChange={(e) => {
                  const newF = { ...deliveryFilter, status: e.target.value };
                  setDeliveryFilter(newF);
                  refreshDeliveries(newF);
                }}
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={() => refreshDeliveries(deliveryFilter)}
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>

          <div className="studio-card">
            {deliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                <Clock size={36} style={{ color: 'var(--color-text-secondary)', margin: '0 auto 12px' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>No Delivery Records Found</h4>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>
                  When events occur or test webhooks are sent, their delivery attempts will appear here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="specs-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Destination URL</th>
                      <th>HTTP Status</th>
                      <th>Duration</th>
                      <th>Attempt</th>
                      <th>Timestamp</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map((del) => (
                      <tr key={del.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-mint-green)' }}>
                          {del.event_name}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {del.target_url}
                        </td>
                        <td>
                          {del.status === 'success' ? (
                            <span className="badge-success">HTTP {del.http_status || 200}</span>
                          ) : (
                            <span className="badge-failed">
                              {del.http_status ? `HTTP ${del.http_status}` : 'Err / Timeout'}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {del.duration_ms ? `${Math.round(del.duration_ms)}ms` : '—'}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          #{del.attempt_count || 1}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {del.created_at ? new Date(del.created_at).toLocaleTimeString() : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              onClick={() => setInspectDelivery(del)}
                            >
                              Inspect
                            </button>
                            {del.status === 'failed' && (
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '4px 8px', fontSize: 11 }}
                                onClick={() => handleRetryDelivery(del.id)}
                                disabled={isRetryingDelivery}
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: LIVE TESTING & DYNAMIC CODE GENERATOR
          ===================================================================== */}
      {activeTab === 'testing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Base URL & Topology Mode Switcher */}
          <div className="studio-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--color-mist-white)' }}>
                  Interactive Testing Console & Code Generator
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Test real speech endpoints directly and generate drop-in code snippets for external systems.
                </p>
              </div>
              {/* Target Address Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Target URL:</span>
                <select
                  className="form-select"
                  style={{ fontSize: 12, padding: '5px 10px' }}
                  value={urlMode}
                  onChange={(e) => setUrlMode(e.target.value)}
                >
                  <option value="localhost">Localhost ({overview?.network?.localhost_url || 'http://localhost:8080'})</option>
                  <option value="lan">LAN IP ({overview?.network?.lan_url || 'http://192.168.1.2:8080'})</option>
                  <option value="custom">Public Server / Tunnel</option>
                </select>
              </div>
            </div>

            {urlMode === 'custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, background: '#0A1411', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <Globe size={16} style={{ color: 'var(--color-mint-green)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="https://speech.yourdomain.com or https://tunnel.ngrok.io"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Test Sections Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* 1. Test STT */}
            <div className="studio-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <FileAudio size={18} style={{ color: 'var(--color-mint-green)' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>Test Speech-to-Text (STT)</h4>
              </div>
              <form onSubmit={handleRunSTTTest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>Select Audio File (WAV, MP3, M4A, FLAC, WebM)</label>
                  <input
                    type="file"
                    accept="audio/*"
                    className="form-input"
                    onChange={(e) => setTestSTTFile(e.target.files?.[0] || null)}
                  />
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select
                    className="form-select"
                    value={testSTTLang}
                    onChange={(e) => setTestSTTLang(e.target.value)}
                  >
                    <option value="auto">Auto-Detect</option>
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={isTestingSTT}>
                  <Send size={14} />
                  {isTestingSTT ? 'Transcribing...' : 'Run Real STT Inference'}
                </button>
              </form>

              {sttTestResult && (
                <div style={{ marginTop: 14, background: '#0A1411', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-moss-border)' }}>
                  {sttTestResult.error ? (
                    <div style={{ color: '#ef4444', fontSize: 13 }}>❌ {sttTestResult.error}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-mint-green)' }}>
                        <span>Detected: {sttTestResult.language?.toUpperCase()}</span>
                        <span>{sttTestResult.duration}s audio in {sttTestResult.processing_time}s</span>
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-mist-white)', fontWeight: 600 }}>
                        "{sttTestResult.text}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Test TTS */}
            <div className="studio-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Volume2 size={18} style={{ color: 'var(--color-mint-green)' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>Test Text-to-Speech (TTS)</h4>
              </div>
              <form onSubmit={handleRunTTSTest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>Text to Synthesize</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={testTTSText}
                    onChange={(e) => setTestTTSText(e.target.value)}
                    placeholder="Enter speech text..."
                  />
                </div>
                <div className="form-group">
                  <label>Voice Selection</label>
                  <select
                    className="form-select"
                    value={testTTSVoice}
                    onChange={(e) => setTestTTSVoice(e.target.value)}
                  >
                    <option value="">Default Voice</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} ({v.language})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary" disabled={isTestingTTS}>
                  <Volume2 size={14} />
                  {isTestingTTS ? 'Synthesizing...' : 'Generate Real Audio'}
                </button>
              </form>

              {ttsTestResult && (
                <div style={{ marginTop: 14, background: '#0A1411', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-moss-border)' }}>
                  {ttsTestResult.error ? (
                    <div style={{ color: '#ef4444', fontSize: 13 }}>❌ {ttsTestResult.error}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-mint-green)' }}>
                        <span>Voice: {ttsTestResult.voice_used}</span>
                        <span>{ttsTestResult.duration}s in {ttsTestResult.processing_time}s</span>
                      </div>
                      <audio controls src={ttsTestResult.full_audio_url} style={{ width: '100%', height: 36 }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Test Webhook Dispatch */}
            <div className="studio-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Radio size={18} style={{ color: 'var(--color-mint-green)' }} />
                <h4 style={{ margin: 0, fontSize: 15, color: 'var(--color-mist-white)' }}>Test Webhook Dispatch</h4>
              </div>
              <form onSubmit={handleRunWebhookTest} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label>Destination Webhook URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://webhook.site/... or https://api.crm.com/wh"
                    value={testWebhookUrl}
                    onChange={(e) => setTestWebhookUrl(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Secret Key (for HMAC Signature)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={testWebhookSecret}
                    onChange={(e) => setTestWebhookSecret(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={isTestingWebhook}>
                  <Send size={14} />
                  {isTestingWebhook ? 'Sending Event...' : 'Send Live Test Webhook'}
                </button>
              </form>

              {webhookTestResult && (
                <div style={{ marginTop: 14, background: '#0A1411', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-moss-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
                    {webhookTestResult.success ? (
                      <span className="badge-success">HTTP {webhookTestResult.http_status} Success</span>
                    ) : (
                      <span className="badge-failed">Failed: {webhookTestResult.error || `HTTP ${webhookTestResult.http_status}`}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                      {webhookTestResult.duration_ms}ms
                    </span>
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                    Signature: {webhookTestResult.signature}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Code Generator Section */}
          <div className="studio-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, margin: 0, color: 'var(--color-mist-white)' }}>
                  Dynamic Integration Code Generator
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                  Pre-configured code samples with your real server address and authentication headers.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['python', 'nodejs', 'curl'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    className={`tab-pill ${codeLang === lang ? 'active' : ''}`}
                    onClick={() => setCodeLang(lang)}
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    {lang === 'python' ? 'Python' : lang === 'nodejs' ? 'Node.js' : 'cURL'}
                  </button>
                ))}
              </div>
            </div>

            {/* STT Code Snippet */}
            <div className="code-block-container" style={{ marginBottom: 16 }}>
              <div className="code-header">
                <span className="code-lang">1. Speech-to-Text (STT) Integration</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  onClick={() => copyToClipboard(snippets.stt, 'stt_code')}
                >
                  {copiedKey === 'stt_code' ? <Check size={12} /> : <Copy size={12} />}
                  Copy Code
                </button>
              </div>
              <pre className="code-content">{snippets.stt}</pre>
            </div>

            {/* TTS Code Snippet */}
            <div className="code-block-container" style={{ marginBottom: 16 }}>
              <div className="code-header">
                <span className="code-lang">2. Text-to-Speech (TTS) Integration</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  onClick={() => copyToClipboard(snippets.tts, 'tts_code')}
                >
                  {copiedKey === 'tts_code' ? <Check size={12} /> : <Copy size={12} />}
                  Copy Code
                </button>
              </div>
              <pre className="code-content">{snippets.tts}</pre>
            </div>

            {/* Webhook Signature Verification Code Snippet */}
            <div className="code-block-container">
              <div className="code-header">
                <span className="code-lang">3. Webhook HMAC-SHA256 Signature Verification</span>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '3px 8px', fontSize: 11 }}
                  onClick={() => copyToClipboard(snippets.webhook_verify, 'wh_code')}
                >
                  {copiedKey === 'wh_code' ? <Check size={12} /> : <Copy size={12} />}
                  Copy Code
                </button>
              </div>
              <pre className="code-content">{snippets.webhook_verify}</pre>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CONNECT PLATFORM
          ===================================================================== */}
      {showPlatformModal && (
        <div className="modal-overlay" onClick={() => setShowPlatformModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Globe size={20} style={{ color: 'var(--color-mint-green)' }} />
                <span>Connect External Platform</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowPlatformModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePlatform} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Integration Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CallZenza Voice Bot, HubSpot CRM, Twilio IVR"
                  value={platformForm.name}
                  onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Platform Type</label>
                  <select
                    className="form-select"
                    value={platformForm.platform_type}
                    onChange={(e) => setPlatformForm({ ...platformForm, platform_type: e.target.value })}
                  >
                    <option value="voice_agent">AI Voice Agent</option>
                    <option value="custom_app">Custom Application</option>
                    <option value="crm">CRM Platform</option>
                    <option value="chatbot">Chatbot</option>
                    <option value="telephony">Telephony Platform</option>
                    <option value="automation">Automation Platform (n8n, Zapier)</option>
                    <option value="website">Website / Web App</option>
                    <option value="other">Other Platform</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Authentication Method</label>
                  <select
                    className="form-select"
                    value={platformForm.auth_method}
                    onChange={(e) => setPlatformForm({ ...platformForm, auth_method: e.target.value })}
                  >
                    <option value="none">None (Open/Internal)</option>
                    <option value="api_key">API Key (X-API-Key)</option>
                    <option value="bearer_token">Bearer Token</option>
                    <option value="hmac_signature">HMAC Signature</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Platform Base URL (for API calls/ping)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://api.yourplatform.com"
                  value={platformForm.base_url}
                  onChange={(e) => setPlatformForm({ ...platformForm, base_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Platform Webhook URL (for event dispatch)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://api.yourplatform.com/webhooks/speech"
                  value={platformForm.webhook_url}
                  onChange={(e) => setPlatformForm({ ...platformForm, webhook_url: e.target.value })}
                />
              </div>

              {platformForm.auth_method !== 'none' && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Platform API Key</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Outbound API Key"
                      value={platformForm.api_key}
                      onChange={(e) => setPlatformForm({ ...platformForm, api_key: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Platform Secret Key</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Outbound Secret Key"
                      value={platformForm.secret_key}
                      onChange={(e) => setPlatformForm({ ...platformForm, secret_key: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Description / Notes</label>
                <textarea
                  rows={2}
                  className="form-textarea"
                  placeholder="Notes about this external system..."
                  value={platformForm.description}
                  onChange={(e) => setPlatformForm({ ...platformForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPlatformModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingPlatform}
                >
                  {isSubmittingPlatform ? 'Saving...' : 'Connect Platform'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: GENERATE API KEY
          ===================================================================== */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Key size={20} style={{ color: 'var(--color-mint-green)' }} />
                <span>Generate Developer API Key</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowKeyModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateKey} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Key Name / Client Description *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CallZenza Bot, Production IVR, Mobile Client"
                  value={keyForm.name}
                  onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Expiration (Days, leave empty for perpetual)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 30, 90, 365"
                  value={keyForm.expires_in_days}
                  onChange={(e) => setKeyForm({ ...keyForm, expires_in_days: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Permissions / Scopes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { id: 'stt:transcribe', label: 'Speech-to-Text (/api/v1/integrations/stt/transcribe)' },
                    { id: 'tts:generate', label: 'Text-to-Speech (/api/v1/integrations/tts/generate)' },
                    { id: 'voices:read', label: 'Voice Catalog Access (/api/v1/integrations/voices)' },
                    { id: 'audio:read', label: 'Audio Stream & File Retrieval' },
                    { id: 'webhooks:manage', label: 'Webhook Subscription Management' }
                  ].map((p) => {
                    const isChecked = keyForm.permissions.includes(p.id);
                    return (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newPerms = e.target.checked
                              ? [...keyForm.permissions, p.id]
                              : keyForm.permissions.filter((x) => x !== p.id);
                            setKeyForm({ ...keyForm, permissions: newPerms });
                          }}
                        />
                        <span style={{ color: isChecked ? 'var(--color-mist-white)' : 'var(--color-text-secondary)' }}>
                          {p.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowKeyModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isGeneratingKey}
                >
                  {isGeneratingKey ? 'Generating...' : 'Generate Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: NEW WEBHOOK SUBSCRIPTION
          ===================================================================== */}
      {showWebhookModal && (
        <div className="modal-overlay" onClick={() => setShowWebhookModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Radio size={20} style={{ color: 'var(--color-mint-green)' }} />
                <span>Create Webhook Subscription</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setShowWebhookModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Subscription Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CRM Call Logger, Slack Alerts"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Destination Webhook URL *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://api.yourdomain.com/webhooks"
                  value={webhookForm.target_url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, target_url: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>HMAC-SHA256 Secret (optional, auto-generated if blank)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Leave blank to generate secure whsec_..."
                  value={webhookForm.secret_key}
                  onChange={(e) => setWebhookForm({ ...webhookForm, secret_key: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Select Subscribed Events *</label>
                <div className="events-picker">
                  {[
                    'stt.completed',
                    'stt.failed',
                    'tts.completed',
                    'tts.failed',
                    'audio.generated',
                    'model.status_changed',
                    'integration.connected',
                    'callzenza.session.started',
                    '*'
                  ].map((evtId) => {
                    const isSel = webhookForm.events.includes(evtId);
                    return (
                      <span
                        key={evtId}
                        className={`event-chip ${isSel ? 'selected' : ''}`}
                        onClick={() => {
                          const newEvents = isSel
                            ? webhookForm.events.filter((x) => x !== evtId)
                            : [...webhookForm.events, evtId];
                          setWebhookForm({ ...webhookForm, events: newEvents });
                        }}
                      >
                        {isSel ? '✓ ' : '+ '}
                        {evtId === '*' ? 'All Events (*)' : evtId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Max Retries on Failure</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="form-input"
                    value={webhookForm.retry_count}
                    onChange={(e) => setWebhookForm({ ...webhookForm, retry_count: parseInt(e.target.value, 10) })}
                  />
                </div>
                <div className="form-group">
                  <label>Timeout (Seconds)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="form-input"
                    value={webhookForm.timeout_sec}
                    onChange={(e) => setWebhookForm({ ...webhookForm, timeout_sec: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowWebhookModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingWebhook}
                >
                  {isSubmittingWebhook ? 'Saving...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: INSPECT DELIVERY PAYLOAD
          ===================================================================== */}
      {inspectDelivery && (
        <div className="modal-overlay" onClick={() => setInspectDelivery(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Activity size={18} style={{ color: 'var(--color-mint-green)' }} />
                <span>Webhook Delivery Details</span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px' }}
                onClick={() => setInspectDelivery(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#0A1411', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                <span>Event: <strong style={{ color: 'var(--color-mint-green)' }}>{inspectDelivery.event_name}</strong></span>
                <span>Status: <strong>{inspectDelivery.status} (HTTP {inspectDelivery.http_status || 'N/A'})</strong></span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                Destination: <code style={{ color: 'var(--color-mist-white)' }}>{inspectDelivery.target_url}</code>
              </div>

              <div className="form-group">
                <label>Dispatched Payload (JSON)</label>
                <div className="code-block-container">
                  <pre className="code-content" style={{ maxHeight: 220, fontSize: 12 }}>
                    {JSON.stringify(inspectDelivery.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {inspectDelivery.response_body && (
                <div className="form-group">
                  <label>Remote Server Response</label>
                  <div className="code-block-container">
                    <pre className="code-content" style={{ maxHeight: 120, fontSize: 12 }}>
                      {inspectDelivery.response_body}
                    </pre>
                  </div>
                </div>
              )}

              {inspectDelivery.error_message && (
                <div className="notice-box warning">
                  <AlertTriangle size={16} />
                  <span>{inspectDelivery.error_message}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setInspectDelivery(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleRetryDelivery(inspectDelivery.id);
                    setInspectDelivery(null);
                  }}
                >
                  <RefreshCw size={13} />
                  Re-Dispatch Delivery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WebhooksPage;
