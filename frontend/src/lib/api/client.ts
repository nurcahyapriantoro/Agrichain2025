import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession } from 'next-auth/react';

// Make sure this matches the backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api';

// Log the API URL to the console for debugging
console.log('API URL configured as:', API_URL);

// Session caching mechanism to avoid excessive getSession() calls
let cachedSession: any = null;
let sessionCacheTime = 0;
const SESSION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCachedSession = async () => {
  const now = Date.now();
  if (cachedSession && now - sessionCacheTime < SESSION_CACHE_DURATION) {
    return cachedSession;
  }
  
  try {
    const session = await getSession();
    cachedSession = session;
    sessionCacheTime = now;
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

// Request throttling settings
interface QueueItem {
  config: AxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (error: any) => void;
}

const requestQueue: QueueItem[] = [];
const MAX_REQUESTS_PER_SECOND = 1; // Reduced from 2 to 1
const THROTTLE_INTERVAL = 3000; // Increased from 2000 to 3000 ms
let processingQueue = false;

// Rate limiting for API requests
let isProcessing = false;
let lastProcessTime = 0;
const MIN_PROCESS_INTERVAL = 1000; // Increased from 500 to 1000 ms

// Track rate limit hits to adaptively adjust request timing
let rateLimitHits = 0;
const RATE_LIMIT_THRESHOLD = 3;
let lastRateLimitTime = 0;

// Add a request deduplication mechanism
const inFlightRequests = new Map<string, Promise<AxiosResponse>>();

const getRequestKey = (config: AxiosRequestConfig): string => {
  return `${config.method || 'get'}-${config.url || ''}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
};

// Process the request queue in a controlled manner
const processQueue = async () => {
  // Prevent multiple simultaneous processing
  if (isProcessing) return;
  
  // Implement debouncing - wait until minimum interval has passed
  const now = Date.now();
  const timeSinceLastProcess = now - lastProcessTime;
  
  // If we've hit rate limits recently, add extra delay
  let currentInterval = MIN_PROCESS_INTERVAL;
  if (rateLimitHits >= RATE_LIMIT_THRESHOLD) {
    // Exponentially increase delay based on rate limit hits
    const extraDelay = Math.min(Math.pow(2, rateLimitHits - RATE_LIMIT_THRESHOLD) * 1000, 10000);
    currentInterval += extraDelay;
    console.log(`Adding ${extraDelay}ms extra delay due to rate limiting history`);
    
    // Reset rate limit counter after some time has passed
    if (now - lastRateLimitTime > 60000) { // Reset after 1 minute without rate limits
      console.log('Resetting rate limit counter after period of stability');
      rateLimitHits = 0;
    }
  }
  
  if (timeSinceLastProcess < currentInterval) {
    setTimeout(processQueue, currentInterval - timeSinceLastProcess);
    return;
  }
  
  isProcessing = true;
  lastProcessTime = now;
  
  try {
    // Process only 1 request at a time to avoid rate limits (reduced from 3)
    const itemsToProcess = requestQueue.splice(0, 1);
    if (itemsToProcess.length === 0) {
      isProcessing = false;
      return;
    }
    
    // Process requests one at a time
    for (const item of itemsToProcess) {
      try {
        const response = await axios(item.config);
        item.resolve(response);
      } catch (error: any) {
        // Track rate limiting for adaptive backoff
        if (error.response && error.response.status === 429) {
          rateLimitHits++;
          lastRateLimitTime = Date.now();
          console.log(`Rate limit hit detected. Total hits: ${rateLimitHits}`);
        }
        item.reject(error);
      }
    }
    
    // If there are more items, schedule next processing
    if (requestQueue.length > 0) {
      // Use adaptive timing based on rate limit history
      const nextDelay = rateLimitHits >= RATE_LIMIT_THRESHOLD 
        ? THROTTLE_INTERVAL + Math.min(rateLimitHits * 1000, 10000)
        : THROTTLE_INTERVAL;
      
      setTimeout(processQueue, nextDelay);
    }
  } catch (error) {
    console.error('Error processing queue:', error);
  } finally {
    isProcessing = false;
  }
};

// Throttled axios instance
export const throttledRequest = (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ config, resolve, reject });
    
    if (!processingQueue) {
      processQueue();
    }
  });
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increase timeout to 30 seconds
});

// Add token management
const getAuthToken = async (): Promise<string | null> => {
  try {
    // Try to get token from localStorage first (for wallet auth)
    const walletToken = localStorage.getItem('walletAuthToken') || localStorage.getItem('web3AuthToken');
    if (walletToken) {
      return walletToken;
    }

    // Try to get token from NextAuth session
    const session = await getSession();
    if (session?.accessToken) {
      return session.accessToken;
    }

    // Try to get token from sessionStorage as fallback
    const storedSession = JSON.parse(sessionStorage.getItem('session') || '{}');
    return storedSession?.accessToken || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Add a request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Skip auth for login and register
      if (config.url?.includes('/login') || config.url?.includes('/register')) {
        return config;
      }

      // Get auth token
      const token = await getAuthToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`Setting Authorization header for ${config.url}`);
      } else {
        console.warn(`No token available for request to ${config.url}`);
      }

      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication error:', error.response?.data);
      
      // Clear invalid tokens
      localStorage.removeItem('walletAuthToken');
      localStorage.removeItem('web3AuthToken');
      sessionStorage.removeItem('session');
      
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

const getRetryDelay = (retryCount: number): number => Math.pow(2, retryCount) * 1500 + Math.random() * 1000; // Increased base delay and added jitter

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  retryCount?: number;
}

// Export base API for use in other API modules
export const apiGet = async <T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    // Handle edge cases - make sure URLs are properly formed
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    console.log(`Making GET request to: ${formattedUrl}`, { params });
    
    const response = await apiClient.get<T>(formattedUrl, { ...config, params });
    return response.data;
  } catch (error) {
    console.error(`Error in GET request to ${url}:`, error);
    // Additional error logging for debugging
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    // Handle edge cases - make sure URLs are properly formed
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    console.log(`Making POST request to: ${formattedUrl}`);
    
    const response = await apiClient.post<T>(formattedUrl, data, config);
    return response.data;
  } catch (error) {
    console.error(`Error in POST request to ${url}:`, error);
    // Additional error logging for debugging
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const apiPut = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  try {
    // Handle edge cases - make sure URLs are properly formed
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    console.log(`Making PUT request to: ${formattedUrl}`);
    
    const response = await apiClient.put<T>(formattedUrl, data, config);
    return response.data;
  } catch (error) {
    console.error(`Error in PUT request to ${url}:`, error);
    // Additional error logging for debugging
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
};

export const apiDelete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  } catch (error) {
    console.error(`Error in DELETE request to ${url}:`, error);
    throw error;
  }
}; 