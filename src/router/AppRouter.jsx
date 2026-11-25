import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import Dashboard from '../pages/Dashboard';
import STTPage from '../pages/STTPage';
import TTSPage from '../pages/TTSPage';
import ModelsPage from '../pages/ModelsPage';
import VoiceLibraryPage from '../pages/VoiceLibraryPage';
import WebhooksPage from '../pages/WebhooksPage';
import ApiKeysPage from '../pages/ApiKeysPage';
import HistoryPage from '../pages/HistoryPage';
import SettingsPage from '../pages/SettingsPage';
import AboutPage from '../pages/AboutPage';
import VoiceStudioPage from '../voiceStudio/pages/VoiceStudioPage';
import { useHealth } from '../hooks/useHealth';

const ROUTE_CONFIG = {
  '/': { title: 'Studio Dashboard', subtitle: 'Overview & Quick Speech Processing' },
  '/stt': { title: 'Speech-to-Text Studio', subtitle: 'Offline Audio Speech-to-Text Transcription' },
  '/tts': { title: 'Text-to-Speech Studio', subtitle: 'Offline Local Neural Voice Synthesis' },
  '/voice-studio': { title: 'Qwen3 Voice Studio', subtitle: 'Voice Cloning, Voice Design & Custom Personas' },
  '/models': { title: 'Model Management', subtitle: 'Local Quantized Neural Models' },
  '/voices': { title: 'Voice Library', subtitle: 'Installed Local Acoustic Voices' },
  '/api-keys': { title: 'API Key Management & Gateways', subtitle: 'Secure Bearer Token Integration for AI Receptionist' },
  '/webhooks': { title: 'Developer & CallZenza Integration', subtitle: 'REST Endpoints & Webhook Dispatcher' },
  '/history': { title: 'Activity History', subtitle: 'Local Transcription & Speech Audio Records' },
  '/settings': { title: 'Studio Settings', subtitle: 'API Endpoints & Inference Parameters' },
  '/about': { title: 'About AMINOID', subtitle: 'Architecture & Offline Privacy Specifications' },
};

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { status, healthData, refreshHealth } = useHealth();

  const currentRoute = ROUTE_CONFIG[location.pathname] || {
    title: 'AMINOID Studio',
    subtitle: 'Local Speech AI',
  };

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        healthStatus={status}
      />

      <div className="main-wrapper">
        <Topbar
          pageTitle={currentRoute.title}
          pageSubtitle={currentRoute.subtitle}
          connectionStatus={status}
          healthData={healthData}
          onOpenMobile={() => setMobileOpen(true)}
          onRefresh={refreshHealth}
        />

        <main className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stt" element={<STTPage />} />
            <Route path="/tts" element={<TTSPage />} />
            <Route path="/voice-studio/*" element={<VoiceStudioPage />} />
            <Route path="/models" element={<ModelsPage />} />
            <Route path="/voices" element={<VoiceLibraryPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/webhooks" element={<WebhooksPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function AppRouter() {
  return <Layout />;
}

export default AppRouter;
