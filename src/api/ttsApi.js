import apiClient, { getApiBaseUrl } from './apiClient';

export const ttsApi = {
  /**
   * Synthesize text into local speech audio.
   * @param {Object} params
   * @param {string} params.text
   * @param {string} [params.voice_id]
   * @param {number} [params.rate] (100-250 wpm, default 175)
   * @param {number} [params.volume] (0.0-1.0, default 1.0)
   * @param {number} [params.pitch] (0-100, default 50)
   */
  async generateSpeech({ text, voice_id = null, rate = 175, volume = 1.0, pitch = 50 }) {
    const payload = {
      text,
      rate: Number(rate),
      volume: Number(volume),
      pitch: Number(pitch),
    };
    if (voice_id) {
      payload.voice_id = voice_id;
    }

    const response = await apiClient.post('/api/v1/tts/generate', payload);
    const data = response.data;

    // Build absolute URL for the audio player
    if (data.audio_url && !data.audio_url.startsWith('http')) {
      data.full_audio_url = `${getApiBaseUrl()}${data.audio_url}`;
    } else {
      data.full_audio_url = data.audio_url;
    }

    return data;
  },

  async getVoices() {
    const response = await apiClient.get('/api/v1/tts/voices');
    return response.data;
  },

  async getLanguages() {
    const response = await apiClient.get('/api/v1/tts/languages');
    return response.data;
  },

  async getHistory() {
    const response = await apiClient.get('/api/v1/tts/history');
    return response.data;
  },

  getAudioUrl(filename) {
    if (!filename) return '';
    return `${getApiBaseUrl()}/api/v1/tts/audio/${filename}`;
  },
};

export default ttsApi;
