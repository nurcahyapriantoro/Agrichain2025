'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/lib/types';

const walletRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  role: z.enum([
    UserRole.FARMER,
    UserRole.COLLECTOR,
    UserRole.TRADER,
    UserRole.RETAILER,
    UserRole.CONSUMER,
  ], {
    required_error: 'Please select a role',
  }),
});

type WalletRegisterFormData = z.infer<typeof walletRegisterSchema>;

export default function WalletRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  // Get values from URL
  const address = searchParams.get('address');
  const signature = searchParams.get('signature');
  const message = searchParams.get('message');
  const chainId = searchParams.get('chainId');
  
  useEffect(() => {
    // Validate required parameters
    if (!address || !signature || !message) {
      setError('Missing required wallet information. Please try again.');
      setDebugInfo(`Address: ${!!address}, Signature: ${!!signature}, Message: ${!!message}`);
    } else {
      console.log('Wallet parameters received:', {
        address: address.substring(0, 6) + '...' + address.substring(address.length - 4),
        signatureLength: signature.length,
        messagePreview: message.substring(0, 20) + '...',
        chainId
      });
    }
  }, [address, signature, message, chainId]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WalletRegisterFormData>({
    resolver: zodResolver(walletRegisterSchema),
    defaultValues: {
      role: UserRole.FARMER,
    },
  });

  const onSubmit = async (data: WalletRegisterFormData) => {
    if (!address || !signature || !message) {
      setError('Missing required wallet information. Please try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);
      
      console.log('Starting wallet registration with:', {
        name: data.name,
        role: data.role,
        address: address.substring(0, 6) + '...' + address.substring(address.length - 4)
      });
      
      // Register with wallet
      const response = await fetch('/api/auth/register-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          role: data.role,
          address,
          signature,
          message,
          chainId
        }),
      });
      
      // Handle non-JSON responses
      let result;
      try {
        result = await response.json();
      } catch (parseError: unknown) {
        console.error('Failed to parse response:', parseError);
        setError('Server returned an invalid response. Please try again.');
        
        // Tangani parseError sebagai tipe unknown dengan benar
        const errorMessage = parseError instanceof Error 
          ? parseError.message 
          : 'Unknown parsing error';
          
        setDebugInfo(`Status: ${response.status}, Parse error: ${errorMessage}`);
        return;
      }
      
      console.log('Registration response:', {
        status: response.status,
        success: result.success,
        message: result.message
      });
      
      if (response.ok && result.success) {
        setSuccess('Registration successful! Redirecting to homepage...');
        
        // Save wallet auth token and user data
        localStorage.setItem('walletAuthToken', result.token);
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletUserData', JSON.stringify({
          id: result.user.id,
          name: result.user.name,
          role: result.user.role,
          walletAddress: result.user.walletAddress,
          authMethods: result.user.authMethods
        }));
        
        // Immediately redirect to homepage
        router.push('/');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
        if (result.details) {
          setDebugInfo(`Error details: ${result.details}`);
        }
      }
    } catch (error: any) {
      console.error('Wallet registration error:', error);
      setError('An error occurred during registration. Please try again.');
      setDebugInfo(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative bg-gray-950 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        {/* Cyber grid */}
        <div className="absolute inset-0 opacity-10 bg-grid-pattern"></div>
        
        {/* Animated circuit lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path className="animate-[circuitPath_15s_ease-in-out_infinite]" d="M0,100 Q300,100 600,300 T1200,500" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="2" fill="none" />
          <path className="animate-[circuitPath_20s_ease-in-out_infinite]" d="M0,300 Q300,400 600,200 T1200,300" stroke="rgba(5, 150, 105, 0.2)" strokeWidth="2" fill="none" style={{ animationDelay: '0.5s' }} />
          <path className="animate-[circuitPath_25s_ease-in-out_infinite]" d="M0,500 Q300,200 600,400 T1200,100" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="2" fill="none" style={{ animationDelay: '1s' }} />
        </svg>
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/3 w-48 h-48 bg-green-500 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute bottom-1/4 left-2/3 w-40 h-40 bg-purple-400 rounded-full opacity-15 blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
      </div>

      <div className="flex flex-col w-full z-10">
        <div className="w-full flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center mb-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-green-500 rounded-full opacity-70 animate-pulse"></div>
                <div className="absolute inset-2 bg-gray-950 rounded-full flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-green-400">
                    <path d="M12,2 L2,7 L12,12 L22,7 L12,2 Z" fill="currentColor" />
                    <path d="M2,17 L12,22 L22,17 M2,12 L12,17 L22,12" stroke="currentColor" fill="none" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-green-400 to-purple-400 text-transparent bg-clip-text">
              Complete Wallet Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Wallet connected: {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 'Not connected'}
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="backdrop-blur-md bg-gray-900/40 py-8 px-4 shadow-lg border border-gray-800 rounded-xl sm:px-10 
                          hover:border-purple-900/50 transition-all duration-300">
              {success ? (
                <div className="rounded-md bg-green-900/30 p-4 mb-4 border border-green-800">
                  <div className="flex">
                    <div className="text-sm text-green-400">
                      {success}
                    </div>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  {error && (
                    <div className="rounded-md bg-red-900/30 p-4 border border-red-800 backdrop-blur-sm">
                      <div className="flex flex-col">
                        <div className="text-sm text-red-400">
                          {error}
                        </div>
                        {debugInfo && (
                          <div className="mt-2 text-xs text-red-300 opacity-80 bg-red-950/50 p-2 rounded font-mono overflow-x-auto">
                            {debugInfo}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Your Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        {...register('name')}
                        className="block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                                 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                                 hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                                 backdrop-blur-md px-3 py-2"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Role
                    </label>
                    <div className="mt-1">
                      <select
                        id="role"
                        {...register('role')}
                        className="block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                               focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                               hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                               backdrop-blur-md px-3 py-2"
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {errors.role && (
                        <p className="mt-1 text-sm text-red-400">
                          {errors.role.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white rounded-lg 
                              relative overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 
                              hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]"
                      disabled={!address || !signature || !message}
                    >
                      <span className="relative z-10">Complete Registration</span>
                      <div className="absolute inset-0 w-full h-full">
                        <div className="absolute h-full w-1/4 bg-white/10 skew-x-12 -translate-x-full will-change-transform animate-[scanning_2s_ease-in-out_infinite_alternate]"></div>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <Button 
                      type="button"
                      variant="ghost"
                      className="text-xs text-gray-400 hover:text-white"
                      onClick={() => window.location.reload()}
                    >
                      Connection issues? Click here to retry
                    </Button>
                  </div>
                </form>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Changed your mind? 
                  <Link
                    href="/register"
                    className="font-medium bg-gradient-to-r from-purple-400 to-green-400 hover:from-purple-500 hover:to-green-500 bg-clip-text text-transparent hover:bg-clip-text transition duration-200 ml-1"
                  >
                    Back to Registration
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 