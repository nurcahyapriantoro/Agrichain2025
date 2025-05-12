import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Use relative URL for Next.js API routes
});

// Track auth error count to prevent infinite loops
let authErrorCount = 0;
const MAX_AUTH_ERRORS = 3;
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

// Add request interceptor
api.interceptors.request.use(
  async (config) => {
    // If we're already calling the refresh endpoint, don't add auth header
    if (config.url?.includes('/auth/refresh')) {
      return config;
    }
    
    try {
      const session = await getSession();
      // Check if session and accessToken exist before using it
      if (session && 'accessToken' in session && session.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
        console.log(`Setting auth header for ${config.url}`);
      } else {
        console.warn(`No access token available for request to ${config.url}`);
      }
    } catch (error) {
      console.error('Error getting session in interceptor:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Reset auth error count on successful response
    authErrorCount = 0;
    return response;
  },
  async (error) => {
    // Log all API errors for debugging
    console.error(`API Error for ${error.config?.url || 'unknown endpoint'}:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Only handle auth errors
    if (error.response?.status === 401) {
      authErrorCount++;
      console.log(`Auth error encountered (${authErrorCount}/${MAX_AUTH_ERRORS})`);
      
      // If we've had too many auth errors, sign out
      if (authErrorCount >= MAX_AUTH_ERRORS) {
        console.error('Too many authentication errors, logging out...');
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/login' });
        }, 1000);
        return Promise.reject(error);
      }
      
      // Attempt to refresh token
      if (!isRefreshing) {
        isRefreshing = true;
        console.log('Attempting to refresh token...');
        refreshPromise = axios.get('/api/auth/refresh')
          .then(response => {
            console.log('Token refreshed successfully');
            isRefreshing = false;
            return response.data;
          })
          .catch(refreshError => {
            console.error('Token refresh failed:', refreshError);
            isRefreshing = false;
            // If refresh fails, redirect to login
            setTimeout(() => {
              signOut({ callbackUrl: '/auth/login' });
            }, 1000);
            return Promise.reject(refreshError);
          });
      }
      
      try {
        // Wait for the refresh to complete
        await refreshPromise;
        
        // Retry the original request
        const originalRequest = error.config;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, reject the original request
        return Promise.reject(error);
      }
    }
    
    // For non-auth errors, just reject
    return Promise.reject(error);
  }
);

export default api; 