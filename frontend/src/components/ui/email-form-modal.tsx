'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from './button';
import { Mail, X, Check, AlertCircle } from 'lucide-react';

interface EmailFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
  currentEmail?: string;
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

export function EmailFormModal({ isOpen, onClose, onSubmit, currentEmail }: EmailFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: currentEmail || '',
    }
  });

  const handleFormSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await onSubmit(data.email);
      reset();
      onClose();
    } catch (err: any) {
      console.error('Error submitting email form:', err);
      setError(err?.message || 'Failed to update email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Prevent click propagation
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-50 backdrop-blur-lg" onClick={handleModalClick}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] rounded-xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-[#a259ff] shadow-[0_0_30px_rgba(162,89,255,0.3)]">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex justify-between items-center border-b border-[#a259ff]/30">
            <div className="flex items-center">
              <div className="relative mr-3 bg-[#a259ff]/20 p-2 rounded-lg">
                <Mail className="h-6 w-6 text-[#a259ff]" />
                <div className="absolute inset-0 rounded-lg blur-sm opacity-50 bg-[#a259ff]/20"></div>
              </div>
              <h3 className="text-xl font-bold text-white">
                {currentEmail ? 'Update Email Address' : 'Add Email Address'}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCancelClick}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="px-6 py-5">
              <p className="text-sm text-[#00ffcc] mb-4">
                {currentEmail
                  ? 'Update your email address to receive notifications and reset your password if needed.'
                  : 'Add your email address to receive notifications and reset your password if needed.'}
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="email" className="block text-xs font-medium text-[#a259ff] mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 bg-[#181a1b] border border-[#a259ff]/50 rounded-lg text-white font-mono focus:ring-[#00ffcc] focus:border-[#00ffcc] focus:outline-none"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelClick}
                  className="border-[#a259ff]/50 text-[#a259ff] hover:bg-[#a259ff]/20 focus:outline-none focus:ring-2 focus:ring-[#a259ff] transition-all"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-[#00ffcc] to-[#a259ff] text-white hover:opacity-90 shadow-[0_0_15px_rgba(0,255,204,0.3)] focus:outline-none focus:ring-2 focus:ring-[#00ffcc] transition-all"
                >
                  {!isLoading && <Check className="h-4 w-4 mr-2" />}
                  {currentEmail ? 'Update Email' : 'Add Email'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 