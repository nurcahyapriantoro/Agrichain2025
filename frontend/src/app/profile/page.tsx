'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import * as userAPI from '@/lib/api/users';
import * as authAPI from '@/lib/api/auth';
import { User, UserRole } from '@/types/user';
import { PasswordModal } from '@/components/ui/password-modal';
import { PrivateKeyModal } from '@/components/ui/private-key-modal';
import { RoleSelectionModal } from '@/components/ui/role-selection-modal';
import { Copy } from 'lucide-react';
import clsx from 'clsx';

// Define the session structure
interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
  publicKey?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  isEmailVerified?: boolean;
  needsRoleSelection?: boolean;
}

interface Session {
  user: SessionUser;
  expires: string;
}

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(6, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

// Add a custom background effect component
function Web3Background() {
  return (
    <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] animate-gradient-move">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 8 + 4}px`,
              height: `${Math.random() * 8 + 4}px`,
              background: `linear-gradient(135deg, #00ffcc, #00bfff, #a259ff)`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession() as {
    data: Session | null;
    update: (data?: any) => Promise<Session | null>;
  };
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  // New state for private key functionality
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPrivateKeyModalOpen, setIsPrivateKeyModalOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  
  // New state for role selection
  const [isRoleSelectionOpen, setIsRoleSelectionOpen] = useState(false);

  // State for copy-to-clipboard feedback
  const [isCopied, setIsCopied] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  // Check if user needs to show the role selection modal
  useEffect(() => {
    // Only show the role selection modal if:
    // 1. User is authenticated and has data
    // 2. User specifically needs role selection (from Google login)
    // OR user has an invalid/unknown role
    if (!userData) return;
    
    const stringRole = String(userData?.role || '').toUpperCase();
    const isInvalidRole = !userData.role || 
                         stringRole === 'UNKNOWN' || 
                         stringRole === 'UNDEFINED' || 
                         stringRole === 'NULL' || 
                         stringRole === '';
                           
    const needsRoleSelection = session?.user?.needsRoleSelection || isInvalidRole;
    
    console.log('Profile: Checking if role selection needed:', { 
      needsRoleSelection,
      sessionNeedsRole: session?.user?.needsRoleSelection,
      userDataRole: userData?.role,
      stringRole,
      isInvalidRole
    });
    
    if (needsRoleSelection) {
      setIsRoleSelectionOpen(true);
    }
  }, [userData, session]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setProfileError(null);
      
      console.log('Fetching user profile data...');
      const response = await authAPI.getCurrentUser();
      
      // Our getCurrentUser function always returns a data object now, even in case of errors
      console.log('User profile response:', response);
      
      if (response) {
        setUserData(response);
          
        // Set form default values
        setProfileValue('name', response.name || '');
        setProfileValue('phone', response.phone || '');
        setProfileValue('address', response.address || '');
      } else {
        console.warn('Unexpected response format:', response);
        useSessionAsFallback();
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      useSessionAsFallback();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to use session data as fallback
  const useSessionAsFallback = () => {
    if (session?.user) {
      console.log('Using session data as fallback for profile');
      const sessionUserData = {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || '',
        role: (session.user.role as UserRole) || UserRole.CONSUMER,
        walletAddress: session.user.walletAddress || '',
        phone: session.user.phone || '',
        address: session.user.address || '',
        profilePicture: session.user.profilePicture || '',
        isEmailVerified: session.user.isEmailVerified || false,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      setUserData(sessionUserData);
      
      // Set form values from session
      setProfileValue('name', session.user.name || '');
      setProfileValue('phone', session.user.phone || '');
      setProfileValue('address', session.user.address || '');
    } else {
      setProfileError('Could not retrieve user profile data');
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const response = await userAPI.updateProfile(data);
      
      if (response) {
        setProfileSuccess('Profile updated successfully!');
        // Refresh user data
        fetchUserProfile();
      } else {
        setProfileError('Failed to update profile. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setProfileError(error.response?.data?.message || 'An error occurred while updating the profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const response = await userAPI.changePassword(data.currentPassword, data.newPassword);
      
      if (response && response.success) {
        setPasswordSuccess('Password changed successfully!');
        resetPasswordForm();
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.response?.data?.message || 'An error occurred while changing the password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // New function to handle private key retrieval
  const handleGetPrivateKey = async (password: string) => {
    try {
      console.log('Attempting to get private key with password:', password);
      if (!password || password.trim() === '') {
        throw new Error('Password is required');
      }
      
      const response = await authAPI.getPrivateKey(password);
      console.log('API Response:', response);
      
      if (response && response.success && response.data?.privateKey) {
        console.log('Setting private key:', response.data.privateKey);
        setPrivateKey(response.data.privateKey);
        setIsPasswordModalOpen(false);
        setIsPrivateKeyModalOpen(true);
      } else {
        console.error('Invalid response format:', response);
        throw new Error('Failed to retrieve private key');
      }
    } catch (error: any) {
      console.error('Error retrieving private key:', error);
      // Re-throw with more specific error message
      if (error.response?.status === 401) {
        throw new Error('Invalid password. Please try again.');
      } else if (error.response?.status === 404) {
        throw new Error('Wallet not found or not properly initialized. Please contact administrator.');
      } else {
        throw new Error(error.response?.data?.message || error.message || 'An error occurred while retrieving the private key');
      }
    }
  };

  // Handle role selection
  const handleRoleSelected = async (role: string) => {
    try {
      console.log('Role selected:', role);
      setIsLoading(true);
      
      // Update local userData first for immediate UI feedback
      if (userData) {
        setUserData({
          ...userData,
          role: role as UserRole
        });
      }
      
      // Update session to reflect the new role - but don't reload the page
      // This is a more controlled approach that won't lose the authentication state
      if (session) {
        console.log('Updating session with new role:', role);
        await updateSession({
          ...session,
          user: {
            ...session.user,
            role
          }
        });
      }
      
      // Close the modal
      setIsRoleSelectionOpen(false);
      
      // Display a success message instead of reloading the page
      setProfileSuccess(`Your role has been updated to ${role} successfully!`);
      
      // Refresh user data from the server to ensure it's up to date
      await fetchUserProfile();
    } catch (error) {
      console.error('Error handling role selection:', error);
      setProfileError('Failed to update role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute skipRoleCheck={true}>
      <Web3Background />
      <div className="py-10 relative">
        <header>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-[#00ffcc] via-[#a259ff] to-[#00bfff] p-1 animate-glow">
                <div className="h-full w-full rounded-full bg-gray-900 flex items-center justify-center text-4xl font-bold text-white font-orbitron shadow-[0_0_30px_#00ffcc55]">
                  {userData?.name?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-xs rounded bg-[#232526] text-[#00ffcc] font-mono shadow-lg animate-fadeIn">
                {userData?.role || session?.user?.role || 'UNKNOWN'}
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-[#a259ff] font-orbitron tracking-wide drop-shadow-[0_0_30px_#00ffcc] mt-2 animate-fadeIn" style={{ border: 'none', background: 'transparent', boxShadow: 'none', textShadow: '0 0 20px rgba(0, 255, 204, 0.6), 0 0 40px rgba(162, 89, 255, 0.4)' }}>
              {userData?.name || session?.user?.name}
            </h1>
            <p className="text-base text-[#a259ff] font-mono animate-fadeIn">{userData?.email || session?.user?.email}</p>
          </div>
        </header>
        <main>
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 mt-8">
            <div className="space-y-8">
              {/* Wallet Section - Cyberpunk Card */}
              <div className="relative bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border-2 border-[#00ffcc] rounded-2xl shadow-[0_0_40px_#00ffcc33] p-6 overflow-hidden animate-fadeIn">
                <div className="absolute -inset-1.5 blur-2xl opacity-40 pointer-events-none bg-gradient-to-tr from-[#00ffcc] via-[#a259ff] to-[#00bfff] animate-gradient-move" />
                <h4 className="text-lg font-bold text-white mb-1 font-orbitron tracking-wider flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00ffcc] animate-pulse" />
                  Blockchain Wallet
                </h4>
                <p className="text-xs text-[#00ffcc] mb-4 font-mono">Manage your blockchain wallet credentials</p>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-xs font-semibold text-[#a259ff] uppercase tracking-widest">Wallet Address</dt>
                    <dd className="mt-1 text-sm text-white font-mono break-all flex items-center gap-2 bg-[#232526] rounded px-3 py-2 border border-[#00bfff] shadow-inner hover:shadow-[0_0_10px_#00bfff77] transition-shadow duration-300 cursor-pointer group"
                      onClick={async () => {
                        const address = userData?.walletAddress || session?.user?.walletAddress || '';
                        if (address) {
                          await navigator.clipboard.writeText(address);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 1500);
                        }
                      }}
                    >
                      {userData?.walletAddress || session?.user?.walletAddress}
                      <span className="relative">
                        <Copy className={clsx('h-4 w-4 transition-colors', isCopied ? 'text-[#00ffcc]' : 'text-[#a259ff] group-hover:text-[#00ffcc]')} />
                        {isCopied && (
                          <span className="absolute left-full ml-2 text-xs text-[#00ffcc] animate-fadeIn">Copied!</span>
                        )}
                      </span>
                    </dd>
                  </div>
                  {(userData?.publicKey || session?.user?.publicKey) && (
                    <div>
                      <dt className="text-xs font-semibold text-[#a259ff] uppercase tracking-widest">Public Key</dt>
                      <dd className="mt-1 text-sm text-white font-mono break-all bg-[#232526] rounded px-3 py-2 border border-[#a259ff] shadow-inner">
                        {userData?.publicKey || session?.user?.publicKey}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="w-full sm:w-auto border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc22] hover:text-white font-orbitron transition-all duration-300 shadow-[0_0_10px_#00ffcc55]"
                  >
                    Private Key
                  </Button>
                  <span className="text-xs text-[#a259ff] font-mono flex items-center gap-1 animate-fadeIn">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#a259ff] animate-pulse" />
                    You will need to enter your password to access your private key
                  </span>
                </div>
              </div>

              {/* Profile Info Card */}
              <div className="bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#a259ff] rounded-2xl shadow-[0_0_30px_#a259ff33] p-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-white font-orbitron mb-4 tracking-wider">Profile Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-[#a259ff] font-semibold uppercase mb-1">Role</div>
                    <div className="text-white font-mono flex items-center gap-2">
                      {userData?.role || session?.user?.role || 'Not assigned'}
                      {userData?.isEmailVerified || session?.user?.isEmailVerified ? (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#00ffcc33] text-[#00ffcc] text-xs font-bold animate-pulse">Verified</span>
                      ) : (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#a259ff33] text-[#a259ff] text-xs font-bold animate-fadeIn">Unverified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a259ff] font-semibold uppercase mb-1">User ID</div>
                    <div className="text-white font-mono">{userData?.id || session?.user?.id || 'Unknown'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a259ff] font-semibold uppercase mb-1">Phone</div>
                    <div className="text-white font-mono">{userData?.phone || session?.user?.phone || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a259ff] font-semibold uppercase mb-1">Address</div>
                    <div className="text-white font-mono">{userData?.address || session?.user?.address || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              {/* Profile Update Form */}
              <div className="bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#00bfff] rounded-2xl shadow-[0_0_30px_#00bfff33] p-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-white font-orbitron mb-4 tracking-wider">Update Profile</h3>
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-xs font-semibold text-[#00bfff] uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      {...registerProfile('name')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                    {profileErrors.name && (
                      <p className="mt-1 text-xs text-red-400">{profileErrors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold text-[#00bfff] uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      id="phone"
                      {...registerProfile('phone')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-xs font-semibold text-[#00bfff] uppercase mb-1">Address</label>
                    <textarea
                      id="address"
                      rows={3}
                      {...registerProfile('address')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" isLoading={isUpdatingProfile}
                      className="bg-[#00bfff] text-white hover:bg-[#00ffcc] hover:text-[#232526] font-orbitron shadow-[0_0_10px_#00bfff55] transition-all duration-300">
                      Update Profile
                    </Button>
                  </div>
                </form>
              </div>

              {/* Password Change Form */}
              <div className="bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#00ffcc] rounded-2xl shadow-[0_0_30px_#00ffcc33] p-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-white font-orbitron mb-4 tracking-wider">Change Password</h3>
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-xs font-semibold text-[#00ffcc] uppercase mb-1">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      {...registerPassword('currentPassword')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-xs text-red-400">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-xs font-semibold text-[#00ffcc] uppercase mb-1">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      {...registerPassword('newPassword')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-400">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmNewPassword" className="block text-xs font-semibold text-[#00ffcc] uppercase mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      {...registerPassword('confirmNewPassword')}
                      className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                    />
                    {passwordErrors.confirmNewPassword && (
                      <p className="mt-1 text-xs text-red-400">{passwordErrors.confirmNewPassword.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" isLoading={isChangingPassword}
                      className="bg-[#00ffcc] text-[#232526] hover:bg-[#00bfff] hover:text-white font-orbitron shadow-[0_0_10px_#00ffcc55] transition-all duration-300">
                      Change Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
      {/* Password Modal for Private Key Retrieval */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleGetPrivateKey}
        title="Enter Password to View Private Key"
        description="Your password is required to decrypt your blockchain private key."
      />
      {/* Private Key Display Modal */}
      <PrivateKeyModal
        isOpen={isPrivateKeyModalOpen}
        onClose={() => setIsPrivateKeyModalOpen(false)}
        privateKey={privateKey}
      />
      {/* Role Selection Modal */}
      <RoleSelectionModal
        isOpen={isRoleSelectionOpen}
        onClose={() => setIsRoleSelectionOpen(false)}
        onRoleSelected={handleRoleSelected}
      />
    </ProtectedRoute>
  );
}

// Custom CSS for animation (add to your global CSS or Tailwind config)
// .animate-glow { animation: glow 2s infinite alternate; }
// @keyframes glow { 0% { box-shadow: 0 0 10px #00ffcc55; } 100% { box-shadow: 0 0 40px #00ffcc; } }
// .animate-gradient-move { background-size: 200% 200%; animation: gradientMove 8s ease-in-out infinite; }
// @keyframes gradientMove { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
// .animate-float { animation: float 6s ease-in-out infinite; }
// @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
// .font-orbitron { font-family: 'Orbitron', 'Space Grotesk', 'Fira Mono', monospace; }
// .animate-fadeIn { animation: fadeIn 1s ease; }
// @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
//
// Tambahkan font Orbitron/Space Grotesk di _app.tsx atau index.html
//
