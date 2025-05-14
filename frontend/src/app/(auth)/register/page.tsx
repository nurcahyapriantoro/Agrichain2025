'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { UserRole } from '@/lib/types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  role: z.enum([
    UserRole.FARMER,
    UserRole.COLLECTOR,
    UserRole.TRADER,
    UserRole.RETAILER,
    UserRole.CONSUMER,
  ], {
    required_error: 'Please select a role',
  }),
  phone: z.string().optional(),
  address: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [metamaskLoading, setMetamaskLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metamaskAvailable, setMetamaskAvailable] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Check if MetaMask is available but don't auto-connect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      setMetamaskAvailable(true);
      
      // Reset wallet connection - don't check for accounts
      setWalletAddress(null);
    }
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.CONSUMER,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Register the user
      const { confirmPassword, ...userData } = data;
      const response = await authAPI.register({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        address: userData.address
      });

      if (response.success) {
        setSuccess('Registration successful! Please check your email to verify your account.');
        
        // Automatically sign in the user after registration
        setTimeout(async () => {
          await signIn('credentials', {
            email: data.email,
            password: data.password,
            callbackUrl: '/',
          });
        }, 2000);
      } else {
        setError(response.message || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred during registration. Please try again.';
      setError(errorMessage);
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Google login error:', error);
    }
  };
  
  const handleMetaMaskRegistration = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to continue.');
      return;
    }
    
    try {
      setMetamaskLoading(true);
      setError(null);
      
      console.log('Requesting MetaMask account access...');
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure your MetaMask is unlocked and try again.');
      }
      
      const address = accounts[0];
      setWalletAddress(address);
      console.log('Connected to wallet address:', address);
      
      // Get the chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0x531') {
        setError('Please switch to the SEI network (Chain ID: 1329)');
        setMetamaskLoading(false);
        return; 
      }
      console.log('Connected to chain ID:', chainId);
      
      // Sign a message to verify ownership
      const timestamp = Date.now();
      const message = `Register with AgriChain using address: ${address}\nChain ID: ${chainId}\nTimestamp: ${timestamp}`;
      console.log('Requesting signature for message:', message);
      
      try {
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address]
        });
        
        console.log('Signature obtained successfully');
        
        // Use URL state instead of query params for better security and to avoid issues with long signatures
        // Construct the URL for wallet registration page
        const params = new URLSearchParams();
        params.append('address', address);
        params.append('signature', signature);
        params.append('message', message);
        params.append('chainId', chainId);
        
        console.log('Redirecting to wallet registration form...');
        router.push(`/register/wallet?${params.toString()}`);
      } catch (signError: any) {
        if (signError.code === 4001) {
          // User rejected the signature request
          throw new Error('You rejected the signature request. Please approve it to register.');
        } else {
          throw new Error(`Signature failed: ${signError.message || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('MetaMask registration error:', error);
      if (error.code === 4001) {
        // User rejected the request
        setError('You rejected the signature request. Please approve it to register.');
      } else {
        setError(`Failed to register with MetaMask: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setMetamaskLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen relative bg-gray-950 text-white overflow-hidden">
      {/* Animated Background Elements - Similar to login page */}
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

      <div className="flex flex-col md:flex-row w-full z-10">
        <div className="w-full md:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12 z-10">
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
              Create your AgriChain account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Choose your preferred method to register
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
                <>
                  <div className="flex flex-col space-y-4 mb-6">
                    {/* MetaMask Button with improved logo */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border border-orange-500/30 text-white hover:bg-orange-900/20
                                hover:border-orange-500/70 transition-all duration-200 rounded-lg backdrop-blur-md"
                      onClick={handleMetaMaskRegistration}
                      disabled={!metamaskAvailable || metamaskLoading}
                      isLoading={metamaskLoading}
                    >
                      {!metamaskLoading && (
                        <svg 
                          className="mr-2 h-5 w-5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          viewBox="0 0 404 420"
                          fill="none"
                        >
                          <path d="M382.939 0.729492L238.379 132.703L267.561 60.5883L382.939 0.729492Z" fill="#E2761B" stroke="#E2761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M20.7133 0.729492L164.456 133.494L136.091 60.5883L20.7133 0.729492Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M327.455 300.038L286.573 368.547L374.159 394.564L399.177 301.455L327.455 300.038Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M4.65332 301.455L29.5781 394.564L117.164 368.547L76.2822 300.038L4.65332 301.455Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M112.592 184.436L86.8359 224.11L173.785 228.148L170.936 135.929L112.592 184.436Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M291.061 184.436L232.012 135.138L230.379 228.148L317.236 224.11L291.061 184.436Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M117.164 368.547L169.164 340.502L124.457 301.98L117.164 368.547Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M234.746 340.502L286.654 368.547L279.453 301.98L234.746 340.502Z" fill="#E4761B" stroke="#E4761B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M286.654 368.547L234.746 340.502L239.111 377.615L238.686 393.773L286.654 368.547Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M117.164 368.547L165.133 393.773L164.8 377.615L169.073 340.502L117.164 368.547Z" fill="#D7C1B3" stroke="#D7C1B3" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M166.55 277.581L123.639 263.673L153.539 248.332L166.55 277.581Z" fill="#233447" stroke="#233447" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M237.268 277.581L250.279 248.332L280.271 263.673L237.268 277.581Z" fill="#233447" stroke="#233447" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M117.164 368.547L124.73 300.038L76.2822 301.455L117.164 368.547Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M279.178 300.038L286.744 368.547L327.626 301.455L279.178 300.038Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M317.235 224.11L230.379 228.148L237.359 277.581L250.37 248.332L280.362 263.673L317.235 224.11Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M123.639 263.673L153.631 248.332L166.642 277.581L173.622 228.148L86.8359 224.11L123.639 263.673Z" fill="#CD6116" stroke="#CD6116" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M86.8359 224.11L124.548 301.98L123.639 263.673L86.8359 224.11Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M280.362 263.673L279.453 301.98L317.235 224.11L280.362 263.673Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M173.622 228.148L166.642 277.581L175.255 335.38L177.071 259.635L173.622 228.148Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M230.379 228.148L227.023 259.544L228.655 335.38L237.359 277.581L230.379 228.148Z" fill="#E4751F" stroke="#E4751F" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M237.359 277.581L228.655 335.38L234.746 340.502L279.453 301.98L280.362 263.673L237.359 277.581Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M123.639 263.673L124.548 301.98L169.255 340.502L175.346 335.38L166.642 277.581L123.639 263.673Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M238.686 393.773L239.111 377.615L235.047 374.075H168.771L164.8 377.615L165.133 393.773L117.164 368.547L133.323 381.559L168.316 405.877H235.501L270.587 381.559L286.746 368.547L238.686 393.773Z" fill="#C0AD9E" stroke="#C0AD9E" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M234.746 340.502L228.655 335.38H175.255L169.164 340.502L164.8 377.615L168.771 374.075H235.047L239.111 377.615L234.746 340.502Z" fill="#161616" stroke="#161616" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M395.092 142.955L409.145 75.3621L382.939 0.729492L234.746 130.431L291.061 184.436L372.861 210.057L390.728 187.156L383.03 181.702L395.396 170.696L386.025 163.362L398.391 154.084L395.092 142.955Z" fill="#763D16" stroke="#763D16" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M-5.33447 75.3621L8.7181 142.955L5.32744 154.084L17.7843 163.362L8.41304 170.696L20.7794 181.702L13.0808 187.156L30.9476 210.057L112.747 184.436L169.062 130.431L20.8702 0.729492L-5.33447 75.3621Z" fill="#763D16" stroke="#763D16" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M372.861 210.057L291.061 184.436L317.236 224.11L279.453 301.98L327.626 301.455H399.177L372.861 210.057Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M112.747 184.436L30.9472 210.057L4.74414 301.455H76.2822L124.456 301.98L86.8359 224.11L112.747 184.436Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M230.379 228.148L234.746 130.431L267.652 60.5883H136.091L169.062 130.431L173.622 228.148L175.163 259.726L175.255 335.38H228.655L228.838 259.726L230.379 228.148Z" fill="#F6851B" stroke="#F6851B" strokeWidth="0.938348" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      <span>
                        Register with MetaMask
                      </span>
                    </Button>

                    {/* Google Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border border-gray-700 text-white hover:bg-purple-900/20 
                                hover:border-purple-700/70 transition-all duration-200 rounded-lg backdrop-blur-md"
                      onClick={handleGoogleLogin}
                      isLoading={isLoading && !metamaskLoading}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="fab"
                        data-icon="google"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                      >
                        <path
                          fill="currentColor"
                          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                        ></path>
                      </svg>
                      <span>Register with Google</span>
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-gray-900/40 px-2 text-gray-400 backdrop-blur-md">
                        Or register with email
                      </span>
                    </div>
                  </div>

                  <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    {error && (
                      <div className="rounded-md bg-red-900/30 p-4 border border-red-800 backdrop-blur-sm">
                        <div className="flex">
                          <div className="text-sm text-red-400">
                            {error}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Full name
                      </label>
                      <div className="mt-1 relative group">
                        <input
                          id="name"
                          type="text"
                          autoComplete="name"
                          {...register('name')}
                          className="pl-3 block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                                   hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                                   backdrop-blur-md"
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
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Email address
                      </label>
                      <div className="mt-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </div>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          {...register('email')}
                          className="pl-10 block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                                   hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                                   backdrop-blur-md"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-400">
                            {errors.email.message}
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
                                 backdrop-blur-md"
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
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Password
                      </label>
                      <div className="mt-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          id="password"
                          type="password"
                          autoComplete="new-password"
                          {...register('password')}
                          className="pl-10 block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                                   hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                                   backdrop-blur-md"
                        />
                        {errors.password && (
                          <p className="mt-1 text-sm text-red-400">
                            {errors.password.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Confirm Password
                      </label>
                      <div className="mt-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <input
                          id="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          {...register('confirmPassword')}
                          className="pl-10 block w-full rounded-lg border border-gray-700 bg-gray-800/50 shadow-sm
                                   focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none
                                   hover:border-purple-700 transition-all duration-200 sm:text-sm text-white
                                   backdrop-blur-md"
                        />
                        {errors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-400">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading && !metamaskLoading}
                        className="w-full bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600 text-white rounded-lg 
                                relative overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 
                                hover:shadow-[0_0_20px_rgba(139,92,246,0.7)]"
                      >
                        <span className="relative z-10">Register</span>
                        <div className="absolute inset-0 w-full h-full">
                          <div className="absolute h-full w-1/4 bg-white/10 skew-x-12 -translate-x-full will-change-transform animate-[scanning_2s_ease-in-out_infinite_alternate]"></div>
                        </div>
                      </Button>
                    </div>
                  </form>
                </>
              )}
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Already have an account? 
                  <Link
                    href="/login"
                    className="font-medium bg-gradient-to-r from-purple-400 to-green-400 hover:from-purple-500 hover:to-green-500 bg-clip-text text-transparent hover:bg-clip-text transition duration-200 ml-1"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side visualization */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/20 to-green-950/30">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* Text moved above visualization */}
            <div className="text-center z-10 mb-8">
              <h2 className="text-white text-3xl font-bold bg-gradient-to-r from-purple-400 via-green-400 to-purple-400 bg-clip-text text-transparent relative z-10">
                AgriChain
              </h2>
              <p className="text-gray-300 mt-2 relative z-10 max-w-xs mx-auto">
                Decentralized agriculture supply chain on the blockchain
              </p>
              
              {/* Animated highlight dots below text */}
              <div className="flex justify-center mt-4 space-x-2">
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></div>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
            
            {/* 3D blockchain visualization */}
            <div className="relative w-4/5 h-3/5">
              {/* Node connections - animated lines */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="40%" y1="30%" x2="60%" y2="40%" stroke="rgba(139, 92, 246, 0.7)" strokeWidth="2" className="animate-pulse" />
                <line x1="60%" y1="40%" x2="75%" y2="60%" stroke="rgba(139, 92, 246, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                <line x1="75%" y1="60%" x2="50%" y2="75%" stroke="rgba(139, 92, 246, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
                <line x1="50%" y1="75%" x2="30%" y2="60%" stroke="rgba(139, 92, 246, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
                <line x1="30%" y1="60%" x2="40%" y2="30%" stroke="rgba(139, 92, 246, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '0.9s' }} />
                <line x1="40%" y1="30%" x2="50%" y2="75%" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '1.1s' }} />
                <line x1="60%" y1="40%" x2="30%" y2="60%" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '1.3s' }} />
                <line x1="75%" y1="60%" x2="40%" y2="30%" stroke="rgba(16, 185, 129, 0.7)" strokeWidth="2" className="animate-pulse" style={{ animationDelay: '1.5s' }} />
              </svg>
              
              {/* Blockchain nodes */}
              <div className="absolute w-full h-full perspective-800">
                <div className="absolute left-[40%] top-[30%]">
                  <div className="w-14 h-14 relative animate-float" style={{ animationDelay: '0s' }}>
                    <div className="absolute inset-0 bg-purple-600/40 backdrop-blur-sm border border-purple-500/70 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.7)]"></div>
                    <div className="absolute inset-2 bg-purple-600/50 rounded-lg flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="absolute left-[60%] top-[40%]">
                  <div className="w-14 h-14 relative animate-float" style={{ animationDelay: '0.5s' }}>
                    <div className="absolute inset-0 bg-green-600/40 backdrop-blur-sm border border-green-500/70 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.7)]"></div>
                    <div className="absolute inset-2 bg-green-600/50 rounded-lg flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="absolute left-[75%] top-[60%]">
                  <div className="w-14 h-14 relative animate-float" style={{ animationDelay: '1s' }}>
                    <div className="absolute inset-0 bg-purple-600/40 backdrop-blur-sm border border-purple-500/70 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.7)]"></div>
                    <div className="absolute inset-2 bg-purple-600/50 rounded-lg flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Additional node for enhanced visualization */}
                <div className="absolute left-[50%] top-[75%]">
                  <div className="w-14 h-14 relative animate-float" style={{ animationDelay: '1.2s' }}>
                    <div className="absolute inset-0 bg-green-600/40 backdrop-blur-sm border border-green-500/70 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.7)]"></div>
                    <div className="absolute inset-2 bg-green-600/50 rounded-lg flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="absolute left-[30%] top-[60%]">
                  <div className="w-14 h-14 relative animate-float" style={{ animationDelay: '0.8s' }}>
                    <div className="absolute inset-0 bg-purple-600/40 backdrop-blur-sm border border-purple-500/70 rounded-lg shadow-[0_0_20px_rgba(139,92,246,0.7)]"></div>
                    <div className="absolute inset-2 bg-purple-600/50 rounded-lg flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Hexagon Grid */}
              <div className="absolute inset-0">
                <svg className="absolute w-full h-full opacity-20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hexagons" width="10" height="17.32" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                      <path d="M5 0L0 8.66L5 17.32L15 17.32L20 8.66L15 0Z" fill="none" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="0.7" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hexagons)" />
                </svg>
              </div>
              
              {/* Scanning effect */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute h-1 w-full bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scanline opacity-80"></div>
              </div>
              
              {/* Central blockchain logo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-green-500 rounded-full opacity-70 animate-pulse"></div>
                  <div className="absolute inset-3 bg-gray-950 rounded-full flex items-center justify-center">
                    <svg width="60" height="60" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="text-gradient-purple-green">
                      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                      <path d="M12,2 L2,7 L12,12 L22,7 L12,2 Z" fill="url(#iconGradient)" />
                      <path d="M2,17 L12,22 L22,17 M2,12 L12,17 L22,12" stroke="url(#iconGradient)" fill="none" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Traceability logos */}
            <div className="flex justify-center space-x-6 mt-8">
              <div className="w-14 h-14 relative bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-800">
                <svg className="w-8 h-8 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span className="absolute -bottom-6 text-xs text-gray-400">Security</span>
              </div>
              
              <div className="w-14 h-14 relative bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-800">
                <svg className="w-8 h-8 text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span className="absolute -bottom-6 text-xs text-gray-400">Transparency</span>
              </div>
              
              <div className="w-14 h-14 relative bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-800">
                <svg className="w-8 h-8 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
                <span className="absolute -bottom-6 text-xs text-gray-400">Traceability</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
