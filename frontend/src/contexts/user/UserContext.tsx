import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { User, UserRole } from '../../types/user';
import api from '../../lib/apiInterceptor';

interface UserContextType {
  userData: User | null;
  isLoading: boolean;
  error: any | null;
  refetch: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const UserContext = createContext<UserContextType>({
  userData: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
  updateProfile: async () => false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<any | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Debug output for session state
  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session ? 'Session exists' : 'No session');
  }, [session, status]);

  // Cache duration in ms (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;
  // Max failed attempts before backing off
  const MAX_FAILED_ATTEMPTS = 3;

  const fetchUserData = useCallback(async (forceRefresh = false) => {
    // If we have user data and it's recent, don't refetch unless forced
    const now = Date.now();
    if (
      !forceRefresh &&
      userData &&
      now - lastFetchTime < CACHE_DURATION
    ) {
      console.log('Using cached user data', userData);
      return;
    }

    // Skip if no session or session loading
    if (status === 'loading') {
      console.log('Session is still loading, skipping user data fetch');
      return;
    }
    
    if (!session?.user?.id) {
      console.log('No user ID in session, skipping user data fetch');
      return;
    }

    // Check if we've had too many failed attempts recently and back off
    if (failedAttempts >= MAX_FAILED_ATTEMPTS && !forceRefresh) {
      console.log(`Too many failed attempts (${failedAttempts}), backing off`);
      return;
    }

    // Prevent overlapping requests
    if (isRefreshing) {
      console.log('Already refreshing user data, skipping duplicate request');
      return;
    }

    try {
      setIsRefreshing(true);
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching user profile data...');
      
      // Try using the session data directly first to avoid unnecessary API calls
      if (session?.user && !forceRefresh) {
        console.log('Using session data directly');
        setUserData({
          id: session.user.id as string,
          name: session.user.name || '',
          email: session.user.email || '',
          role: (session.user.role as UserRole) || UserRole.CONSUMER,
        });
        setLastFetchTime(now);
        // Still try the API call in the background
      }
      
      // Check if we have a token in the session before making API call
      if (!session?.accessToken) {
        console.warn('No access token available for API call');
        setError(new Error('Authentication token not available'));
        setFailedAttempts(prev => prev + 1);
        return;
      }
      
      // Log token availability (without exposing the actual token)
      console.log('Access token is available for API call');
      
      // Use the API interceptor which will handle auth errors
      const response = await api.get('/users/profile');
      console.log('User profile API response:', response);
      
      // Reset failed attempts counter on success
      setFailedAttempts(0);
      
      if (response?.data?.data) {
        setUserData(response.data.data);
        setLastFetchTime(now);
        console.log('User data fetched successfully:', response.data.data);
      } else if (response?.data) {
        console.log('API returned data but not in expected format:', response.data);
        // Try to extract data if it's in a different format
        if (response.data.success && response.data.data) {
          setUserData(response.data.data);
          setLastFetchTime(now);
          console.log('User data extracted from different format:', response.data.data);
        }
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // Increment failed attempts
      setFailedAttempts(prev => prev + 1);
      setError(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session, userData, lastFetchTime, status, failedAttempts, isRefreshing]);

  // Update user profile
  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    if (!session?.user?.id) {
      console.log('No user ID in session, cannot update profile');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Updating user profile with data:', data);
      // Call our Next.js API endpoint for profile update using the interceptor
      const response = await api.put('/users/profile/update', data);
      console.log('Profile update response:', response.data);
      
      if (response?.data?.success) {
        // Update local userData with the new data
        setUserData(prev => prev ? { ...prev, ...response.data.data } : null);
        setLastFetchTime(Date.now());
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch user data when session changes, but use a more controlled approach
  useEffect(() => {
    let isMounted = true;
    
    const initUserData = async () => {
      if (status === 'authenticated' && session?.user?.id && isMounted) {
        console.log('Session authenticated, fetching user data');
        await fetchUserData();
      } else if (status === 'unauthenticated' && isMounted) {
        console.log('Session unauthenticated, clearing user data');
        setUserData(null);
      }
    };
    
    initUserData();
    
    return () => {
      isMounted = false;
    };
  }, [session?.user?.id, fetchUserData, status]);

  const refetch = useCallback(async () => {
    console.log('Manually refetching user data');
    setFailedAttempts(0); // Reset failed attempts on manual refetch
    await fetchUserData(true);
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={{ userData, isLoading, error, refetch, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 