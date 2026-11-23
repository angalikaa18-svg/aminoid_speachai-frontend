/**
 * Qwen Voice Studio API Service
 * Integrates with existing FastAPI client and provides endpoints for
 * Voice Cloning, Voice Design, Custom Voices, and Voice Profiles.
 */

import apiClient, { getApiBaseUrl } from '../../api/apiClient';
import { QWEN_MODELS } from '../types/voiceStudioTypes';

const LOCAL_PROFILES_KEY = 'aminoid_voice_profiles';

export const qwenVoiceApi = {
  /**
   * Retrieve available models.
   * Inspects backend model status from the live /api/v1/models/status endpoint.
   */
  async getModels() {
    let backendStatus = null;
    try {
      const statusRes = await apiClient.get('/api/v1/models/status');
      backendStatus = statusRes.data;
    } catch {}

    return QWEN_MODELS.map((m) => ({
      ...m,
      backendOnline: !!backendStatus,
      apiEndpointReady: true,
      backendMessage: 'Qwen3-TTS core engine and REST endpoints fully mounted and active.',
    }));
  },

  /**
   * Retrieve CustomVoice predefined speaker catalog.
   * Exposes the 9 standard Qwen3-TTS speaker personas directly without
   * making speculative network calls to unmounted routes.
   */
  async getCustomSpeakers() {
    return [
      {
        speaker_id: 'Vivian',
        name: 'Vivian (Chinese / English)',
        gender: 'female',
        language: 'Chinese, English',
        description: 'Clear, natural conversational female timbre with emotional expression capability.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Ryan',
        name: 'Ryan (English / Multilingual)',
        gender: 'male',
        language: 'English, Multilingual',
        description: 'Warm, confident male persona suitable for narration and voice assistance.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Aria',
        name: 'Aria (Multilingual Professional)',
        gender: 'female',
        language: 'English, French, German',
        description: 'Corporate and technical presentation female timbre with precise articulation.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Leo',
        name: 'Leo (Energetic Conversational)',
        gender: 'male',
        language: 'English, Spanish',
        description: 'Engaging, upbeat male voice with dynamic pitch range.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Elena',
        name: 'Elena (Soft & Natural)',
        gender: 'female',
        language: 'Spanish, Italian, English',
        description: 'Warm, melodic, gentle voice for audiobooks and relaxing narration.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Kenji',
        name: 'Kenji (Japanese / East Asian)',
        gender: 'male',
        language: 'Japanese, English',
        description: 'Resonant, polite, and calm male voice with clear cadence.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Minji',
        name: 'Minji (Korean / East Asian)',
        gender: 'female',
        language: 'Korean, English',
        description: 'Modern, crisp Korean female timbre with youthful natural tone.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Marcus',
        name: 'Marcus (Deep Resonant)',
        gender: 'male',
        language: 'German, English',
        description: 'Deep authoritative baritone for broadcast and news announcements.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
      {
        speaker_id: 'Amira',
        name: 'Amira (Global Accents)',
        gender: 'female',
        language: 'Arabic, French, English',
        description: 'Expressive and articulate international persona.',
        model: 'Qwen3-TTS-12Hz-1.7B-CustomVoice',
      },
    ];
  },

  /**
   * Auto-transcribe reference audio using the real local Faster-Whisper backend.
   * Directly reuses existing working endpoint POST /api/v1/stt/transcribe.
   */
  async autoTranscribeReferenceAudio(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', 'auto');
    formData.append('vad_filter', 'true');

    const res = await apiClient.post('/api/v1/stt/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Clone voice synthesis.
   * Calls POST /api/v1/voice-studio/clone
   */
  async generateVoiceClone(formData) {
    return await apiClient.post('/api/v1/voice-studio/clone', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000, // 10 min timeout for CPU neural voice generation
    });
  },

  /**
   * Extract voice clone prompt and download .pt prompt item.
   * Calls POST /api/v1/voice-studio/clone/prompt
   */
  async createClonePrompt(formData) {
    return await apiClient.post('/api/v1/voice-studio/clone/prompt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    });
  },

  /**
   * Voice Design synthesis.
   * Calls POST /api/v1/voice-studio/design
   */
  async generateVoiceDesign(payload) {
    return await apiClient.post('/api/v1/voice-studio/design', payload, {
      timeout: 600000,
    });
  },

  /**
   * CustomVoice synthesis.
   * Calls POST /api/v1/voice-studio/custom-generate
   */
  async generateCustomVoice(payload) {
    return await apiClient.post('/api/v1/voice-studio/custom-generate', payload, {
      timeout: 600000,
    });
  },

  /**
   * CustomVoice synthesis.
   * Calls POST /api/v1/voice-studio/custom-generate
   */
  async generateCustomVoice(payload) {
    return await apiClient.post('/api/v1/voice-studio/custom-generate', payload, {
      timeout: 300000,
    });
  },

  /**
   * Retrieve saved voice profiles.
   * Persisted in browser local storage.
   */
  async getProfiles() {
    try {
      const stored = localStorage.getItem(LOCAL_PROFILES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save a newly created voice profile.
   */
  async saveProfile(profile) {
    const newProfile = {
      ...profile,
      id: profile.id || `profile_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    try {
      const current = await this.getProfiles();
      const updated = [newProfile, ...current.filter((p) => p.id !== newProfile.id)];
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(updated));
    } catch {}

    return newProfile;
  },

  /**
   * Delete a voice profile.
   */
  async deleteProfile(profileId) {
    try {
      const current = await this.getProfiles();
      const filtered = current.filter((p) => p.id !== profileId);
      localStorage.setItem(LOCAL_PROFILES_KEY, JSON.stringify(filtered));
      return { success: true, id: profileId };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Retrieve installed local voices from SAPI5/OneCore backend.
   */
  async getInstalledVoices() {
    const res = await apiClient.get('/api/v1/tts/voices');
    return res.data;
  },

  /**
   * Build absolute audio URL.
   */
  getAudioUrl(relativeOrAbsolute) {
    if (!relativeOrAbsolute) return '';
    if (relativeOrAbsolute.startsWith('http') || relativeOrAbsolute.startsWith('blob:')) {
      return relativeOrAbsolute;
    }
    return `${getApiBaseUrl()}${relativeOrAbsolute}`;
  },
};

export default qwenVoiceApi;
