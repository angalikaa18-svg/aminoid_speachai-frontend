import apiClient from './apiClient';

export const historyApi = {
  async getSTTHistory() {
    const response = await apiClient.get('/api/v1/stt/history');
    return response.data;
  },

  async getTTSHistory() {
    const response = await apiClient.get('/api/v1/tts/history');
    return response.data;
  },
};

export default historyApi;
