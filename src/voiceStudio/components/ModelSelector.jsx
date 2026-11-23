import React from 'react';
import { Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QWEN_MODELS } from '../types/voiceStudioTypes';

export function ModelSelector({ selectedModelId, onSelectModel, targetType = 'all' }) {
  const filteredModels = QWEN_MODELS.filter((m) => {
    if (targetType === 'all') return true;
    return m.type === targetType;
  });

  const activeModel = QWEN_MODELS.find((m) => m.id === selectedModelId) || filteredModels[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={15} style={{ color: 'var(--color-mint-green)' }} />
          <span>Active Qwen3-TTS Model</span>
        </label>
        {activeModel && (
          <span className="badge badge-moss" style={{ fontSize: 11, padding: '2px 8px' }}>
            {activeModel.size}
          </span>
        )}
      </div>

      <select
        value={selectedModelId || (activeModel?.id || '')}
        onChange={(e) => onSelectModel(e.target.value)}
        style={{ margin: 0 }}
      >
        {filteredModels.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} — ({m.device})
          </option>
        ))}
      </select>

      {activeModel && (
        <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-forest-black)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-moss-border)', fontSize: 11 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ color: 'var(--color-mist-white)', fontWeight: 600 }}>Architecture:</span>
            <span style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
              12Hz Speech Tokenizer Multi-Codebook
            </span>
          </div>
          <div style={{ color: 'var(--color-text-muted)' }}>
            Hardware: {activeModel.device} • {activeModel.status}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelSelector;
