import apiClient from './apiClient';

export const sttApi = {
  /**
   * Transcribe an audio file using local Whisper engine.
   * @param {File|Blob} file 
   * @param {string|null} language 
   * @param {boolean} vadFilter 
   * @param {string|null} model 
   * @param {Function} onUploadProgress 
   */
  async transcribeAudio(file, language = null, vadFilter = true, model = null, onUploadProgress = null) {
    const formData = new FormData();
    formData.append('file', file, file.name || 'recording.wav');
    if (language && language !== 'auto') {
      formData.append('language', language);
    }
    formData.append('vad_filter', String(vadFilter));
    if (model) {
      formData.append('model', model);
    }

    const response = await apiClient.post('/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return response.data;
  },

  async getLanguages() {
    const response = await apiClient.get('/api/v1/stt/languages');
    return response.data;
  },

  async getModels() {
    const response = await apiClient.get('/api/v1/stt/models');
    return response.data;
  },

  async getHistory() {
    const response = await apiClient.get('/api/v1/stt/history');
    return response.data;
  },
};

export default sttApi;
