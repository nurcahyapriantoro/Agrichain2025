'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { UserProvider } from '../../contexts/user/UserContext';
import { isBrowser, API_URLS, getCurrentPort } from '@/lib/config';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and manage authentication state
  useEffect(() => {
    if (!isBrowser) return;
    
    // Log current environment information
    const currentPort = getCurrentPort();
    console.log(`App running on port: ${currentPort || 'unknown'}`);
    console.log(`Using API endpoints:`, {
      primary: API_URLS.primary,
      secondary: API_URLS.secondary,
    });
    
    const handleStorageChange = (event: StorageEvent) => {
      // Check if session exists in storage
      const session = sessionStorage.getItem('session');
      if (!session) {
        // Try to get token from localStorage
        const walletToken = localStorage.getItem('walletAuthToken') || localStorage.getItem('web3AuthToken');
        if (!walletToken) {
          console.log('No session or wallet token found');
          return;
        }
      }

      // React to API endpoint preference changes
      if (event?.key === 'lastSuccessfulApiEndpoint') {
        const newEndpoint = event.newValue;
        console.log(`API endpoint preference changed to: ${newEndpoint}`);
      }
    };

    // Check which API endpoint was last successful
    const lastSuccessfulEndpoint = localStorage.getItem('lastSuccessfulApiEndpoint');
    if (lastSuccessfulEndpoint) {
      console.log(`Last successful API endpoint from localStorage: ${lastSuccessfulEndpoint}`);
    } else {
      // If no preference is stored, pick one based on the current port
      const suggestedEndpoint = currentPort === 3001 ? 'secondary' : 'primary';
      localStorage.setItem('lastSuccessfulApiEndpoint', suggestedEndpoint);
      console.log(`No API endpoint preference found, defaulting to ${suggestedEndpoint} based on current port ${currentPort}`);
    }

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Initial check
    handleStorageChange({} as StorageEvent);
    setIsInitialized(true);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!isInitialized && isBrowser) {
    return null; // Don't render until initialization is complete
  }

  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window gains focus
    >
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  );
}
