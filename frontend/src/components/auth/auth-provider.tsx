'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { UserProvider } from '../../contexts/user/UserContext';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  // Add session management
  useEffect(() => {
    const handleWalletAuth = () => {
      // Check if session exists in storage
      const session = sessionStorage.getItem('session');
      
      // Get wallet authentication data
      const walletToken = localStorage.getItem('walletAuthToken') || localStorage.getItem('web3AuthToken');
      const walletUserData = localStorage.getItem('walletUserData');
      const walletAddress = localStorage.getItem('walletAddress');
      
      const hasWalletAuth = !!walletToken && !!walletUserData && !!walletAddress;
      
      console.log('AuthProvider: Checking auth sources', { 
        session: session ? 'exists' : 'none',
        walletToken: walletToken ? 'exists' : 'none',
        walletUserData: walletUserData ? 'exists' : 'none',
        walletAddress: walletAddress ? 'exists' : 'none',
        hasWalletAuth
      });

      // If successfully authenticated via wallet but userData is missing or incomplete
      if (walletToken && (!walletUserData || !walletAddress)) {
        console.warn('AuthProvider: Token exists but user data is incomplete. Fixing...');
        
        // Try to retrieve user data from token if possible
        try {
          // Decode JWT if it's a JWT token (simplified example)
          const tokenParts = walletToken.split('.');
          if (tokenParts.length === 3) {
            const tokenData = JSON.parse(atob(tokenParts[1]));
            console.log('AuthProvider: Extracted token data', tokenData);
            
            // If token contains user info and we don't have walletUserData
            if (tokenData && !walletUserData) {
              const userData = {
                id: tokenData.id || tokenData.sub,
                role: tokenData.role || UserRole.FARMER,
                walletAddress: walletAddress || tokenData.walletAddress,
                // Add other needed properties
              };
              
              console.log('AuthProvider: Saving extracted user data', userData);
              localStorage.setItem('walletUserData', JSON.stringify(userData));
              
              // If we don't have walletAddress but token has it
              if (!walletAddress && tokenData.walletAddress) {
                localStorage.setItem('walletAddress', tokenData.walletAddress);
              }
            }
          }
        } catch (error) {
          console.error('AuthProvider: Error processing token:', error);
        }
      }
      
      // If wallet auth is complete, simulate a session
      if (hasWalletAuth && !session) {
        try {
          const userData = JSON.parse(walletUserData);
          console.log('AuthProvider: Creating session from wallet auth', userData);
          
          // Create a session format compatible with what the app expects
          const sessionData = {
            user: {
              id: userData.id || 'wallet-user',
              name: userData.name || 'Wallet User',
              role: userData.role || UserRole.FARMER,
              walletAddress: walletAddress,
              // Add other user properties as needed
            },
            accessToken: walletToken
          };
          
          // Store in sessionStorage for API client and other components
          sessionStorage.setItem('session', JSON.stringify(sessionData));
          
          // Refresh the page or navigate if needed
          // Uncomment if you want to force navigation
          // router.refresh();
        } catch (e) {
          console.error('AuthProvider: Error creating session from wallet data:', e);
        }
      }
    };

    // Listen for storage changes
    window.addEventListener('storage', handleWalletAuth);
    
    // Initial check - CRITICAL to run at component mount
    handleWalletAuth();

    return () => {
      window.removeEventListener('storage', handleWalletAuth);
    };
  }, [router]);

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
