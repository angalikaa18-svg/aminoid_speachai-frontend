import React from 'react';
import { Menu, RefreshCw, Cpu, HardDrive, Wifi, WifiOff } from 'lucide-react';

export function Topbar({
  pageTitle,
  pageSubtitle,
  connectionStatus,
  healthData,
  onOpenMobile,
  onRefresh,
}) {
  const isConnected = connectionStatus === 'connected';
  const isConnecting = connectionStatus === 'connecting';

  let statusText = 'Disconnected';
  if (isConnected) statusText = 'Connected (127.0.0.1:8080)';
  else if (isConnecting) statusText = 'Connecting...';
  else if (connectionStatus === 'error') statusText = 'Connection Error';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobile}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <div className="topbar-title-wrap">
          <h1 className="topbar-page-title">{pageTitle}</h1>
          <span className="topbar-breadcrumb">{pageSubtitle || 'AMINOID Speech Studio'}</span>
        </div>
      </div>

      <div className="topbar-right">
        {/* Backend Connection Status Badge */}
        <div className="status-pill" title={`Backend Status: ${statusText}`}>
          <span className={`status-dot ${connectionStatus}`} />
          <span>{statusText}</span>
        </div>

        {/* Hardware Status Display - Uses actual backend data without faking CPU/GPU % */}
        <div className="topbar-hardware-badge" title="Hardware execution device from backend /health">
          <Cpu size={14} />
          <span>{healthData?.hardware || 'Local CPU'}</span>
        </div>

        <div className="topbar-hardware-badge" title="Real-time CPU/GPU % is not exposed by FastAPI backend">
          <HardDrive size={14} />
          <span>CPU/GPU Usage: <em style={{ fontStyle: 'normal', color: 'var(--color-text-muted)' }}>Not available</em></span>
        </div>

        {/* Refresh health check button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          title="Refresh backend status"
          aria-label="Refresh Status"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </header>
  );
}

export default Topbar;
