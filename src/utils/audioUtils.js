/**
 * Decodes an Audio File or Blob in the browser to extract real waveform amplitude bars.
 * 100% client-side Web Audio API; nothing is sent to external servers.
 * @param {File|Blob} audioFile 
 * @param {number} barCount 
 * @returns {Promise<number[]>} Array of normalized amplitudes (0.0 to 1.0)
 */
export async function extractWaveformData(audioFile, barCount = 64) {
  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      return fallbackWaveform(barCount);
    }
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Get channel data (mono or left channel)
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / barCount);
    const waveform = [];

    for (let i = 0; i < barCount; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[blockStart + j]);
      }
      waveform.push(sum / blockSize);
    }

    // Normalize to 0.1 - 1.0 range
    const maxVal = Math.max(...waveform) || 1;
    const normalized = waveform.map((val) => Math.max(0.12, Math.min(1.0, val / maxVal)));

    audioCtx.close();
    return normalized;
  } catch (err) {
    console.warn('AudioContext decode error, using fallback waveform:', err);
    return fallbackWaveform(barCount);
  }
}

function fallbackWaveform(barCount) {
  // Generate deterministic subtle waveform bars for preview when audio decoding fails
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    const v = Math.sin((i / barCount) * Math.PI * 4) * 0.35 + 0.45;
    bars.push(Math.max(0.15, Math.min(0.9, v)));
  }
  return bars;
}
