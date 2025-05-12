'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { UserProvider } from '../../contexts/user/UserContext';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Add session management
  useEffect(() => {
    const handleStorageChange = () => {
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
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Initial check
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
