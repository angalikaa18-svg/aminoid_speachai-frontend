import React, { useRef, useEffect } from 'react';

/**
 * Interactive Audio Waveform Canvas Component
 * AMINOID Brand Palette:
 * - Active: #4BA69A (Accent)
 * - Inactive: #E8E0D0 (Secondary Background)
 * - Playhead: #174C4B (Primary Brand)
 * - Background: #FAF9F5
 */
export function AudioWaveform({
  waveformData = [],
  currentTime = 0,
  duration = 0,
  onSeek = null,
  height = 64,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const canvasHeight = canvas.height;

    // Clear background: Soft light surface
    ctx.fillStyle = '#FAF9F5';
    ctx.fillRect(0, 0, width, canvasHeight);

    if (!waveformData || waveformData.length === 0) {
      // Draw subtle empty baseline in border tone
      ctx.strokeStyle = '#E8E0D0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvasHeight / 2);
      ctx.lineTo(width, canvasHeight / 2);
      ctx.stroke();
      return;
    }

    const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
    const barCount = waveformData.length;
    const totalSpacingRatio = 0.35; // 35% gap between bars
    const barWidth = (width / barCount) * (1 - totalSpacingRatio);
    const gap = (width / barCount) * totalSpacingRatio;

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap) + gap / 2;
      const amplitude = waveformData[i] || 0.1;
      const barHeight = Math.max(4, amplitude * (canvasHeight - 10));
      const y = (canvasHeight - barHeight) / 2;

      const barProgress = i / barCount;
      if (barProgress <= progress) {
        ctx.fillStyle = '#4BA69A'; // AMINOID Accent Active
      } else {
        ctx.fillStyle = '#E8E0D0'; // Inactive secondary tone
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }

    // Draw playhead cursor line in Primary Brand #174C4B
    if (progress > 0) {
      const cursorX = progress * width;
      ctx.strokeStyle = '#174C4B';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, canvasHeight);
      ctx.stroke();
    }
  }, [waveformData, currentTime, duration, height]);

  const handleCanvasClick = (e) => {
    if (!onSeek || !duration) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--radius-small)',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        backgroundColor: '#FAF9F5',
        cursor: onSeek && duration > 0 ? 'pointer' : 'default',
        padding: '6px 8px',
      }}
      onClick={handleCanvasClick}
    >
      <canvas
        ref={canvasRef}
        width={720}
        height={height}
        style={{ width: '100%', height: `${height}px`, display: 'block' }}
      />
    </div>
  );
}

export default AudioWaveform;
