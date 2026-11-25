/**
 * API Key Management & Developer Integration Client.
 * Connects the frontend to AMINOID API Key and Gateway endpoints.
 */

import { apiClient, getApiBaseUrl } from './apiClient';

export const apiKeyApi = {
  // 1. Dashboard Statistics & Analytics
  async getStats() {
    const res = await apiClient.get('/api/v1/integrations/api-keys/stats');
    return res.data;
  },

  async getAnalytics() {
    const res = await apiClient.get('/api/v1/integrations/api-keys/analytics');
    return res.data;
  },

  // 2. Keys CRUD & Listing with Pagination & Filters
  async getKeys(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.client && params.client !== 'all') query.set('client', params.client);
    if (params.environment && params.environment !== 'all') query.set('environment', params.environment);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);

    const res = await apiClient.get(`/api/v1/integrations/api-keys?${query.toString()}`);
    return res.data;
  },

  async getKey(keyId) {
    const res = await apiClient.get(`/api/v1/integrations/api-keys/${keyId}`);
    return res.data;
  },

  async createKey(payload) {
    const res = await apiClient.post('/api/v1/integrations/api-keys', payload);
    return res.data;
  },

  async updateKey(keyId, payload) {
    const res = await apiClient.put(`/api/v1/integrations/api-keys/${keyId}`, payload);
    return res.data;
  },

  async toggleKey(keyId, isActive) {
    const res = await apiClient.patch(`/api/v1/integrations/api-keys/${keyId}/toggle?is_active=${isActive}`);
    return res.data;
  },

  async revokeKey(keyId) {
    const res = await apiClient.delete(`/api/v1/integrations/api-keys/${keyId}`);
    return res.data;
  },

  // 3. Connection Test
  async testConnection(apiKey) {
    const payload = typeof apiKey === 'object' && apiKey !== null
      ? apiKey
      : { api_key: (apiKey || '').trim() };
    const res = await apiClient.post('/api/v1/integrations/api-keys/test-connection', payload);
    return res.data;
  },

  // 4. Request Logs
  async getLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.api_key_id) query.set('api_key_id', params.api_key_id);
    if (params.endpoint) query.set('endpoint', params.endpoint);
    if (params.method) query.set('method', params.method);
    if (params.status_code) query.set('status_code', String(params.status_code));
    if (params.search) query.set('search', params.search);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.offset !== undefined) query.set('offset', String(params.offset));

    const res = await apiClient.get(`/api/v1/integrations/api-keys/logs?${query.toString()}`);
    return res.data;
  },

  // 5. Permissions Catalog
  async getPermissions() {
    const res = await apiClient.get('/api/v1/integrations/api-keys/permissions');
    return res.data;
  },

  getBaseUrl() {
    return getApiBaseUrl();
  }
};

export default apiKeyApi;
