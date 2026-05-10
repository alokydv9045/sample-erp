import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to normalize paths
apiClient.interceptors.request.use(
  (config) => {
    // Normalize URL to prevent double /api prefix
    if (config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }

    // Fallback: Send Authorization header from localStorage if cookie is blocked
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors and retries
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const status = error.response?.status;
    
    // Global 401 Unauthorized Handling (Session Expired)
    if (status === 401 && typeof window !== 'undefined') {
      const isLoginRequest = config?.url?.includes('/auth/login') || config?.url?.includes('/login');
      if (window.location.pathname !== '/login' && !isLoginRequest) {
        // Clear local cache
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        window.location.href = '/login?reason=session_expired';
      }
      return Promise.reject(error);
    }

    // RETRY LOGIC: Retry on 5xx errors (server failure) up to 3 times
    if (status >= 500 && (!config.__retryCount || config.__retryCount < 3)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      
      // Exponential backoff delay (1s, 2s, 3s)
      const delay = config.__retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.warn(`[API_RETRY]: Retrying ${config.url} (Attempt ${config.__retryCount}) due to status ${status}`);
      return apiClient(config);
    }

    // Global 5xx / Network Error Handling for UX
    if (!status || status >= 500) {
      console.error('[API_FATAL_ERROR]:', {
        endpoint: config?.url,
        message: error.message,
        status: status || 'NETWORK_FAILURE'
      });
      
      // In a real production app, we would trigger a global notification/toast here
      if (typeof window !== 'undefined') {
        const message = !status ? 'Network connection failed' : 'Internal server error';
        alert(`⚠️ ${message}. Please try again later.`); // Fallback UI
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
