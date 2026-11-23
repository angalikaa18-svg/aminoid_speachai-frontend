import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Download, RotateCcw } from 'lucide-react';
import { formatDuration } from '../utils/formatDuration';
import { downloadUrl } from '../utils/downloadFile';
import AudioWaveform from './AudioWaveform';

export function AudioPlayer({
  src,
  waveformData = [],
  title = '',
  downloadFilename = 'audio.wav',
  onEnded = null,
  playerId = null,
  activePlayerId = null,
  onPlay = null,
  compact = false,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [src]);

  // Exclusive playback: if another player becomes active, pause this one
  useEffect(() => {
    if (activePlayerId !== null && playerId !== null && activePlayerId !== playerId) {
      if (isPlaying) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      }
    }
  }, [activePlayerId, playerId, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (onPlay && playerId) {
        onPlay(playerId);
      }
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration || 0);
    }
  };

  const handleSeek = (newTime) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const restartAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      setCurrentTime(0);
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`audio-player-card ${compact ? 'audio-player-compact' : ''}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => {
          setIsPlaying(true);
          if (onPlay && playerId) onPlay(playerId);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
      />

      {/* Waveform Visualization */}
      <AudioWaveform
        waveformData={waveformData}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        height={compact ? 36 : 56}
      />

      {/* Controls Row */}
      <div className="audio-player-controls">
        <button
          className="play-pause-btn"
          onClick={togglePlay}
          title={isPlaying ? 'Pause' : 'Play'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={restartAudio}
          title="Restart"
          aria-label="Restart"
        >
          <RotateCcw size={16} />
        </button>

        <button
          className="btn btn-ghost btn-sm"
          onClick={stopAudio}
          title="Stop"
          aria-label="Stop"
        >
          <Square size={14} style={{ fill: 'currentColor' }} />
        </button>

        {/* Time slider */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="timeline-slider"
          aria-label="Seek time"
        />

        <div className="time-display">
          <span>{formatDuration(currentTime)}</span>
          <span style={{ margin: '0 4px', color: 'var(--color-moss-green)' }}>/</span>
          <span>{formatDuration(duration)}</span>
        </div>

        {/* Volume */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 100 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={toggleMute}
            style={{ padding: 4 }}
            aria-label="Mute toggle"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            style={{ width: 60 }}
            aria-label="Volume"
          />
        </div>

        {/* Download Button */}
        {src && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadUrl(src, downloadFilename)}
            title="Download Audio"
          >
            <Download size={15} />
            <span>Download</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default AudioPlayer;
