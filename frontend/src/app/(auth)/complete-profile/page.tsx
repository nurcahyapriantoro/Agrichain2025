'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/custom-alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '@/lib/api/auth';

const completeProfileSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type CompleteProfileFormData = z.infer<typeof completeProfileSchema>;

export default function CompleteWalletProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if the user is authenticated with wallet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walletToken = localStorage.getItem('walletAuthToken');
      const walletUserDataString = localStorage.getItem('walletUserData');
      
      if (walletToken && walletUserDataString) {
        try {
          const userData = JSON.parse(walletUserDataString);
          setUserData(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing wallet user data:', error);
        }
      } else {
        // Redirect to login if not authenticated with wallet
        router.push('/login?error=auth_required');
      }
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema)
  });

  const onSubmit = async (data: CompleteProfileFormData) => {
    if (!isAuthenticated) {
      setError('You must be logged in to complete your profile');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('Updating wallet user profile...');
      
      // Call the API to update the wallet user's profile
      const response = await authAPI.updateWalletUserProfile(
        data.email,
        data.password
      );
        if (response.success) {
        setSuccess('Profile updated successfully! You can now log in with either your wallet or your email and password. Redirecting to homepage...');
        
        // Update user data in local storage with the updated information
        if (userData) {
          const updatedUserData = {
            ...userData,
            email: data.email
          };
          
          localStorage.setItem('walletUserData', JSON.stringify(updatedUserData));
        }
        
        // Redirect to homepage after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(response.message || 'Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'An error occurred. Please try again.');
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
        <div className="w-full max-w-md mx-auto flex flex-col justify-center px-4 sm:px-6 py-12">
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
              Complete Your Profile
            </h2>            <p className="mt-2 text-center text-sm text-gray-400">
              Almost there! Please provide your email and set a password to complete your account setup. 
              After this, you'll be able to log in with either your wallet or your email and password.
            </p>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="backdrop-blur-md bg-gray-900/40 py-8 px-4 shadow-lg border border-gray-800 rounded-xl sm:px-10 
                          hover:border-purple-900/50 transition-all duration-300">
              
              {userData && (
                <div className="mb-6 p-3 bg-gray-800/50 rounded-lg">
                  <p className="text-gray-300 text-sm">
                    <span className="font-semibold">Connected wallet:</span> {userData.walletAddress ? 
                      `${userData.walletAddress.substring(0, 6)}...${userData.walletAddress.substring(userData.walletAddress.length - 4)}` : 
                      'Not connected'}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-semibold">User ID:</span> {userData.id}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-semibold">Role:</span> {userData.role}
                  </p>
                </div>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-900/20 border-green-800 text-green-400">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="mb-4 bg-red-900/20 border-red-800 text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email')}
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="your-email@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register('password')}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    Confirm Password
                  </Label>
                  <div className="mt-1">
                    <Input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register('confirmPassword')}
                      className="bg-gray-800/50 border-gray-700 text-white"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-purple-600 to-green-500 hover:from-purple-700 hover:to-green-600"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Complete Profile'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
