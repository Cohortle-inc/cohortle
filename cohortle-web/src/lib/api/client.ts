/**
 * API client configuration with authentication
 * Handles all HTTP requests to the backend API via proxy
 * Tokens are automatically included from httpOnly cookies by the proxy
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Create axios instance with base configuration
 * Routes through /api/proxy which adds auth token from httpOnly cookie
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/proxy',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Response interceptor to handle authentication errors
 * Redirects to login page on 401 Unauthorized responses
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear cookie via logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Redirect to login page (only in browser)
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const returnUrl = encodeURIComponent(currentPath + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
