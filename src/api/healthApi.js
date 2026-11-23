import apiClient from './apiClient';

export const healthApi = {
  async getHealth() {
    const response = await apiClient.get('/health', { timeout: 25000 });
    return response.data;
  },
};

export default healthApi;
