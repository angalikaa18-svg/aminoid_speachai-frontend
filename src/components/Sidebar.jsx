import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mic,
  Volume2,
  Cpu,
  Layers,
  Webhook,
  History,
  Settings,
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Lock,
  Wand2,
  Key,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/stt', label: 'STT Transcription', icon: Mic },
  { path: '/tts', label: 'TTS Generation', icon: Volume2 },
  { path: '/voice-studio', label: 'Voice Studio', icon: Wand2 },
  { path: '/models', label: 'Models', icon: Cpu },
  { path: '/voices', label: 'Voice Library', icon: Layers },
  { path: '/api-keys', label: 'API Keys', icon: Key },
  { path: '/webhooks', label: 'Webhooks & CallZenza', icon: Webhook },
  { path: '/history', label: 'History', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/about', label: 'About', icon: Info },
];

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile, healthStatus }) {
  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="brand-logo">
              <svg viewBox="0 0 48 48" fill="none" style={{ width: '100%', height: '100%' }}>
                <rect width="48" height="48" rx="10" fill="#4BA69A" />
                <rect x="1" y="1" width="46" height="46" rx="9" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1.5" />
                <path
                  d="M10 24C10 24 14 14 18 24C22 34 26 12 30 24C34 36 38 24 38 24"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="18" cy="24" r="3" fill="#FFFFFF" />
                <circle cx="30" cy="24" r="3" fill="#FFFFFF" />
              </svg>
            </div>
            {!collapsed && (
              <div className="brand-text">
                <span className="brand-name">AMINOID</span>
                <span className="brand-badge">Local Speech AI</span>
              </div>
            )}
          </NavLink>

          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={19} className="nav-link-icon" />
                {!collapsed && <span className="nav-link-text">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Security & Offline Guarantee Panel */}
        {!collapsed && (
          <div className="sidebar-security">
            <div className="security-badge">
              <ShieldCheck size={14} />
              <span>Your Data — Secure & Private</span>
            </div>
            <div className="security-points">
              <div className="security-point">
                <span className="security-point-dot" />
                <span>100% Local Processing</span>
              </div>
              <div className="security-point">
                <span className="security-point-dot" />
                <span>No External Speech APIs</span>
              </div>
              <div className="security-point">
                <span className="security-point-dot" />
                <span>Air-Gapped Speech Pipeline</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Backdrop */}
      <div
        className={`mobile-overlay ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={onCloseMobile}
      />
    </>
  );
}

export default Sidebar;
