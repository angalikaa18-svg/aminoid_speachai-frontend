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

  async getHistory(category = 'all', q = '', limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    params.set('limit', limit);
    params.set('offset', offset);
    const response = await apiClient.get(`/api/v1/history?${params.toString()}`);
    return response.data;
  },

  async deleteHistoryItem(category, itemId) {
    const response = await apiClient.delete(`/api/v1/history/${category}/${encodeURIComponent(itemId)}`);
    return response.data;
  },

  async clearHistory(category = 'all') {
    const response = await apiClient.delete(`/api/v1/history/clear?category=${encodeURIComponent(category)}`);
    return response.data;
  },
};

export default historyApi;
