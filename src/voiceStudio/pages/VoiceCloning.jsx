import React from 'react';
import { Mic } from 'lucide-react';
import VoiceClonePanel from '../components/VoiceClonePanel';

export function VoiceCloning({ onProfileSaved }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Mic size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>Qwen3 Voice Cloning Studio</span>
          </div>
          <span className="badge badge-mint">Few-Shot & Zero-Shot Cloning</span>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Upload or record a 3 to 15 second sample of speech to extract speaker acoustic embeddings.
          Generate synthetic speech in any supported language with the cloned voice timbre.
        </p>
      </div>

      <VoiceClonePanel onProfileSaved={onProfileSaved} />
    </div>
  );
}

export default VoiceCloning;
