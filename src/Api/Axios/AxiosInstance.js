import axios from 'axios';

// Base URL for LoanCore CRM API
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/';

export const TOKEN_STORAGE_KEY = 'loancore_token';
export const USER_STORAGE_KEY = 'loancore_user';

// Create configured Axios instance
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token if available
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token =
        localStorage.getItem(TOKEN_STORAGE_KEY) ||
        localStorage.getItem('token');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Could not read auth token from storage:', err);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global response handling & 401 Token Expiry management
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;
      // Handle Unauthorized session expiration
      if (status === 401) {
        console.warn('Session expired or unauthorized request (401).');
        // Do not force reload if already on /login to prevent infinite loops
        if (!window.location.pathname.includes('/login')) {
          try {
            localStorage.removeItem(TOKEN_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
          } catch (e) {
            console.error('Error clearing storage:', e);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

