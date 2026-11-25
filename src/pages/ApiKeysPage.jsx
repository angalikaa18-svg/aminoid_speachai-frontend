import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Zap,
  Activity,
  FileText,
  BookOpen,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Power,
  Globe,
  Sliders,
  Terminal,
  Code2,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import apiKeyApi from '../api/apiKeyApi';
import { useToast } from '../components/Toast';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export function ApiKeysPage() {
  const { addToast } = useToast();

  // Active Tab: 'keys' | 'analytics' | 'logs' | 'test' | 'docs'
  const [activeTab, setActiveTab] = useState('keys');

  // Stats & Permissions
  const [stats, setStats] = useState(null);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);

  // Keys Table & Filters
  const [keys, setKeys] = useState([]);
  const [totalKeys, setTotalKeys] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revealedKeyData, setRevealedKeyData] = useState(null); // { apiKey, keyRecord }
  const [revokingKeyId, setRevokingKeyId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Form State for Creating Key
  const [formData, setFormData] = useState({
    name: '',
    client_name: 'CallZenza AI Receptionist',
    description: '',
    environment: 'production',
    expiration_type: 'never', // 'never' | '7d' | '30d' | '90d' | '180d' | '365d' | 'custom'
    custom_date: '',
    rate_limit_rpm: 60,
    rate_limit_rph: 1000,
    rate_limit_rpd: 10000,
    ip_whitelist: '',
    permissions: [
      'stt.transcribe',
      'tts.generate',
      'tts.voices.read',
      'audio.read'
    ]
  });
  const [submittingKey, setSubmittingKey] = useState(false);

  // Analytics Tab State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Logs Tab State
  const [logs, setLogs] = useState([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsStatusFilter, setLogsStatusFilter] = useState('all');
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Connection Test Tab State
  const [testKeyInput, setTestKeyInput] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Documentation Tab State
  const [docLanguage, setDocLanguage] = useState('curl'); // 'curl' | 'python' | 'node'
  const [docEndpoint, setDocEndpoint] = useState('stt'); // 'stt' | 'tts' | 'voices' | 'library' | 'models'

  // Load Initial Metadata
  const loadInitialData = async () => {
    try {
      const [statsRes, permsRes] = await Promise.all([
        apiKeyApi.getStats().catch(() => ({ stats: null })),
        apiKeyApi.getPermissions().catch(() => ({ permission_groups: {}, all_permissions: [] }))
      ]);
      if (statsRes && statsRes.stats) setStats(statsRes.stats);
      if (permsRes && permsRes.permission_groups) {
        setPermissionGroups(permsRes.permission_groups);
        setAllPermissions(permsRes.all_permissions || []);
      }
    } catch (e) {
      console.warn('Metadata load error:', e);
    }
  };

  // Load Keys List with Pagination & Filters
  const loadKeys = async () => {
    setLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * pageSize;
      const res = await apiKeyApi.getKeys({
        search: searchQuery,
        status: statusFilter,
        client: clientFilter,
        environment: envFilter,
        limit: pageSize,
        offset
      });
      if (res && res.success) {
        setKeys(res.keys || []);
        setTotalKeys(res.total || 0);
        setTotalPages(res.total_pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch API keys from backend.');
    } finally {
      setLoading(false);
    }
  };

  // Load Analytics
  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await apiKeyApi.getAnalytics();
      if (res && res.analytics) setAnalytics(res.analytics);
    } catch (err) {
      console.warn('Analytics load error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Load Request Logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const offset = (logsPage - 1) * 20;
      const res = await apiKeyApi.getLogs({
        search: logsSearch,
        status_code: logsStatusFilter !== 'all' ? parseInt(logsStatusFilter, 10) : undefined,
        limit: 20,
        offset
      });
      if (res && res.logs) {
        setLogs(res.logs.items || []);
        setTotalLogs(res.logs.total || 0);
      }
    } catch (err) {
      console.warn('Logs load error:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'keys') {
      loadKeys();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, currentPage, statusFilter, envFilter, clientFilter, logsPage, logsStatusFilter]);

  // Handle Search Debounce
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadKeys();
  };

  const handleLogsSearchSubmit = (e) => {
    e.preventDefault();
    setLogsPage(1);
    loadLogs();
  };

  // Toggle Active State
  const handleToggleKey = async (keyId, currentStatus) => {
    const willActivate = currentStatus !== 'active';
    try {
      await apiKeyApi.toggleKey(keyId, willActivate);
      addToast(`API key ${willActivate ? 'activated' : 'deactivated'} successfully!`, 'info');
      loadKeys();
      loadInitialData();
    } catch (err) {
      addToast(err.message || 'Failed to toggle API key.', 'error');
    }
  };

  // Revoke Key
  const handleConfirmRevoke = async () => {
    if (!revokingKeyId) return;
    try {
      await apiKeyApi.revokeKey(revokingKeyId);
      addToast('API key revoked permanently.', 'warning');
      setRevokingKeyId(null);
      loadKeys();
      loadInitialData();
    } catch (err) {
      addToast(err.message || 'Failed to revoke API key.', 'error');
    }
  };

  // Create Key Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast('Please enter an API key name.', 'error');
      return;
    }
    if (formData.permissions.length === 0) {
      addToast('Please select at least one permission.', 'error');
      return;
    }

    setSubmittingKey(true);
    try {
      let expiresInDays = null;
      let customExp = null;

      if (formData.expiration_type === '7d') expiresInDays = 7;
      else if (formData.expiration_type === '30d') expiresInDays = 30;
      else if (formData.expiration_type === '90d') expiresInDays = 90;
      else if (formData.expiration_type === '180d') expiresInDays = 180;
      else if (formData.expiration_type === '365d') expiresInDays = 365;
      else if (formData.expiration_type === 'custom' && formData.custom_date) {
        customExp = formData.custom_date;
      }

      const ipList = formData.ip_whitelist
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        client_name: formData.client_name.trim(),
        description: formData.description.trim(),
        environment: formData.environment,
        permissions: formData.permissions,
        expires_in_days: expiresInDays,
        custom_expiration_date: customExp,
        rate_limit_rpm: parseInt(formData.rate_limit_rpm, 10) || 60,
        rate_limit_rph: parseInt(formData.rate_limit_rph, 10) || 1000,
        rate_limit_rpd: parseInt(formData.rate_limit_rpd, 10) || 10000,
        ip_whitelist: ipList
      };

      const res = await apiKeyApi.createKey(payload);
      if (res && res.success) {
        setRevealedKeyData({
          apiKey: res.api_key,
          keyRecord: res.key_record
        });
        setShowCreateModal(false);
        // Reset form
        setFormData({
          name: '',
          client_name: 'CallZenza AI Receptionist',
          description: '',
          environment: 'production',
          expiration_type: 'never',
          custom_date: '',
          rate_limit_rpm: 60,
          rate_limit_rph: 1000,
          rate_limit_rpd: 10000,
          ip_whitelist: '',
          permissions: ['stt.transcribe', 'tts.generate', 'tts.voices.read', 'audio.read']
        });
        addToast('New API key generated successfully!', 'success');
        loadKeys();
        loadInitialData();
      }
    } catch (err) {
      addToast(err.message || 'Failed to generate API key.', 'error');
    } finally {
      setSubmittingKey(false);
    }
  };

  // Permission selection helpers
  const togglePermission = (permId) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [...allPermissions]
    }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: []
    }));
  };

  const selectGroupPermissions = (groupPerms) => {
    setFormData((prev) => {
      const groupIds = groupPerms.map((p) => p.id);
      const combined = Array.from(new Set([...prev.permissions, ...groupIds]));
      return { ...prev, permissions: combined };
    });
  };

  // Run Connection Test
  const handleRunConnectionTest = async () => {
    if (!testKeyInput.trim()) {
      addToast('Please enter an API key to test.', 'error');
      return;
    }
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await apiKeyApi.testConnection(testKeyInput.trim());
      setTestResult(res);
      if (res.authenticated) {
        addToast(`Key authenticated in ${res.latency_ms}ms!`, 'success');
      } else {
        addToast(res.message || 'Verification failed.', 'error');
      }
    } catch (err) {
      setTestResult({
        success: false,
        authenticated: false,
        status: 'FAIL',
        message: err.message || 'Failed to contact backend.'
      });
      addToast('Connection test error.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Copy helper
  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(txt);
    addToast(label, 'success');
  };

  const baseUrl = apiKeyApi.getBaseUrl();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* 1. Header Card */}
      <div className="studio-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(75, 166, 154, 0.14)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)'
              }}
            >
              <Key size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, color: 'var(--color-primary)', fontWeight: 700 }}>
                Developer API Keys & External Integrations
              </h2>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Secure Bearer Token authentication layer for AI Receptionist, CallZenza, CRM, ERP, and third-party systems.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                loadKeys();
                loadInitialData();
                if (activeTab === 'analytics') loadAnalytics();
                if (activeTab === 'logs') loadLogs();
              }}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={15} />
              <span>Create API Key</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="tts-mode-nav" style={{ marginTop: 20 }}>
          <button
            type="button"
            className={`tts-mode-tab ${activeTab === 'keys' ? 'active' : ''}`}
            onClick={() => setActiveTab('keys')}
          >
            <Key size={14} />
            <span>API Keys</span>
          </button>
          <button
            type="button"
            className={`tts-mode-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <Activity size={14} />
            <span>Usage Analytics</span>
          </button>
          <button
            type="button"
            className={`tts-mode-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <FileText size={14} />
            <span>Request Logs</span>
          </button>
          <button
            type="button"
            className={`tts-mode-tab ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            <Zap size={14} />
            <span>Test Connection</span>
          </button>
          <button
            type="button"
            className={`tts-mode-tab ${activeTab === 'docs' ? 'active' : ''}`}
            onClick={() => setActiveTab('docs')}
          >
            <BookOpen size={14} />
            <span>API Documentation</span>
          </button>
        </div>
      </div>

      {/* 2. TAB: API KEYS */}
      {activeTab === 'keys' && (
        <>
          {/* Dashboard Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div className="stat-card">
              <span className="stat-label">Total API Keys</span>
              <span className="stat-value">{stats ? stats.total_keys : '...'}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Registered credentials</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Active Keys</span>
              <span className="stat-value" style={{ color: 'var(--color-success)' }}>
                {stats ? stats.active_keys : '...'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Ready for authorization</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Revoked Keys</span>
              <span className="stat-value" style={{ color: 'var(--color-danger)' }}>
                {stats ? stats.revoked_keys : '...'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Permanently blocked</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Expired Keys</span>
              <span className="stat-value" style={{ color: 'var(--color-warning)' }}>
                {stats ? stats.expired_keys : '...'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Exceeded validity period</span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Total Requests</span>
              <span className="stat-value">{stats ? stats.total_requests : '...'}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {stats ? `${stats.successful_requests} ok / ${stats.failed_requests} fail` : 'All time'}
              </span>
            </div>

            <div className="stat-card">
              <span className="stat-label">Usage Today</span>
              <span className="stat-value" style={{ color: 'var(--color-accent)' }}>
                {stats ? stats.requests_today : '...'}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Avg Latency: {stats ? `${stats.avg_latency_ms}ms` : '0ms'}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="studio-card" style={{ padding: '16px 20px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search keys by name, client, prefix..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ margin: 0, paddingLeft: 36, width: '100%' }}
                />
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              </div>

              {/* Status Filter */}
              <div style={{ width: 140 }}>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ margin: 0 }}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                  <option value="revoked">Revoked</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Environment Filter */}
              <div style={{ width: 150 }}>
                <select
                  value={envFilter}
                  onChange={(e) => {
                    setEnvFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ margin: 0 }}
                >
                  <option value="all">Env: All</option>
                  <option value="production">Production</option>
                  <option value="testing">Testing</option>
                  <option value="development">Development</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
                <Search size={14} />
                <span>Filter</span>
              </button>
            </form>
          </div>

          {/* Table Container */}
          <div className="studio-card" style={{ padding: 0, overflow: 'hidden' }}>
            {error && (
              <div style={{ padding: 20 }}>
                <ErrorMessage message={error} onRetry={loadKeys} />
              </div>
            )}

            {loading ? (
              <div style={{ padding: 40 }}>
                <LoadingState message="Loading API key credentials from database..." />
              </div>
            ) : keys.length === 0 ? (
              <div style={{ padding: 40 }}>
                <EmptyState
                  title="No API Keys Found"
                  description="Generate a secure API key to connect CallZenza AI Receptionist, CRM, or external applications."
                  icon={Key}
                />
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                    <Plus size={14} />
                    <span>Create Your First API Key</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="specs-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#FAF9F5' }}>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>NAME & CLIENT</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>KEY PREFIX</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>ENVIRONMENT</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>PERMISSIONS</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>REQUESTS</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>EXPIRATION</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>LAST USED</th>
                      <th style={{ textAlign: 'right', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k) => {
                      const isExpired = k.status === 'expired';
                      const isRevoked = k.status === 'revoked';
                      const isActive = k.status === 'active';

                      return (
                        <tr key={k.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.15s ease' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-primary)', fontSize: 14 }}>{k.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                              {k.client_name || 'Generic Client'}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text-primary)' }}>
                                {k.key_prefix}
                              </span>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                title="Copy Key Prefix"
                                style={{ padding: 4 }}
                                onClick={() => copyText(k.key_prefix, 'Key prefix copied!')}
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <span
                              className={`badge ${k.environment === 'production' ? 'badge-mint' : 'badge-moss'}`}
                              style={{ fontSize: 11, textTransform: 'capitalize' }}
                            >
                              {k.environment || 'production'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                              {Array.isArray(k.permissions) && k.permissions.slice(0, 2).map((p) => (
                                <span key={p} className="badge badge-moss" style={{ fontSize: 10, padding: '2px 6px' }}>
                                  {p}
                                </span>
                              ))}
                              {Array.isArray(k.permissions) && k.permissions.length > 2 && (
                                <span className="badge badge-moss" style={{ fontSize: 10, padding: '2px 6px' }} title={k.permissions.join(', ')}>
                                  +{k.permissions.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            {isActive && (
                              <span className="badge" style={{ backgroundColor: 'rgba(46, 139, 87, 0.12)', color: '#2E8B57', border: '1px solid rgba(46, 139, 87, 0.3)' }}>
                                Active
                              </span>
                            )}
                            {k.status === 'disabled' && (
                              <span className="badge" style={{ backgroundColor: 'rgba(135, 150, 146, 0.15)', color: '#647875', border: '1px solid var(--color-border)' }}>
                                Disabled
                              </span>
                            )}
                            {isRevoked && (
                              <span className="badge" style={{ backgroundColor: 'rgba(217, 83, 79, 0.12)', color: '#D9534F', border: '1px solid rgba(217, 83, 79, 0.3)' }}>
                                Revoked
                              </span>
                            )}
                            {isExpired && (
                              <span className="badge" style={{ backgroundColor: 'rgba(217, 154, 50, 0.12)', color: '#D99A32', border: '1px solid rgba(217, 154, 50, 0.3)' }}>
                                Expired
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                              {k.total_requests || 0}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              {k.successful_requests || 0} success
                            </div>
                          </td>

                          <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {k.expires_at ? new Date(k.expires_at).toLocaleDateString() : 'Never'}
                          </td>

                          <td style={{ padding: '14px 18px', fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}
                          </td>

                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {!isRevoked && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title={isActive ? 'Deactivate Key' : 'Activate Key'}
                                  style={{ padding: 6, color: isActive ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                                  onClick={() => handleToggleKey(k.id, k.status)}
                                >
                                  <Power size={14} />
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                title="Test Key in Tester"
                                style={{ padding: 6, color: 'var(--color-accent)' }}
                                onClick={() => {
                                  setTestKeyInput(k.key_prefix);
                                  setActiveTab('test');
                                }}
                              >
                                <Zap size={14} />
                              </button>

                              {!isRevoked && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  title="Revoke Key Permanently"
                                  style={{ padding: 6, color: 'var(--color-danger)' }}
                                  onClick={() => setRevokingKeyId(k.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalKeys > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--color-border)', backgroundColor: '#FAF9F5' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalKeys)} of {totalKeys} keys
                </span>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 3. TAB: USAGE ANALYTICS */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loadingAnalytics ? (
            <div className="studio-card" style={{ padding: 40 }}>
              <LoadingState message="Aggregating real-time API metrics from database..." />
            </div>
          ) : !analytics ? (
            <div className="studio-card" style={{ padding: 40 }}>
              <EmptyState title="No Analytics Available" description="Traffic metrics will populate once API requests are recorded." icon={Activity} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
              {/* Top Endpoints */}
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-card-title">
                    <Zap size={18} style={{ color: 'var(--color-accent)' }} />
                    <span>Top API Endpoints</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analytics.by_endpoint.map((ep, idx) => (
                    <div key={idx} style={{ padding: 12, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                          {ep.endpoint}
                        </span>
                        <span className="badge badge-mint">{ep.count} reqs</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Avg Latency: {ep.avg_latency_ms}ms
                      </div>
                    </div>
                  ))}
                  {analytics.by_endpoint.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No endpoint requests logged yet.</span>
                  )}
                </div>
              </div>

              {/* Top Keys */}
              <div className="studio-card">
                <div className="studio-card-header">
                  <div className="studio-card-title">
                    <Key size={18} style={{ color: 'var(--color-accent)' }} />
                    <span>Traffic by Application / Key</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analytics.by_key.map((k, idx) => (
                    <div key={idx} style={{ padding: 12, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{k.key_name}</span>
                        <span className="badge badge-moss">{k.count} calls</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                        Key ID: {k.api_key_id || 'System Dev'}
                      </div>
                    </div>
                  ))}
                  {analytics.by_key.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No keys have executed requests yet.</span>
                  )}
                </div>
              </div>

              {/* 7-Day Volume */}
              <div className="studio-card" style={{ gridColumn: '1 / -1' }}>
                <div className="studio-card-header">
                  <div className="studio-card-title">
                    <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
                    <span>Daily Request Volume (Past 7 Days)</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
                  {analytics.daily_volume.map((d, idx) => (
                    <div key={idx} style={{ padding: 14, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{d.day}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginTop: 6 }}>{d.total}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>{d.successful} succ</div>
                    </div>
                  ))}
                  {analytics.daily_volume.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No requests logged in the past 7 days.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TAB: REQUEST LOGS */}
      {activeTab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Logs Filter Bar */}
          <div className="studio-card" style={{ padding: '16px 20px' }}>
            <form onSubmit={handleLogsSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search logs by endpoint, IP, key name..."
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  style={{ margin: 0, paddingLeft: 36, width: '100%' }}
                />
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              </div>

              <div style={{ width: 140 }}>
                <select
                  value={logsStatusFilter}
                  onChange={(e) => {
                    setLogsStatusFilter(e.target.value);
                    setLogsPage(1);
                  }}
                  style={{ margin: 0 }}
                >
                  <option value="all">HTTP Status: All</option>
                  <option value="200">200 OK</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="429">429 Rate Limit</option>
                  <option value="500">500 Server Error</option>
                </select>
              </div>

              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px' }}>
                <Search size={14} />
                <span>Filter Logs</span>
              </button>
            </form>
          </div>

          {/* Logs Table */}
          <div className="studio-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingLogs ? (
              <div style={{ padding: 40 }}>
                <LoadingState message="Fetching audit logs from database..." />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: 40 }}>
                <EmptyState title="No Request Logs" description="HTTP requests to external STT, TTS, and integration routes will be logged here." icon={FileText} />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="specs-table" style={{ width: '100%', margin: 0, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: '#FAF9F5' }}>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>METHOD & ENDPOINT</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>STATUS</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>CLIENT / KEY</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>DURATION</th>
                      <th style={{ textAlign: 'left', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>IP ADDRESS</th>
                      <th style={{ textAlign: 'right', padding: '12px 18px', fontSize: 12, color: 'var(--color-primary)' }}>TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((lg) => {
                      const isSuccess = lg.status_code >= 200 && lg.status_code < 400;
                      const isClientErr = lg.status_code >= 400 && lg.status_code < 500;

                      return (
                        <tr key={lg.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: lg.method === 'POST' ? 'rgba(75, 166, 154, 0.15)' : 'rgba(23, 76, 75, 0.1)',
                                  color: 'var(--color-primary)',
                                  fontSize: 10,
                                  fontWeight: 700
                                }}
                              >
                                {lg.method}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-primary)', fontWeight: 600 }}>
                                {lg.endpoint}
                              </span>
                            </div>
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: isSuccess ? 'rgba(46, 139, 87, 0.12)' : isClientErr ? 'rgba(217, 154, 50, 0.15)' : 'rgba(217, 83, 79, 0.15)',
                                color: isSuccess ? '#2E8B57' : isClientErr ? '#D99A32' : '#D9534F',
                                fontSize: 11
                              }}
                            >
                              {lg.status_code}
                            </span>
                          </td>

                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>{lg.key_name}</div>
                            {lg.client_app && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{lg.client_app}</div>}
                          </td>

                          <td style={{ padding: '12px 18px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                            {lg.processing_time_ms ? `${lg.processing_time_ms.toFixed(1)}ms` : '0ms'}
                          </td>

                          <td style={{ padding: '12px 18px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                            {lg.client_ip || '127.0.0.1'}
                          </td>

                          <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                            {new Date(lg.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB: TEST CONNECTION */}
      {activeTab === 'test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="studio-card">
            <div className="studio-card-header">
              <div className="studio-card-title">
                <Zap size={20} style={{ color: 'var(--color-accent)' }} />
                <span>Interactive API Connection Tester</span>
              </div>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Test any AMINOID API key to verify authentication, measure server latency, and inspect available services.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Paste API Key (e.g. aminoid_live_...)"
                value={testKeyInput}
                onChange={(e) => setTestKeyInput(e.target.value)}
                style={{ flex: '1 1 320px', margin: 0, fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunConnectionTest}
                disabled={testingConnection}
              >
                <Zap size={14} className={testingConnection ? 'spin' : ''} />
                <span>{testingConnection ? 'Testing...' : 'Run Diagnostic Test'}</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className="studio-card" style={{ borderLeft: testResult.authenticated ? '4px solid #2E8B57' : '4px solid #D9534F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {testResult.authenticated ? (
                    <CheckCircle2 size={20} style={{ color: '#2E8B57' }} />
                  ) : (
                    <XCircle size={20} style={{ color: '#D9534F' }} />
                  )}
                  <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-primary)' }}>
                    {testResult.authenticated ? 'Authentication Verified' : 'Authentication Failed'}
                  </h3>
                </div>
                {testResult.latency_ms !== undefined && (
                  <span className="badge badge-mint">{testResult.latency_ms}ms roundtrip</span>
                )}
              </div>

              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 16px 0' }}>
                {testResult.message}
              </p>

              {testResult.services && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {Object.entries(testResult.services).map(([key, svc]) => (
                    <div key={key} style={{ padding: 12, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{key.replace('_', ' ')}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
                        {svc.status === 'PASS' ? 'Ready & Online' : 'Unavailable'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {testResult.permissions && (
                <div style={{ marginTop: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>Authorized Permissions:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {testResult.permissions.map((p) => (
                      <span key={p} className="badge badge-moss" style={{ fontSize: 11 }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB: API DOCUMENTATION */}
      {activeTab === 'docs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Base Configuration Info */}
          <div className="studio-card">
            <div className="studio-card-header">
              <div className="studio-card-title">
                <Code2 size={20} style={{ color: 'var(--color-accent)' }} />
                <span>CallZenza & AI Receptionist Environment Setup</span>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 14px 0' }}>
              Configure these environment variables in your AI Receptionist or CallZenza backend. 
              Never expose these credentials in frontend client bundles.
            </p>

            <div style={{ position: 'relative', backgroundColor: '#174C4B', color: '#FAF9F5', padding: '16px 20px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-mono)', fontSize: 12, overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>
{`# AMINOID AI Speech Platform Integration for CallZenza
AMINOID_API_BASE_URL=${baseUrl}
AMINOID_API_KEY=aminoid_live_your_secret_api_key_here
AMINOID_CLIENT_ID=callzenza_ai_receptionist
AMINOID_STT_ENABLED=true
AMINOID_TTS_ENABLED=true`}
              </pre>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ position: 'absolute', right: 14, top: 14, padding: '4px 8px', fontSize: 11 }}
                onClick={() =>
                  copyText(
                    `AMINOID_API_BASE_URL=${baseUrl}\nAMINOID_API_KEY=aminoid_live_your_secret_api_key_here\nAMINOID_CLIENT_ID=callzenza_ai_receptionist\nAMINOID_STT_ENABLED=true\nAMINOID_TTS_ENABLED=true`,
                    'Environment config copied!'
                  )
                }
              >
                <Copy size={12} />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Interactive Endpoints Docs */}
          <div className="studio-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-primary)' }}>API Endpoints & Code Examples</h3>
              <div className="gender-pills">
                <button type="button" className={`gender-pill ${docLanguage === 'curl' ? 'active' : ''}`} onClick={() => setDocLanguage('curl')}>
                  cURL
                </button>
                <button type="button" className={`gender-pill ${docLanguage === 'python' ? 'active' : ''}`} onClick={() => setDocLanguage('python')}>
                  Python
                </button>
                <button type="button" className={`gender-pill ${docLanguage === 'node' ? 'active' : ''}`} onClick={() => setDocLanguage('node')}>
                  Node.js
                </button>
              </div>
            </div>

            {/* STT Section */}
            <div style={{ marginBottom: 24, padding: 16, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-mint" style={{ fontWeight: 700 }}>POST</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>/api/v1/integrations/stt/transcribe</span>
                <span className="badge badge-moss">Scope: stt.transcribe</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px 0' }}>
                Transcribe caller audio using Faster-Whisper neural engine. Accepts WAV, MP3, FLAC, WebM.
              </p>
              <div style={{ backgroundColor: '#174C4B', color: '#FAF9F5', padding: 14, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, overflowX: 'auto' }}>
                {docLanguage === 'curl' && `curl -X POST "${baseUrl}/api/v1/integrations/stt/transcribe" \\
  -H "Authorization: Bearer aminoid_live_YOUR_KEY" \\
  -F "audio=@caller_audio.wav" \\
  -F "language=auto"`}
                {docLanguage === 'python' && `import requests

res = requests.post(
    "${baseUrl}/api/v1/integrations/stt/transcribe",
    headers={"Authorization": "Bearer aminoid_live_YOUR_KEY"},
    files={"audio": open("caller.wav", "rb")},
    data={"language": "auto", "vad_filter": "true"}
)
print(res.json())`}
                {docLanguage === 'node' && `const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('audio', fs.createReadStream('caller.wav'));

const res = await axios.post('${baseUrl}/api/v1/integrations/stt/transcribe', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer aminoid_live_YOUR_KEY'
  }
});
console.log(res.data);`}
              </div>
            </div>

            {/* TTS Section */}
            <div style={{ padding: 16, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="badge badge-mint" style={{ fontWeight: 700 }}>POST</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-primary)' }}>/api/v1/integrations/tts/generate</span>
                <span className="badge badge-moss">Scope: tts.generate</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px 0' }}>
                Synthesize high-fidelity voice responses. Returns JSON with audio URL or raw WAV stream.
              </p>
              <div style={{ backgroundColor: '#174C4B', color: '#FAF9F5', padding: 14, borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, overflowX: 'auto' }}>
                {docLanguage === 'curl' && `curl -X POST "${baseUrl}/api/v1/integrations/tts/generate" \\
  -H "Authorization: Bearer aminoid_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Hello, welcome to CallZenza.", "rate": 175, "response_mode": "json"}'`}
                {docLanguage === 'python' && `import requests

res = requests.post(
    "${baseUrl}/api/v1/integrations/tts/generate",
    headers={"Authorization": "Bearer aminoid_live_YOUR_KEY"},
    json={"text": "Hello from CallZenza receptionist.", "rate": 175}
)
print(res.json()["audio_url"])`}
                {docLanguage === 'node' && `const axios = require('axios');

const res = await axios.post('${baseUrl}/api/v1/integrations/tts/generate', {
  text: 'Hello from CallZenza receptionist.',
  rate: 175
}, {
  headers: { 'Authorization': 'Bearer aminoid_live_YOUR_KEY' }
});
console.log(res.data.audio_url);`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CREATE API KEY MODAL                                          */}
      {/* ------------------------------------------------------------- */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 76, 75, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            className="studio-card"
            style={{
              width: '100%',
              maxWidth: 680,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: 'var(--shadow-hover)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={22} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-primary)' }}>Create Developer API Key</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: 6 }}
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Basic Information */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  API Key Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CallZenza Voice Agent, CRM Bot, Production ERP"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ margin: 0, width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    Client / Application Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CallZenza AI Receptionist"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    style={{ margin: 0, width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                    Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    style={{ margin: 0, width: '100%' }}
                  >
                    <option value="production">Production (aminoid_live_...)</option>
                    <option value="testing">Testing (aminoid_test_...)</option>
                    <option value="development">Development (aminoid_dev_...)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Description / Integration Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional context about how this key is used"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ margin: 0, width: '100%' }}
                />
              </div>

              {/* Expiration Settings */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                  Expiration Period
                </label>
                <select
                  value={formData.expiration_type}
                  onChange={(e) => setFormData({ ...formData, expiration_type: e.target.value })}
                  style={{ margin: 0, width: '100%' }}
                >
                  <option value="never">Never expires (Recommended for long-running services)</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="180d">180 days</option>
                  <option value="365d">365 days (1 year)</option>
                  <option value="custom">Custom expiration date</option>
                </select>

                {formData.expiration_type === 'custom' && (
                  <input
                    type="date"
                    value={formData.custom_date}
                    onChange={(e) => setFormData({ ...formData, custom_date: e.target.value })}
                    style={{ marginTop: 8, width: '100%' }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                )}
              </div>

              {/* Security & Rate Limits */}
              <div style={{ padding: 14, backgroundColor: '#FAF9F5', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 8 }}>
                  Security & Rate Limits
                </span>

                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 2 }}>
                    IP Whitelist (comma-separated, leave blank for unrestricted):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100, 10.0.0.5"
                    value={formData.ip_whitelist}
                    onChange={(e) => setFormData({ ...formData, ip_whitelist: e.target.value })}
                    style={{ margin: 0, width: '100%', fontSize: 12 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Req / Minute</label>
                    <input
                      type="number"
                      value={formData.rate_limit_rpm}
                      onChange={(e) => setFormData({ ...formData, rate_limit_rpm: e.target.value })}
                      style={{ margin: 0, width: '100%', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Req / Hour</label>
                    <input
                      type="number"
                      value={formData.rate_limit_rph}
                      onChange={(e) => setFormData({ ...formData, rate_limit_rph: e.target.value })}
                      style={{ margin: 0, width: '100%', fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Req / Day</label>
                    <input
                      type="number"
                      value={formData.rate_limit_rpd}
                      onChange={(e) => setFormData({ ...formData, rate_limit_rpd: e.target.value })}
                      style={{ margin: 0, width: '100%', fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
                    Permissions ({formData.permissions.length} selected)
                  </label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={selectAllPermissions}>
                      Select All
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: '2px 8px' }} onClick={clearAllPermissions}>
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                  {Object.entries(permissionGroups).map(([groupName, groupPerms]) => (
                    <div key={groupName} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 10, backgroundColor: '#FAF9F5' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)' }}>{groupName}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 10, padding: '1px 6px' }}
                          onClick={() => selectGroupPermissions(groupPerms)}
                        >
                          Select Group
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {groupPerms.map((p) => {
                          const isChecked = formData.permissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 11,
                                cursor: 'pointer',
                                color: isChecked ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(p.id)}
                                style={{ margin: 0 }}
                              />
                              <span>{p.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submittingKey}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submittingKey}
                >
                  <Key size={14} />
                  <span>{submittingKey ? 'Generating...' : 'Generate API Key'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* NEW KEY REVEALED MODAL (SHOWN ONLY ONCE)                      */}
      {/* ------------------------------------------------------------- */}
      {revealedKeyData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 76, 75, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1010,
            padding: 20
          }}
        >
          <div
            className="studio-card"
            style={{
              width: '100%',
              maxWidth: 580,
              padding: 28,
              boxShadow: 'var(--shadow-hover)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <CheckCircle2 size={26} style={{ color: 'var(--color-success)' }} />
              <h3 style={{ margin: 0, fontSize: 18, color: 'var(--color-primary)' }}>API Key Generated Successfully</h3>
            </div>

            <div style={{ padding: 12, backgroundColor: 'rgba(217, 154, 50, 0.12)', border: '1px solid rgba(217, 154, 50, 0.3)', borderRadius: 6, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#D99A32', fontWeight: 600, fontSize: 13 }}>
                <AlertTriangle size={16} />
                <span>Save this key securely!</span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--color-text-primary)' }}>
                For security reasons, this raw API key will <strong>never be shown again</strong>. If you lose it, you will need to revoke this key and generate a new one.
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                Secret API Key for: <strong>{revealedKeyData.keyRecord.name}</strong>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  readOnly
                  value={revealedKeyData.apiKey}
                  style={{
                    margin: 0,
                    width: '100%',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    backgroundColor: '#FAF9F5',
                    color: 'var(--color-primary)',
                    fontWeight: 600
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    copyText(revealedKeyData.apiKey, 'API Key copied to clipboard!');
                    setCopiedKey(true);
                  }}
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick CallZenza Config Preview */}
            <div style={{ padding: 12, backgroundColor: '#FAF9F5', border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', display: 'block', marginBottom: 4 }}>
                AI Receptionist .env Configuration:
              </span>
              <pre style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-primary)' }}>
{`AMINOID_API_KEY=${revealedKeyData.apiKey}`}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setRevealedKeyData(null);
                  setCopiedKey(false);
                }}
              >
                I Have Saved My Key Safely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* CONFIRM REVOCATION DIALOG                                     */}
      {/* ------------------------------------------------------------- */}
      <ConfirmDialog
        isOpen={!!revokingKeyId}
        title="Revoke API Key Permanently?"
        message="Are you sure you want to revoke this API key? Any external applications or telephony bots currently using it will be blocked immediately."
        confirmText="Revoke Key"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleConfirmRevoke}
        onCancel={() => setRevokingKeyId(null)}
      />
    </div>
  );
}

export default ApiKeysPage;
