import apiClient from './apiClient';

export const settingsApi = {
  async getSettings() {
    const response = await apiClient.get('/api/v1/settings', { timeout: 15000 });
    return response.data;
  },

  async saveSettings(settings) {
    const response = await apiClient.post('/api/v1/settings', settings, { timeout: 15000 });
    return response.data;
  },

  async resetSettings() {
    const response = await apiClient.post('/api/v1/settings/reset', {}, { timeout: 15000 });
    return response.data;
  },
};

export default settingsApi;
