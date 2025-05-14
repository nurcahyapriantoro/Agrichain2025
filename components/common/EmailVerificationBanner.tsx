'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Mail, AlertTriangle, X, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { authAPI } from '@/lib/api';

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // If the user is verified or not logged in, don't show the banner
  if (!session?.user || session.user.isEmailVerified || dismissed) {
    return null;
  }
  
  const handleSendVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authAPI.sendVerificationEmail();
      
      if (response.success) {
        setSuccess(true);
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
          setDismissed(true);
        }, 5000);
      } else {
        setError(response.message || 'Failed to send verification email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending verification email');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={`p-3 ${success ? 'bg-green-100' : 'bg-amber-100'} border-b border-amber-200 relative`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {success ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          )}
          
          <div className="text-sm text-gray-700">
            {success ? (
              <span>Verification email sent! Please check your inbox.</span>
            ) : (
              <span>
                Please verify your email address to use all features. 
                <span className="font-semibold"> You cannot perform transactions until your email is verified.</span>
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!success && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={handleSendVerification}
              disabled={loading}
            >
              <Mail className="h-3 w-3 mr-1" />
              {loading ? 'Sending...' : 'Send Verification Email'}
            </Button>
          )}
          
          <button 
            onClick={() => setDismissed(true)} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="text-xs text-red-600 mt-1 ml-10">
          {error}
        </div>
      )}
    </div>
  );
} 