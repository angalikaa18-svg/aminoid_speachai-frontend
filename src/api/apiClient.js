import axios from 'axios';

export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080';
};

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 60000, // 60s timeout for local speech operations
});

// Normalize API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred.';
    let status = null;

    if (error.response) {
      status = error.response.status;
      if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (error.response.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          message = error.response.data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
        } else {
          message = error.response.data.detail;
        }
      } else if (error.response.data?.message) {
        message = error.response.data.message;
      }
    } else if (error.request) {
      message = 'Cannot connect to local backend at ' + getApiBaseUrl() + '. Ensure FastAPI is running.';
    } else {
      message = error.message;
    }

    return Promise.reject({
      message,
      status,
      originalError: error,
    });
  }
);

export default apiClient;
