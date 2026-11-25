import apiClient from './apiClient';

export const systemApi = {
  async getMetrics() {
    const response = await apiClient.get('/api/v1/system/metrics', { timeout: 15000 });
    return response.data;
  },

  async getStats() {
    const response = await apiClient.get('/api/v1/system/stats', { timeout: 15000 });
    return response.data;
  },
};

export default systemApi;
