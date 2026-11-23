import { useState, useEffect, useCallback } from 'react';
import healthApi from '../api/healthApi';
import modelApi from '../api/modelApi';

export function useHealth(pollIntervalMs = 12000) {
  const [status, setStatus] = useState('connecting'); // 'connected' | 'connecting' | 'disconnected' | 'error'
  const [healthData, setHealthData] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const [failCount, setFailCount] = useState(0);

  const checkHealth = useCallback(async () => {
    try {
      const [hData, mData] = await Promise.all([
        healthApi.getHealth(),
        modelApi.getStatus().catch(() => null),
      ]);

      setHealthData(hData);
      setModelStatus(mData);
      setStatus('connected');
      setLastChecked(new Date());
      setErrorMessage(null);
      setFailCount(0);
    } catch (err) {
      setFailCount((prev) => {
        const next = prev + 1;
        // Only mark disconnected after 4 consecutive health check failures to prevent false negatives during heavy CPU neural synthesis
        if (next >= 4) {
          setStatus('disconnected');
          setErrorMessage(err.message || 'Cannot reach local backend server');
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    if (!pollIntervalMs) return;
    const interval = setInterval(checkHealth, pollIntervalMs);
    return () => clearInterval(interval);
  }, [checkHealth, pollIntervalMs]);

  return {
    status,
    healthData,
    modelStatus,
    lastChecked,
    errorMessage,
    refreshHealth: checkHealth,
  };
}

export default useHealth;
