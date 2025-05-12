import { useState, useEffect, useRef, useCallback } from 'react';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

// Global registry of in-flight requests to prevent duplicate API calls
const inFlightRequests = new Map<string, Promise<any>>();

// In-memory cache for faster access than sessionStorage
const memoryCache = new Map<string, { data: any, expiry: number }>();

/**
 * Custom hook for data fetching with built-in caching and request deduplication
 * 
 * @param fetchFn The function that performs the actual API call
 * @param key A unique key for caching this request (must be consistent for same data)
 * @param dependencies Dependencies array that will trigger re-fetch when changed
 * @param options Additional options for caching and fetch behavior
 */
export function useCachedFetch<T>(
  fetchFn: () => Promise<T>,
  key: string,
  dependencies: any[] = [],
  options: {
    cacheDurationMs?: number;        // How long to cache the result (default: 5 minutes)
    useSessionStorage?: boolean;     // Whether to use session storage (default: true)
    enabled?: boolean;               // Whether this fetch should be enabled (default: true)
    initialData?: T;                 // Initial data to use before fetch completes
    onSuccess?: (data: T) => void;   // Callback when fetch succeeds
    onError?: (error: any) => void;  // Callback when fetch fails
  } = {}
) {
  const {
    cacheDurationMs = 5 * 60 * 1000, // 5 minutes default cache duration
    useSessionStorage = true,
    enabled = true,
    initialData,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<any>(null);
  
  // Store the latest fetchFn in a ref to avoid unnecessary dependencies
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  
  // Track if component is mounted
  const isMountedRef = useRef(true);
  
  // Store onSuccess and onError callbacks in refs to avoid dependency issues
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const executeFetch = useCallback(async (skipCache = false) => {
    // Don't fetch if not enabled
    if (!enabled) return;
    
    // Set loading state
    setStatus('loading');
    
    try {
      // Check memory cache first (fastest)
      if (!skipCache) {
        const cachedItem = memoryCache.get(key);
        if (cachedItem && cachedItem.expiry > Date.now()) {
          console.log(`[useCachedFetch] Using memory cache for ${key}`);
          setData(cachedItem.data);
          setStatus('success');
          onSuccessRef.current?.(cachedItem.data);
          return;
        }
      }
      
      // Check session storage if enabled
      if (!skipCache && useSessionStorage && typeof window !== 'undefined') {
        try {
          const cachedJson = sessionStorage.getItem(`fetch_${key}`);
          if (cachedJson) {
            const cached = JSON.parse(cachedJson);
            if (cached.expiry > Date.now()) {
              console.log(`[useCachedFetch] Using session storage cache for ${key}`);
              setData(cached.data);
              setStatus('success');
              
              // Also update memory cache for faster future access
              memoryCache.set(key, { data: cached.data, expiry: cached.expiry });
              
              onSuccessRef.current?.(cached.data);
              return;
            }
          }
        } catch (e) {
          console.warn(`[useCachedFetch] Error reading from session storage:`, e);
        }
      }
      
      // Check if there's already an in-flight request for this key
      if (inFlightRequests.has(key)) {
        console.log(`[useCachedFetch] Using existing in-flight request for ${key}`);
        const result = await inFlightRequests.get(key);
        if (isMountedRef.current) {
          setData(result);
          setStatus('success');
          onSuccessRef.current?.(result);
        }
        return;
      }
      
      // Create a new promise for this request and register it
      const promise = fetchFnRef.current();
      inFlightRequests.set(key, promise);
      
      // Execute the fetch
      const result = await promise;
      
      // Store in cache
      const expiry = Date.now() + cacheDurationMs;
      
      // Update memory cache
      memoryCache.set(key, { data: result, expiry });
      
      // Update session storage if enabled
      if (useSessionStorage && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`fetch_${key}`, JSON.stringify({
            data: result,
            expiry
          }));
        } catch (e) {
          console.warn(`[useCachedFetch] Error saving to session storage:`, e);
        }
      }
      
      // Clean up in-flight request registry
      inFlightRequests.delete(key);
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        setData(result);
        setStatus('success');
        setError(null);
        onSuccessRef.current?.(result);
      }
      
      return result;
    } catch (err) {
      // Clean up in-flight request registry on error
      inFlightRequests.delete(key);
      
      // Update state if component is still mounted
      if (isMountedRef.current) {
        console.error(`[useCachedFetch] Error fetching ${key}:`, err);
        setStatus('error');
        setError(err);
        onErrorRef.current?.(err);
      }
      
      throw err;
    }
  }, [key, enabled, useSessionStorage, cacheDurationMs]);

  // Fetch data when dependencies change
  useEffect(() => {
    executeFetch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, key, enabled]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Function to manually refetch data
  const refetch = useCallback(() => {
    return executeFetch(true);
  }, [executeFetch]);

  // Function to manually clear the cache
  const clearCache = useCallback(() => {
    memoryCache.delete(key);
    if (useSessionStorage && typeof window !== 'undefined') {
      sessionStorage.removeItem(`fetch_${key}`);
    }
  }, [key, useSessionStorage]);

  return {
    data,
    isLoading: status === 'loading',
    isError: status === 'error',
    error,
    status,
    refetch,
    clearCache
  };
}

export default useCachedFetch; 