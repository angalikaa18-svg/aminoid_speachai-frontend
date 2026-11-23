/**
 * External Platform Integration & Webhook Studio API Client.
 * Connects the frontend to AMINOID Speech integration endpoints.
 */

import { apiClient, getApiBaseUrl } from './apiClient';

export const integrationApi = {
  // 1. Overview & Statistics
  async getOverview() {
    const res = await apiClient.get('/api/v1/integrations/overview');
    return res.data;
  },

  // 2. Connected Platforms
  async getPlatforms() {
    const res = await apiClient.get('/api/v1/integrations/platforms');
    return res.data;
  },

  async createPlatform(payload) {
    const res = await apiClient.post('/api/v1/integrations/platforms', payload);
    return res.data;
  },

  async updatePlatform(platformId, payload) {
    const res = await apiClient.put(`/api/v1/integrations/platforms/${platformId}`, payload);
    return res.data;
  },

  async deletePlatform(platformId) {
    const res = await apiClient.delete(`/api/v1/integrations/platforms/${platformId}`);
    return res.data;
  },

  async testPlatformConnection(platformId) {
    const res = await apiClient.post(`/api/v1/integrations/platforms/${platformId}/test`);
    return res.data;
  },

  async testArbitraryUrl(payload) {
    const res = await apiClient.post('/api/v1/integrations/platforms/test-url', payload);
    return res.data;
  },

  // 3. API Keys
  async getApiKeys() {
    const res = await apiClient.get('/api/v1/integrations/api-keys');
    return res.data;
  },

  async createApiKey(payload) {
    const res = await apiClient.post('/api/v1/integrations/api-keys', payload);
    return res.data;
  },

  async toggleApiKey(keyId, isActive) {
    const res = await apiClient.patch(`/api/v1/integrations/api-keys/${keyId}/toggle?is_active=${isActive}`);
    return res.data;
  },

  async revokeApiKey(keyId) {
    const res = await apiClient.delete(`/api/v1/integrations/api-keys/${keyId}`);
    return res.data;
  },

  // 4. Webhook Subscriptions & Deliveries
  async getWebhookSubscriptions() {
    const res = await apiClient.get('/api/v1/integrations/webhooks');
    return res.data;
  },

  async createWebhookSubscription(payload) {
    const res = await apiClient.post('/api/v1/integrations/webhooks', payload);
    return res.data;
  },

  async updateWebhookSubscription(subId, payload) {
    const res = await apiClient.put(`/api/v1/integrations/webhooks/${subId}`, payload);
    return res.data;
  },

  async deleteWebhookSubscription(subId) {
    const res = await apiClient.delete(`/api/v1/integrations/webhooks/${subId}`);
    return res.data;
  },

  async testWebhook(payload) {
    const res = await apiClient.post('/api/v1/integrations/webhooks/test', payload);
    return res.data;
  },

  async getDeliveries(params = {}) {
    const res = await apiClient.get('/api/v1/integrations/webhooks/deliveries', { params });
    return res.data;
  },

  async getDeliveryDetails(deliveryId) {
    const res = await apiClient.get(`/api/v1/integrations/webhooks/deliveries/${deliveryId}`);
    return res.data;
  },

  async retryDelivery(deliveryId) {
    const res = await apiClient.post(`/api/v1/integrations/webhooks/deliveries/${deliveryId}/retry`);
    return res.data;
  },

  // 5. External Speech Services (Testing & Live Execution)
  async getVoices() {
    const res = await apiClient.get('/api/v1/integrations/voices');
    return res.data;
  },

  async testSTT(formData, apiKey = null) {
    const headers = { 'Content-Type': 'multipart/form-data' };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    const res = await apiClient.post('/api/v1/integrations/stt/transcribe', formData, { headers });
    return res.data;
  },

  async testTTS(payload, apiKey = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    const res = await apiClient.post('/api/v1/integrations/tts/generate', payload, { headers });
    return res.data;
  },

  getBaseUrl() {
    return getApiBaseUrl();
  }
};

export default integrationApi;
