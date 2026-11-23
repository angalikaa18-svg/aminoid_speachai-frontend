import { useState, useEffect, useCallback } from 'react';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function useCustomVoices() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [text, setText] = useState('Welcome to Aminoid Custom Voice studio. How may I help you today?');
  const [instruct, setInstruct] = useState('');
  const [language, setLanguage] = useState('English');

  const [isGenerating, setIsGenerating] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendEndpointAvailable, setBackendEndpointAvailable] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  const loadSpeakers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await qwenVoiceApi.getCustomSpeakers();
      setSpeakers(list);
      setSelectedSpeaker((prev) => prev || list[0] || null);
    } catch (err) {
      setError(err.message || 'Failed to load speaker catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpeakers();
  }, [loadSpeakers]);

  const generateVoice = useCallback(async () => {
    if (!selectedSpeaker) {
      setError('Please select a speaker persona.');
      return;
    }
    if (!text.trim()) {
      setError('Text to synthesize is required.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const payload = {
      speaker: selectedSpeaker.speaker_id || selectedSpeaker.name,
      text: text.trim(),
      instruct: instruct.trim() || undefined,
      language,
    };

    try {
      const res = await qwenVoiceApi.generateCustomVoice(payload);
      setCustomResult(res.data);
      setBackendEndpointAvailable(true);
    } catch (err) {
      const statusCode = err.response ? err.response.status : err.status;
      if (statusCode === 404) {
        setError('Custom voice generation endpoint not found (HTTP 404). Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Custom voice generation failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSpeaker, text, instruct, language]);

  // Filtered speakers
  const filteredSpeakers = speakers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.language.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender =
      genderFilter === 'all' || s.gender?.toLowerCase() === genderFilter.toLowerCase();
    return matchesSearch && matchesGender;
  });

  return {
    speakers,
    filteredSpeakers,
    loading,
    selectedSpeaker,
    setSelectedSpeaker,
    text,
    setText,
    instruct,
    setInstruct,
    language,
    setLanguage,
    searchQuery,
    setSearchQuery,
    genderFilter,
    setGenderFilter,
    isGenerating,
    customResult,
    error,
    backendEndpointAvailable,
    generateVoice,
  };
}

export default useCustomVoices;
