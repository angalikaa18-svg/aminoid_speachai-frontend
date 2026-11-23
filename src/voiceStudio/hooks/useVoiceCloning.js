import { useState, useCallback, useEffect, useRef } from 'react';
import qwenVoiceApi from '../services/qwenVoiceApi';
import { getAudioDuration, validateAudioFile } from '../utils/audioUtils';

export function useVoiceCloning() {
  const [audioFile, setAudioFile] = useState(null);
  const [refAudioUrl, setRefAudioUrl] = useState(null);
  const refUrlRef = useRef(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [refTranscript, setRefTranscript] = useState('');
  const [targetText, setTargetText] = useState('Hello, this is my cloned voice running through AMINOID Voice Studio.');
  const [selectedModel, setSelectedModel] = useState('Qwen/Qwen3-TTS-12Hz-0.6B-Base');
  const [language, setLanguage] = useState('Auto');
  const [xVectorOnly, setXVectorOnly] = useState(false);

  // States
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [cloneResult, setCloneResult] = useState(null);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [backendEndpointAvailable, setBackendEndpointAvailable] = useState(null);

  // Audio Selection
  const handleSelectAudio = useCallback(async (file) => {
    setError(null);
    const val = validateAudioFile(file);
    if (!val.valid) {
      setError(val.error);
      return;
    }

    if (refUrlRef.current) {
      URL.revokeObjectURL(refUrlRef.current);
    }
    const newUrl = URL.createObjectURL(file);
    refUrlRef.current = newUrl;
    setRefAudioUrl(newUrl);

    setAudioFile(file);
    const dur = await getAudioDuration(file);
    setAudioDuration(dur);
  }, []);

  // Clear Audio
  const clearAudio = useCallback(() => {
    if (refUrlRef.current) {
      URL.revokeObjectURL(refUrlRef.current);
      refUrlRef.current = null;
    }
    setRefAudioUrl(null);
    setAudioFile(null);
    setAudioDuration(0);
    setRefTranscript('');
    setCloneResult(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refUrlRef.current) {
        URL.revokeObjectURL(refUrlRef.current);
      }
    };
  }, []);

  // Automatic Transcription using real local Faster-Whisper
  const autoTranscribe = useCallback(async () => {
    if (!audioFile) {
      setError('Please select or record a reference audio file first.');
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setStatusMessage('Transcribing reference audio via local Faster-Whisper...');

    try {
      const res = await qwenVoiceApi.autoTranscribeReferenceAudio(audioFile);
      if (res.text) {
        setRefTranscript(res.text.trim());
        setStatusMessage('Reference transcript auto-detected successfully!');
      } else {
        setStatusMessage('No speech detected in reference audio.');
      }
    } catch (err) {
      setError(err.message || 'Auto-transcription failed. Please enter transcript manually.');
    } finally {
      setIsTranscribing(false);
    }
  }, [audioFile]);

  // Clone Voice Synthesis
  const cloneVoice = useCallback(async () => {
    if (!audioFile) {
      setError('Reference audio is required for voice cloning.');
      return;
    }
    if (!xVectorOnly && !refTranscript.trim()) {
      setError('Reference transcript is required when using In-Context Learning (ICL) mode.');
      return;
    }
    if (!targetText.trim()) {
      setError('Target text to synthesize is required.');
      return;
    }

    setIsCloning(true);
    setError(null);
    setBackendEndpointAvailable(null);
    setStatusMessage('Preparing reference audio and extracting speaker acoustic embedding...');

    const formData = new FormData();
    formData.append('audio_file', audioFile);
    formData.append('text', targetText.trim());
    formData.append('language', language);
    formData.append('x_vector_only', String(xVectorOnly));
    formData.append('model_id', selectedModel);
    if (!xVectorOnly && refTranscript.trim()) {
      formData.append('ref_text', refTranscript.trim());
    }

    try {
      const res = await qwenVoiceApi.generateVoiceClone(formData);
      setCloneResult(res.data);
      setBackendEndpointAvailable(true);
      setStatusMessage('Voice cloned successfully!');
    } catch (err) {
      const statusCode = err.response ? err.response.status : err.status;
      if (statusCode === 404) {
        setError('Voice cloning endpoint not found (HTTP 404). Please ensure the backend is running.');
      } else {
        const errMsg = err.response?.data?.detail || err.message || 'Voice cloning failed.';
        setError(errMsg);
      }
    } finally {
      setIsCloning(false);
    }
  }, [audioFile, xVectorOnly, refTranscript, targetText, language, selectedModel]);

  return {
    audioFile,
    refAudioUrl,
    audioDuration,
    refTranscript,
    setRefTranscript,
    targetText,
    setTargetText,
    selectedModel,
    setSelectedModel,
    language,
    setLanguage,
    xVectorOnly,
    setXVectorOnly,
    isTranscribing,
    isCloning,
    cloneResult,
    similarityData: cloneResult?.similarity || null,
    validationMeta: cloneResult?.validation || null,
    error,
    statusMessage,
    backendEndpointAvailable,
    handleSelectAudio,
    clearAudio,
    autoTranscribe,
    cloneVoice,
  };
}

export default useVoiceCloning;
