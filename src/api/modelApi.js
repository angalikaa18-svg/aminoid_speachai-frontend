import apiClient from './apiClient';

export const modelApi = {
  async getStatus() {
    const response = await apiClient.get('/api/v1/models/status', { timeout: 25000 });
    return response.data;
  },

  async getModelsCatalog() {
    const response = await apiClient.get('/api/v1/models', { timeout: 25000 });
    return response.data;
  },

  async getSTTModels() {
    const response = await apiClient.get('/api/v1/stt/models');
    return response.data;
  },

  async activateModel(modelId) {
    const response = await apiClient.post(`/api/v1/models/activate?model_id=${encodeURIComponent(modelId)}`);
    return response.data;
  },
};

export default modelApi;
