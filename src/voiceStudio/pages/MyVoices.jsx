import React, { useState } from 'react';
import { Layers, Trash2, Filter, RefreshCw, Volume2, Mic, Sparkles, Users } from 'lucide-react';
import VoiceCard from '../components/VoiceCard';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useVoiceProfiles } from '../hooks/useVoiceProfiles';
import { useToast } from '../../components/Toast';

export function MyVoices({ onNavigateTab }) {
  const { addToast } = useToast();
  const {
    profiles,
    allProfilesCount,
    installedVoices,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    deleteProfile,
    refreshProfiles,
  } = useVoiceProfiles();

  const [activePlayingId, setActivePlayingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteProfile(deletingId);
      addToast('Voice profile deleted successfully.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to delete profile.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Convert installed voices into display format if viewing installed
  const displayVoices = [
    ...profiles,
    ...(typeFilter === 'all' || typeFilter === 'installed'
      ? installedVoices.map((v) => ({
          id: v.id,
          name: v.name,
          type: 'installed',
          language: v.language,
          gender: v.gender,
          engine: v.engine || 'OneCore',
          description: `Installed system voice token on ${v.engine || 'local OS'}.`,
        }))
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Card */}
      <div className="studio-card">
        <div className="studio-card-header">
          <div className="studio-card-title">
            <Layers size={22} style={{ color: 'var(--color-mint-green)' }} />
            <span>My Voices & Profile Management</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={refreshProfiles}
              disabled={loading}
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          Manage your saved cloned voices, designed acoustic personas, and installed speech engines.
          All profiles are stored locally and accessible for automated speech workflows.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="studio-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div className="gender-pills">
            <button
              type="button"
              className={`gender-pill ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              All Voices ({displayVoices.length})
            </button>
            <button
              type="button"
              className={`gender-pill ${typeFilter === 'cloned' ? 'active' : ''}`}
              onClick={() => setTypeFilter('cloned')}
            >
              Cloned ({profiles.filter((p) => p.type === 'cloned').length})
            </button>
            <button
              type="button"
              className={`gender-pill ${typeFilter === 'designed' ? 'active' : ''}`}
              onClick={() => setTypeFilter('designed')}
            >
              Designed ({profiles.filter((p) => p.type === 'designed').length})
            </button>
            <button
              type="button"
              className={`gender-pill ${typeFilter === 'custom_voice' ? 'active' : ''}`}
              onClick={() => setTypeFilter('custom_voice')}
            >
              Custom Personas ({profiles.filter((p) => p.type === 'custom_voice').length})
            </button>
            <button
              type="button"
              className={`gender-pill ${typeFilter === 'installed' ? 'active' : ''}`}
              onClick={() => setTypeFilter('installed')}
            >
              Installed ({installedVoices.length})
            </button>
          </div>

          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Showing {displayVoices.length} profiles
          </span>
        </div>
      </div>

      {/* Voices Grid */}
      {loading ? (
        <LoadingState message="Loading saved voice profiles..." />
      ) : displayVoices.length === 0 ? (
        <EmptyState
          title="No Voice Profiles Found"
          description="Create a cloned voice or design a new synthetic timbre to save profiles here."
          icon={Layers}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {displayVoices.map((voice) => (
            <VoiceCard
              key={voice.id}
              voice={voice}
              activePlayingId={activePlayingId}
              onPlay={setActivePlayingId}
              onDelete={voice.type !== 'installed' ? () => setDeletingId(voice.id) : null}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Voice Profile"
        message="Are you sure you want to delete this voice profile? This action cannot be undone."
        confirmText="Delete Profile"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}

export default MyVoices;
