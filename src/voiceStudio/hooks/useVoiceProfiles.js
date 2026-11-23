import { useState, useEffect, useCallback } from 'react';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function useVoiceProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [installedVoices, setInstalledVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'cloned', 'designed', 'installed'

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [customProfiles, installed] = await Promise.all([
        qwenVoiceApi.getProfiles().catch(() => []),
        qwenVoiceApi.getInstalledVoices().catch(() => []),
      ]);
      setProfiles(customProfiles || []);
      setInstalledVoices(installed || []);
    } catch (err) {
      setError(err.message || 'Failed to load voice profiles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveProfile = useCallback(async (profile) => {
    const saved = await qwenVoiceApi.saveProfile(profile);
    setProfiles((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
    return saved;
  }, []);

  const deleteProfile = useCallback(async (profileId) => {
    await qwenVoiceApi.deleteProfile(profileId);
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  }, []);

  // Filtered list
  const filteredProfiles = profiles.filter((p) => {
    if (typeFilter === 'all') return true;
    return p.type === typeFilter;
  });

  return {
    profiles: filteredProfiles,
    allProfilesCount: profiles.length,
    installedVoices,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    saveProfile,
    deleteProfile,
    refreshProfiles: loadData,
  };
}

export default useVoiceProfiles;
