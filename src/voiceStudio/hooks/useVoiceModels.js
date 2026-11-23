import { useState, useEffect, useCallback } from 'react';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function useVoiceModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await qwenVoiceApi.getModels();
      setModels(data);
    } catch (err) {
      setError(err.message || 'Failed to load model status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    loading,
    error,
    refreshModels: fetchModels,
  };
}

export default useVoiceModels;
