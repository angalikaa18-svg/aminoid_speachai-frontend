import { useState, useCallback } from 'react';
import qwenVoiceApi from '../services/qwenVoiceApi';

export function useVoiceDesign() {
  const [description, setDescription] = useState(
    'Create a warm, natural Indian English female voice suitable for a professional AI receptionist. Friendly, confident, clear pronunciation, medium pitch, natural conversational speed, and smooth delivery.'
  );
  const [text, setText] = useState(
    'Hello! Thank you for calling Aminoid AI Studio. How may I direct your call today?'
  );
  const [selectedModel, setSelectedModel] = useState('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign');
  const [language, setLanguage] = useState('English');

  const [isGenerating, setIsGenerating] = useState(false);
  const [designResult, setDesignResult] = useState(null);
  const [error, setError] = useState(null);
  const [backendEndpointAvailable, setBackendEndpointAvailable] = useState(null);

  const generateVoice = useCallback(async () => {
    if (!description.trim()) {
      setError('Voice description instruction is required.');
      return;
    }
    if (!text.trim()) {
      setError('Text to synthesize is required.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const payload = {
      instruct: description.trim(),
      text: text.trim(),
      language,
      model_id: selectedModel,
    };

    try {
      const res = await qwenVoiceApi.generateVoiceDesign(payload);
      setDesignResult(res.data);
      setBackendEndpointAvailable(true);
    } catch (err) {
      const statusCode = err.response ? err.response.status : err.status;
      if (statusCode === 404) {
        setError('Voice design endpoint not found (HTTP 404). Please ensure the backend is running.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Voice design generation failed.');
      }
    } finally {
      setIsGenerating(false);
    }
  }, [description, text, language, selectedModel]);

  return {
    description,
    setDescription,
    text,
    setText,
    selectedModel,
    setSelectedModel,
    language,
    setLanguage,
    isGenerating,
    designResult,
    error,
    backendEndpointAvailable,
    generateVoice,
  };
}

export default useVoiceDesign;
