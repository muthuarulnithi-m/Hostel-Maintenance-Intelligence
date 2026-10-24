import axios from 'axios';

// ─── Base URL from environment variable ───────────────────────────────────────
const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
const BASE_URL = configuredBaseUrl || (
  import.meta.env.DEV ? 'http://127.0.0.1:8000' : ''
);

if (!BASE_URL) {
  throw new Error('VITE_API_URL is required for production builds.');
}

// ─── Create Axios instance ────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 15 seconds
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Automatically attach the JWT token to every request if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Handle common errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // 401 Unauthorized — token expired or invalid
      if (status === 401) {
        // Clear stored auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // Redirect to login only if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      // 403 Forbidden — insufficient permissions
      // Let individual components handle this

      // 500 Server Error — log for debugging
      if (status >= 500) {
        console.error('Server error:', error.response.data);
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error — backend may be offline');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
