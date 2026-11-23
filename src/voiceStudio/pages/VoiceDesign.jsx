import React from 'react';
import { Wand2 } from 'lucide-react';
import VoiceDesignPanel from '../components/VoiceDesignPanel';

export function VoiceDesign({ onProfileSaved }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Wand2 size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Qwen3 Voice Design Studio</span>
          </div>
          <span className="badge badge-mint">Natural Language Prompt-to-Voice</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Design new artificial voices using natural language descriptions. Specify age, pitch, accent, warmth, and emotion, and synthesize speech matching your design.
        </p>
      </div>

      <VoiceDesignPanel onProfileSaved={onProfileSaved} />
    </div>
  );
}

export default VoiceDesign;
