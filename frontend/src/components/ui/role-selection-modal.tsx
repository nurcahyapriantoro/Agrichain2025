'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from './button';
import { UserRole } from '@/types/user';
import { updateProfile } from '@/lib/api';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelected: (role: string) => void;
}

export function RoleSelectionModal({ isOpen, onClose, onRoleSelected }: RoleSelectionModalProps) {
  const { data: session, update: updateSession } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>(UserRole.CONSUMER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set initial role from session if available
  useEffect(() => {
    if (session?.user?.role && session.user.role !== 'UNKNOWN' && session.user.role !== 'unknown') {
      setSelectedRole(session.user.role);
    }
  }, [session]);

  const roleDescriptions: Record<string, string> = {
    [UserRole.FARMER]: 'Produce and track agricultural products',
    [UserRole.COLLECTOR]: 'Collect and aggregate products from farmers',
    [UserRole.TRADER]: 'Buy and sell products in bulk',
    [UserRole.RETAILER]: 'Sell products to end consumers',
    [UserRole.CONSUMER]: 'Purchase and verify products',
    [UserRole.ADMIN]: 'Administer the platform and users',
  };

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Submitting role selection:', selectedRole);
      const response = await updateProfile({ role: selectedRole as UserRole });

      console.log('Role update response:', response);
      
      if (response) {
        // Update session with new role
        if (session) {
          console.log('Updating session after role selection');
          await updateSession({
            ...session,
            user: {
              ...session.user,
              role: selectedRole,
              needsRoleSelection: false
            }
          });
        }
        
        onRoleSelected(selectedRole);
      } else {
        console.error('Role update failed');
        setError('Failed to update role. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      const errorMessage = error.response?.data?.message || 
                           error.response?.statusText ||
                           error.message ||
                           'An error occurred while updating role. Please check your connection and try again.';
      
      if (error.response?.status === 401) {
        setError('Authentication required. Your session might have expired. Please try logging out and back in.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select Your Role
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Please select a role that best describes how you will use our platform. This helps us customize your experience.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            {Object.values(UserRole).map((role) => (
              <div
                key={role}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedRole === role 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                }`}
                onClick={() => setSelectedRole(role)}
              >
                <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full border ${
                    selectedRole === role 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedRole === role && (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{role}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{roleDescriptions[role] || 'Use the platform'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} isLoading={isLoading}>
              Confirm Selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 