import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2 } from 'lucide-react';

export function AudioRecorder({ onRecorded, onClear, recordedFile }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        const file = new File([audioBlob], `recorded_reference_${Date.now()}.wav`, {
          type: 'audio/wav',
        });
        if (onRecorded) onRecorded(file);

        // Stop tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied or unavailable: ' + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleClear = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlaying(false);
    if (onClear) onClear();
  };

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && (
        <div style={{ color: 'var(--color-danger)', fontSize: 12, padding: 8, backgroundColor: 'var(--color-danger-bg)', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {!audioUrl ? (
        <div
          style={{
            padding: '24px 20px',
            backgroundColor: 'var(--color-forest-black)',
            border: isRecording ? '2px solid var(--color-mint-green)' : '1px dashed var(--color-moss-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            transition: 'border-color 0.2s',
          }}
        >
          {isRecording ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-dot status-loading" style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-mint-green)' }}>
                  Recording: {formatTimer(recordingSeconds)}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Speak clearly into your microphone (3-15 seconds recommended)
              </p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={stopRecording}
                style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                <Square size={14} style={{ fill: 'currentColor' }} />
                <span>Stop Recording</span>
              </button>
            </>
          ) : (
            <>
              <Mic size={28} style={{ color: 'var(--color-mint-green)' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mist-white)' }}>
                Record reference speech directly
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={startRecording}
              >
                <Mic size={14} />
                <span>Start Recording</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: 12,
            backgroundColor: 'var(--color-forest-black)',
            border: '1px solid var(--color-mint-green)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            style={{ display: 'none' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={togglePlayback}
              style={{ padding: '6px 10px' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play Recording'}</span>
            </button>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              Duration: {recordingSeconds}s
            </span>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleClear}
            title="Delete recording"
            style={{ padding: 6, color: 'var(--color-danger)' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
