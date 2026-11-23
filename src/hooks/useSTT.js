import { useState, useEffect, useCallback, useRef } from 'react';
import sttApi from '../api/sttApi';
import { extractWaveformData } from '../utils/audioUtils';
import { downloadText } from '../utils/downloadFile';
import { isAudioFormatSupported } from '../utils/validators';

export function useSTT() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileAudioUrl, setFileAudioUrl] = useState(null);
  const [waveformData, setWaveformData] = useState([]);
  const [audioDuration, setAudioDuration] = useState(0);

  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [vadFilter, setVadFilter] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Audio Recording with Microphone
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Fetch supported languages and models from backend
  useEffect(() => {
    let mounted = true;
    Promise.all([
      sttApi.getLanguages().catch(() => []),
      sttApi.getModels().catch(() => []),
    ]).then(([langs, mods]) => {
      if (!mounted) return;
      if (Array.isArray(langs)) setLanguages(langs);
      if (Array.isArray(mods) && mods.length > 0) {
        setModels(mods);
        setSelectedModel(mods[0].id);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Handle file select
  const handleSelectFile = useCallback(async (file) => {
    if (!file) return;
    if (!isAudioFormatSupported(file.name)) {
      setError(`Unsupported format "${file.name}". Supported formats: WAV, MP3, FLAC, OGG, M4A, WebM, AAC, WMA.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResult(null);

    const blobUrl = URL.createObjectURL(file);
    setFileAudioUrl(blobUrl);

    // Read audio duration
    const tempAudio = new Audio(blobUrl);
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(tempAudio.duration || 0);
    };

    // Extract real waveform bars via Web Audio API
    try {
      const bars = await extractWaveformData(file, 64);
      setWaveformData(bars);
    } catch {
      setWaveformData([]);
    }
  }, []);

  const clearFile = useCallback(() => {
    if (fileAudioUrl) {
      URL.revokeObjectURL(fileAudioUrl);
    }
    setSelectedFile(null);
    setFileAudioUrl(null);
    setWaveformData([]);
    setAudioDuration(0);
    setResult(null);
    setError(null);
  }, [fileAudioUrl]);

  // Start Mic Recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const recordedFile = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' });
        handleSelectFile(recordedFile);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone permission denied or microphone not found: ' + err.message);
    }
  }, [handleSelectFile]);

  // Stop Mic Recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  }, [isRecording]);

  // Execute Transcription
  const transcribe = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select or record an audio file first.');
      return;
    }

    setIsTranscribing(true);
    setError(null);
    setProgress(10);

    try {
      const data = await sttApi.transcribeAudio(
        selectedFile,
        selectedLanguage === 'auto' ? null : selectedLanguage,
        vadFilter,
        selectedModel || null,
        (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(Math.min(90, percent));
          }
        }
      );

      setProgress(100);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, selectedLanguage, vadFilter, selectedModel]);

  // Export actions
  const downloadTXT = useCallback(() => {
    if (!result?.text) return;
    downloadText(result.text, 'transcript.txt');
  }, [result]);

  const downloadSRT = useCallback(() => {
    if (!result?.srt) return;
    downloadText(result.srt, 'transcript.srt');
  }, [result]);

  const downloadJSON = useCallback(() => {
    if (!result) return;
    downloadText(JSON.stringify(result, null, 2), 'transcript.json', 'application/json');
  }, [result]);

  const copyTranscript = useCallback(async () => {
    if (!result?.text) return false;
    await navigator.clipboard.writeText(result.text);
    return true;
  }, [result]);

  return {
    selectedFile,
    fileAudioUrl,
    waveformData,
    audioDuration,
    languages,
    selectedLanguage,
    setSelectedLanguage,
    vadFilter,
    setVadFilter,
    models,
    selectedModel,
    setSelectedModel,
    isTranscribing,
    progress,
    result,
    error,
    isRecording,
    recordingSeconds,
    handleSelectFile,
    clearFile,
    startRecording,
    stopRecording,
    transcribe,
    downloadTXT,
    downloadSRT,
    downloadJSON,
    copyTranscript,
  };
}

export default useSTT;
