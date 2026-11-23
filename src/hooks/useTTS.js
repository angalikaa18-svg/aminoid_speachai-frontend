import { useState, useEffect, useCallback } from 'react';
import ttsApi from '../api/ttsApi';
import { downloadUrl } from '../utils/downloadFile';

export function useTTS() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [rate, setRate] = useState(175); // WPM (100 - 250)
  const [volume, setVolume] = useState(1.0); // 0.0 - 1.0
  const [pitch, setPitch] = useState(50); // 0 - 100

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [ttsHistory, setTtsHistory] = useState([]);

  // Fetch voices & history
  const loadVoicesAndHistory = useCallback(async () => {
    try {
      const [voicesData, histData] = await Promise.all([
        ttsApi.getVoices().catch(() => []),
        ttsApi.getHistory().catch(() => []),
      ]);

      if (Array.isArray(voicesData)) {
        setVoices(voicesData);
        if (voicesData.length > 0 && !selectedVoiceId) {
          setSelectedVoiceId(voicesData[0].id);
        }
      }
      if (Array.isArray(histData)) {
        setTtsHistory(histData);
      }
    } catch {
      // Ignored
    }
  }, [selectedVoiceId]);

  useEffect(() => {
    loadVoicesAndHistory();
  }, [loadVoicesAndHistory]);

  const generate = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter text to synthesize.');
      return;
    }
    if (trimmed.length > 5000) {
      setError('Text length exceeds maximum allowed 5,000 characters.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await ttsApi.generateSpeech({
        text: trimmed,
        voice_id: selectedVoiceId || null,
        rate,
        volume,
        pitch,
      });

      setResult(res);
      // Reload history
      ttsApi.getHistory().then((h) => {
        if (Array.isArray(h)) setTtsHistory(h);
      }).catch(() => {});
    } catch (err) {
      setError(err.message || 'Speech synthesis failed.');
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedVoiceId, rate, volume, pitch]);

  const downloadAudio = useCallback(() => {
    if (!result?.full_audio_url) return;
    downloadUrl(result.full_audio_url, result.filename || 'generated_speech.wav');
  }, [result]);

  const clearText = useCallback(() => {
    setText('');
    setError(null);
  }, []);

  return {
    text,
    setText,
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    rate,
    setRate,
    volume,
    setVolume,
    pitch,
    setPitch,
    isGenerating,
    result,
    error,
    ttsHistory,
    generate,
    downloadAudio,
    clearText,
    reloadVoices: loadVoicesAndHistory,
  };
}

export default useTTS;
