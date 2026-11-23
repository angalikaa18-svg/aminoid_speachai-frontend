import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, Wand2, Users, Layers, Sparkles } from 'lucide-react';
import VoiceCloning from './VoiceCloning';
import VoiceDesign from './VoiceDesign';
import CustomVoices from './CustomVoices';
import MyVoices from './MyVoices';

export function VoiceStudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'cloning';

  const switchTab = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Studio Header & Sub-Navigation */}
      <div className="studio-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={22} style={{ color: 'var(--color-mint-green)' }} />
            <div>
              <h2 style={{ fontSize: 18, margin: 0, color: 'var(--color-mist-white)' }}>
                "aminoid speech"
              </h2>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                End-to-End Voice Cloning, Acoustic Voice Design, and Custom Personas
              </span>
            </div>
          </div>

          {/* Studio Navigation Tabs */}
          <div className="tts-mode-nav">
            <button
              type="button"
              className={`tts-mode-tab ${currentTab === 'cloning' ? 'active' : ''}`}
              onClick={() => switchTab('cloning')}
            >
              <Mic size={14} />
              <span>Voice Cloning</span>
            </button>
            <button
              type="button"
              className={`tts-mode-tab ${currentTab === 'design' ? 'active' : ''}`}
              onClick={() => switchTab('design')}
            >
              <Wand2 size={14} />
              <span>Voice Design</span>
            </button>
            <button
              type="button"
              className={`tts-mode-tab ${currentTab === 'custom' ? 'active' : ''}`}
              onClick={() => switchTab('custom')}
            >
              <Users size={14} />
              <span>Custom Voices</span>
            </button>
            <button
              type="button"
              className={`tts-mode-tab ${currentTab === 'my-voices' ? 'active' : ''}`}
              onClick={() => switchTab('my-voices')}
            >
              <Layers size={14} />
              <span>My Voices</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      {currentTab === 'cloning' && <VoiceCloning onProfileSaved={() => switchTab('my-voices')} />}
      {currentTab === 'design' && <VoiceDesign onProfileSaved={() => switchTab('my-voices')} />}
      {currentTab === 'custom' && <CustomVoices onProfileSaved={() => switchTab('my-voices')} />}
      {currentTab === 'my-voices' && <MyVoices onNavigateTab={switchTab} />}
    </div>
  );
}

export default VoiceStudioPage;
