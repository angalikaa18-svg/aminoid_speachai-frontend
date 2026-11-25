import React from 'react';
import { Volume2, Trash2, Download, Play, Sparkles, Mic, Layers, Cpu } from 'lucide-react';
import AudioPlayer from '../../components/AudioPlayer';
import { downloadUrl } from '../../utils/downloadFile';

export function VoiceCard({
  voice,
  activePlayingId,
  onPlay,
  onDelete,
  onUseInStudio,
}) {
  const getTypeBadge = (type) => {
    switch (type) {
      case 'cloned':
        return <span className="badge badge-mint" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mic size={11} /> Cloned Voice</span>;
      case 'designed':
        return <span className="badge" style={{ backgroundColor: 'rgba(75, 166, 154, 0.15)', color: 'var(--color-primary)', border: '1px solid var(--color-accent)', display: 'flex', alignItems: 'center', gap: 4 }}><Sparkles size={11} /> Designed Voice</span>;
      case 'custom_voice':
        return <span className="badge badge-moss" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> Custom Persona</span>;
      default:
        return <span className="badge badge-moss" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={11} /> Installed Voice</span>;
    }
  };

  return (
    <div
      className="studio-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: 16, margin: 0, color: 'var(--color-mist-white)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {voice.name}
          </h4>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {voice.language || 'English'}
            </span>
            {voice.gender && (
              <>
                <span style={{ color: 'var(--color-moss-border)' }}>•</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  {voice.gender}
                </span>
              </>
            )}
            {voice.engine && (
              <>
                <span style={{ color: 'var(--color-moss-border)' }}>•</span>
                <span className="badge badge-moss" style={{ fontSize: 10, padding: '1px 5px' }}>
                  {voice.engine}
                </span>
              </>
            )}
          </div>
        </div>

        {getTypeBadge(voice.type)}
      </div>

      {voice.description && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          "{voice.description}"
        </p>
      )}

      {/* Audio Sample Player if available */}
      {voice.audioUrl && (
        <div style={{ marginTop: 4 }}>
          <AudioPlayer
            src={voice.audioUrl}
            downloadFilename={`${voice.name}.wav`}
            playerId={voice.id}
            activePlayerId={activePlayingId}
            onPlay={onPlay}
            compact={true}
          />
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
          {voice.createdAt ? new Date(voice.createdAt).toLocaleDateString() : 'Installed Voice'}
        </span>

        <div style={{ display: 'flex', gap: 6 }}>
          {onUseInStudio && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onUseInStudio(voice)}
              title="Use in Voice Studio"
              style={{ padding: '5px 10px', fontSize: 12 }}
            >
              <Volume2 size={13} />
              <span>Use</span>
            </button>
          )}

          {voice.audioUrl && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => downloadUrl(voice.audioUrl, `${voice.name}.wav`)}
              title="Download Audio"
              style={{ padding: 6 }}
            >
              <Download size={14} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onDelete(voice.id)}
              title="Delete Profile"
              style={{ padding: 6, color: 'var(--color-danger)' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceCard;
