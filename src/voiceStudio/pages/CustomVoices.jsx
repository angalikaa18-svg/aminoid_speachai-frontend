import React from 'react';
import { Users } from 'lucide-react';
import CustomVoicePanel from '../components/CustomVoicePanel';

export function CustomVoices({ onProfileSaved }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Users size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Qwen3 Custom Voice Catalog</span>
          </div>
          <span className="badge badge-mint">Curated Speaker Personas</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Browse curated voice personas and control their emotional expression with natural language instructions.
          Save favorite personas to your library for automated call workflows and assistant responses.
        </p>
      </div>

      <CustomVoicePanel onProfileSaved={onProfileSaved} />
    </div>
  );
}

export default CustomVoices;
