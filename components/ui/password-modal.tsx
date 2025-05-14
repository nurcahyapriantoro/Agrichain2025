"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, X, Shield, Sparkles, ShieldCheck, KeyRound, Fingerprint, LockKeyhole, ShieldAlert, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from './button';

// Define the validation schema for our form
const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  title?: string;
  description?: string;
}

export function PasswordModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Enter Password",
  description = "Please enter your password to continue.",
}: PasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityChecks, setSecurityChecks] = useState(0); // Kembalikan ke 0 untuk animasi
  const [particles, setParticles] = useState<{x: number, y: number, size: number, color: string}[]>([]);
  const [hexagons, setHexagons] = useState<{x: number, y: number, size: number, rotation: number, opacity: number}[]>([]);
  const [showRequiredError, setShowRequiredError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [password, setPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const passwordRegister = register('password');

  // Focus the password input when the modal opens and run security check animation
  useEffect(() => {
    if (isOpen) {
      // Start security animation but make it finish quickly
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10; // Lebih cepat (dari 5 menjadi 10)
        setSecurityChecks(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          // Auto focus input when animation completes
          inputRef.current?.focus();
        }
      }, 30); // Lebih cepat (dari 40ms menjadi 30ms)
      
      // Generate background particles
      const newParticles = Array.from({ length: 40 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.6 
          ? '#10B981' // Green
          : Math.random() > 0.5 
            ? '#8B5CF6' // Purple
            : '#6EE7B7' // Light green
      }));
      setParticles(newParticles);

      // Generate hexagons for cyber effect
      const newHexagons = Array.from({ length: 15 }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 60 + 30,
        rotation: Math.random() * 360,
        opacity: Math.random() * 0.2 + 0.05
      }));
      setHexagons(newHexagons);

      // Clean up interval on unmount
      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen]);

  // Reset form state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setIsPasswordValid(false);
      setError(null);
      setShowRequiredError(false);
      reset();
    }
  }, [isOpen, reset]);

  const handleFormSubmit = async (data: PasswordFormData) => {
    try {
      if (!password || password.trim() === '') {
        setShowRequiredError(true);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Tambahkan sedikit delay untuk efek visualisasi proses dekripsi
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await onSubmit(password);
      
      // Reset form after successful submission
      reset();
      setSecurityChecks(0);
      setPassword('');
      setIsPasswordValid(false);
    } catch (err: any) {
      console.error('Password submission error:', err);
      setError(typeof err === 'string' ? err : err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto z-[100]" ref={containerRef}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-90">
            {/* Background grid pattern */}
            <div className="absolute inset-0 opacity-20 bg-grid-pattern pointer-events-none"></div>
            
            {/* Animated futuristic hexagons */}
            {hexagons.map((hexagon, index) => (
              <div 
                key={`hex-${index}`}
                className="absolute opacity-10 animate-spin-slow pointer-events-none"
                style={{
                  left: `${hexagon.x}%`,
                  top: `${hexagon.y}%`,
                  width: `${hexagon.size}px`,
                  height: `${hexagon.size}px`,
                  transform: `rotate(${hexagon.rotation}deg)`,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill='%238B5CF6' fill-opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  opacity: hexagon.opacity,
                  animationDuration: `${60 + Math.random() * 60}s`,
                  animationDirection: index % 2 === 0 ? 'normal' : 'reverse'
                }}
              ></div>
            ))}
            
            {/* Animated particles */}
            {particles.map((particle, index) => (
              <div 
                key={`particle-${index}`}
                className="absolute rounded-full animate-float pointer-events-none"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  backgroundColor: particle.color,
                  opacity: 0.6,
                  filter: 'blur(1px)',
                  animationDuration: `${5 + Math.random() * 10}s`,
                  animationDelay: `${index * 0.2}s`
                }}
              ></div>
            ))}
          </div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-gray-900 rounded-xl text-left overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.3)] transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border-2 border-purple-500 animate-fadeIn relative z-[101]">
          {/* Moving cyber border effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-purple-500 to-green-400 animate-gradient-move"></div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-purple-500 to-green-500 animate-gradient-move"></div>
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-green-500 via-purple-500 to-green-400 animate-gradient-move"></div>
            <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-green-400 via-purple-500 to-green-500 animate-gradient-move"></div>
          </div>
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-between relative overflow-hidden border-b border-purple-900/30">
            {/* Animated bg pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, #8B5CF6 0, #8B5CF6 1px, transparent 0, transparent 50%)',
                backgroundSize: '10px 10px',
                animation: 'slideBackground 15s linear infinite'
              }}></div>
            </div>
            
            <div className="flex items-center z-10">
              <div 
                className="relative mr-3 bg-gradient-to-br from-purple-600 to-green-500 p-2 rounded-lg shadow-lg animate-pulse-slow"
                style={{animationDuration: '3s'}}
              >
                <LockKeyhole className="h-6 w-6 text-white relative z-10" />
                <div className="absolute inset-0 bg-purple-500 rounded-lg filter blur-md opacity-50"></div>
              </div>
              <h3 className="text-xl font-bold leading-6 text-white animate-text-shadow">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-purple-500 to-green-400 animate-gradient-move">
                  {title}
                </span>
              </h3>
            </div>
            
            <button
              type="button"
              onClick={onClose}
              className="rounded-full group relative p-1 flex items-center justify-center"
            >
              <X className="h-5 w-5 text-gray-300 relative z-10" />
              <div className="absolute inset-0 bg-red-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity"></div>
            </button>
          </div>
          
          <div className="px-6 py-5 bg-gradient-to-b from-gray-900 to-gray-800 relative z-[102]">
            {/* Security Environment Banner */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 border border-purple-800/30 rounded-xl p-5 mb-6 relative overflow-hidden shadow-lg">
              {/* Glow effect on border when check completes */}
              <div 
                className="absolute inset-0 border-2 border-green-500 rounded-xl opacity-0 transition-opacity duration-700"
                style={{ opacity: securityChecks === 100 ? 0.5 : 0 }}
              ></div>
              
              <div className="flex items-center mb-4">
                <div 
                  className="relative mr-3 bg-gradient-to-br from-purple-600/30 to-green-600/30 p-2 rounded-lg shadow-lg"
                >
                  <Shield className="h-6 w-6 text-purple-400 relative z-10" />
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-green-500 rounded-lg filter blur-md opacity-0 transition-opacity duration-500"
                    style={{ opacity: securityChecks === 100 ? 0.3 : 0 }}
                  ></div>
                </div>
                <div className="flex items-center">
                  <p className="text-sm font-medium flex items-center">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-purple-400">
                      Secure Blockchain Environment
                    </span>
                    {securityChecks === 100 && (
                      <Sparkles className="h-3.5 w-3.5 ml-2 text-purple-400" />
                    )}
                  </p>
                </div>
              </div>
              
              {securityChecks < 100 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 flex items-center">
                    <span className="inline-block h-2 w-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
                    Running security checks before proceeding...
                  </p>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden relative">
                    <div 
                      className="bg-gradient-to-r from-purple-600 via-green-500 to-purple-400 h-full rounded-full transition-all duration-300 animate-gradient-move"
                      style={{ width: `${securityChecks}%` }}
                    ></div>
                    {/* Animated scanner line */}
                    <div 
                      className="absolute top-0 bottom-0 w-20 animate-scanning" 
                      style={{ 
                        background: 'linear-gradient(to right, rgba(139, 92, 246, 0) 0%, rgba(139, 92, 246, 0.5) 50%, rgba(139, 92, 246, 0) 100%)' 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>Verifying secure connection</span>
                    <span className="text-purple-400 font-mono">{securityChecks}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-300 space-y-2.5 relative">
                  <div className="flex items-start">
                    <ShieldCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-400">End-to-end encryption active</p>
                  </div>
                  <div className="flex items-start">
                    <ShieldCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-400">Secure connection verified</p>
                  </div>
                  <div className="flex items-start">
                    <ShieldCheck className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-400">Session authenticated</p>
                  </div>
                  
                  {/* Success animation */}
                  <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500/20 to-purple-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-500 animate-ping opacity-30"></div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-300 mb-6">
              {description}
            </p>
            
            {error && (
              <div className="mb-6 rounded-xl bg-gradient-to-r from-red-900/30 to-black/30 p-4 border border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.15)]">
                <div className="flex">
                  <div className="flex-shrink-0 relative">
                    <AlertTriangle className="h-5 w-5 text-red-400 relative z-10" />
                    <div className="absolute inset-0 bg-red-500 filter blur-md opacity-30 animate-pulse"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 relative z-[103]">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <KeyRound className="h-4 w-4 mr-2 text-purple-500" />
                  Enter your password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="relative">
                      <KeyRound className="h-5 w-5 text-gray-500 relative z-10" />
                      <div 
                        className="absolute inset-0 bg-purple-500 filter blur-sm opacity-0 transition-opacity duration-300 pointer-events-none" 
                        style={{ opacity: securityChecks === 100 ? 0.3 : 0 }}
                      ></div>
                    </div>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    autoComplete="current-password"
                    disabled={securityChecks < 100}
                    {...register('password')}
                    ref={(e) => {
                      // This handles both the react-hook-form ref and our own ref
                      register('password').ref(e);
                      if (inputRef) {
                        inputRef.current = e;
                      }
                    }}
                    className="pl-10 pr-20 shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-700 bg-gray-800 rounded-md text-white py-2.5 transition-colors focus:bg-gray-700/50 relative z-[104]"
                    placeholder="Your secure password"
                    value={password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setPassword(newPassword);
                      setIsPasswordValid(newPassword.length > 0);
                      register('password').onChange(e);
                      if (newPassword.length > 0) {
                        setError(null);
                        setShowRequiredError(false);
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-[105]">
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-purple-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-purple-400" />
                      )}
                    </button>
                    <Fingerprint className="h-5 w-5 text-gray-500 ml-2" />
                  </div>
                </div>
              </div>

              {showRequiredError && (
                <p className="mt-2 text-sm text-red-500 flex items-center font-semibold">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                  Required
                </p>
              )}

              {error && !showRequiredError && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                  {error}
                </p>
              )}

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 1px, transparent 1px)',
                    backgroundSize: '15px 15px'
                  }}></div>
                </div>
                
                <div className="flex items-start mb-2 relative z-10">
                  <div className="relative mr-2 flex-shrink-0 mt-0.5">
                    <AlertCircle className="h-4 w-4 text-yellow-500 relative z-10" />
                    <div className="absolute inset-0 bg-yellow-500 filter blur-md opacity-30 animate-pulse"></div>
                  </div>
                  <p className="text-yellow-400 font-medium">Security Notice</p>
                </div>
                <p className="text-sm text-gray-400 ml-6 relative z-10">
                  Your private key is encrypted with your password. Never enter your password on untrusted devices or websites.
                </p>
              </div>

              <div className="flex justify-end space-x-3 relative z-[105]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 transition-all relative z-[105]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isPasswordValid || securityChecks < 100 || isLoading}
                  className={`bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-500 hover:to-green-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] relative overflow-hidden group py-1.5 rounded-lg border border-purple-500/50 ${(!isPasswordValid || isLoading) ? 'opacity-70 cursor-not-allowed' : ''} z-[105]`}
                >
                  <span className="relative z-10 font-medium px-2">{isLoading ? 'Verifying...' : 'Decrypt Key'}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 