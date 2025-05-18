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
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { ImageUpload } from '@/components/ui/image-upload';

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
  companyName?: string;
  isEmailVerified?: boolean;
  needsRoleSelection?: boolean;
}

interface Session {
  user: SessionUser;
  expires: string;
}

const profileSchema = z.object({
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
  
  // New state for profile toggles
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const [showPasswordUpdate, setShowPasswordUpdate] = useState(false);

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
      
      // Set location if available
      setUserData(response);
      
      // Initialize form values
      setProfileValue('phone', response.phone || '');
      setProfileValue('address', response.address || '');
      
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setProfileError(error.message || 'Failed to load profile');
      setIsLoading(false);
      
      // Set to empty data structure to avoid undefined errors
      setUserData(null);
      
      useSessionAsFallback();
    }
  };
  
  const useSessionAsFallback = () => {
    if (session?.user) {
      console.log('Using session data as fallback', session.user);
      const sessionUser: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: session.user.role,
        walletAddress: session.user.walletAddress || session.user.publicKey || '',
        phone: session.user.phone || '',
        address: session.user.address || '',
        profilePicture: session.user.profilePicture || '',
      };
      
      setUserData(sessionUser);
      
      // Initialize form values from session
      setProfileValue('phone', sessionUser.phone || '');
      setProfileValue('address', sessionUser.address || '');
    }
  };

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      
      const updateData = {
        phone: data.phone || undefined,
        address: data.address || undefined,
      };
      
      // Add location data if available
      console.log('Updating profile with data:', updateData);
      const response = await userAPI.updateProfile(updateData);
      
      console.log('Profile update response:', response);
      setUserData(response);
      
      // Also update the session data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          phone: response.phone,
          address: response.address
        }
      });
      
      setProfileSuccess('Profile updated successfully!');
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
      
      if (response.success) {
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
  
  const handleProfilePictureUpload = async (file: File) => {
    try {
      setIsUpdatingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);
      
      const response = await userAPI.uploadProfilePicture(file);
      
      if (response.success && response.data) {
        // Update user data with new profile picture URL
        setUserData({
          ...userData!,
          profilePicture: response.data.profilePicture
        });
        
        // Also update the session data
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            profilePicture: response.data.profilePicture
          }
        });
        
        setProfileSuccess('Profile picture updated successfully!');
      } else {
        setProfileError('Failed to upload profile picture. Please try again.');
      }
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setProfileError(error.response?.data?.message || 'An error occurred while uploading the profile picture. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };
  
  const handleGetPrivateKey = async (password: string): Promise<void> => {
    try {
      const response = await authAPI.getPrivateKey(password);
      
      if (response.success && response.data) {
        setPrivateKey(response.data.privateKey);
        setIsPasswordModalOpen(false);
        setIsPrivateKeyModalOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error retrieving private key:', error);
    }
  };
  
  const handleCopyWalletAddress = () => {
    if (userData?.walletAddress) {
      try {
        navigator.clipboard.writeText(userData.walletAddress);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };
  
  const handleRoleSelected = async (role: string) => {
    try {
      console.log(`Setting user role to: ${role}`);
      const response = await userAPI.updateUserRole(role as UserRole);
      
      if (response.data.success) {
        // Update user data
        setUserData({
          ...userData!,
          role: role as UserRole
        });
        
        // Also update the session data
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            role: role as UserRole,
            needsRoleSelection: false
          }
        });
        
        // Close the modal
        setIsRoleSelectionOpen(false);
        
        // Show success message
        setProfileSuccess('Role updated successfully! Please refresh the page to see all new features.');
      } else {
        setProfileError('Failed to update role. Please try again.');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      setProfileError(error.message || 'An error occurred while updating the role. Please try again.');
    }
  };
  
  return (
    <ProtectedRoute skipRoleCheck={true}>
      <Web3Background />
      <div className="py-10 relative">
        <header>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-2">
            {/* Profile image */}
            <div className="relative group">
              {userData?.profilePicture ? (
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-tr from-[#00ffcc] via-[#a259ff] to-[#00bfff] p-1.5 animate-glow shadow-[0_0_50px_rgba(0,255,204,0.4)]">
                  <div className="h-full w-full rounded-full overflow-hidden">
                    <ImageUpload 
                      currentImageUrl={userData.profilePicture}
                      onUpload={handleProfilePictureUpload}
                      size="lg"
                      shape="circle"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gradient-to-tr from-[#00ffcc] via-[#a259ff] to-[#00bfff] p-1.5 animate-glow shadow-[0_0_50px_rgba(0,255,204,0.4)]">
                  <div className="h-full w-full rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
                    <ImageUpload
                      onUpload={handleProfilePictureUpload}
                      size="lg" 
                      shape="circle"
                    >
                      <span className="text-5xl font-bold text-white font-orbitron">
                        {userData?.name?.charAt(0) || session?.user?.name?.charAt(0) || 'U'}
                      </span>
                    </ImageUpload>
                  </div>
                </div>
              )}
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 text-sm rounded bg-[#232526] text-[#00ffcc] font-mono shadow-lg animate-fadeIn border border-[#00ffcc33]">
                {userData?.role || session?.user?.role || 'UNKNOWN'}
              </span>
            </div>
            <h1 className="text-3xl font-bold leading-tight text-[#a259ff] font-orbitron tracking-wide drop-shadow-[0_0_30px_#00ffcc] mt-2 animate-fadeIn" style={{ border: 'none', background: 'transparent', boxShadow: 'none', textShadow: '0 0 20px rgba(0, 255, 204, 0.6), 0 0 40px rgba(162, 89, 255, 0.4)' }}>
              {userData?.name || session?.user?.name}
            </h1>
            <p className="text-base text-[#a259ff] font-mono animate-fadeIn">{userData?.email || session?.user?.email}</p>
            
            {userData?.companyName && (
              <p className="text-sm text-[#00ffcc] font-mono animate-fadeIn mt-1">{userData.companyName}</p>
            )}
            
            {/* Success/error messages */}
            {profileError && (
              <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 text-white rounded-lg text-sm animate-fadeIn">
                {profileError}
              </div>
            )}
            
            {profileSuccess && (
              <div className="mt-4 p-3 bg-[#00ffcc33] border border-[#00ffcc] text-white rounded-lg text-sm animate-fadeIn">
                {profileSuccess}
              </div>
            )}
          </div>
        </header>
        
        <main>
          <div className="max-w-3xl mx-auto sm:px-6 lg:px-8 mt-8">
            <div className="space-y-8">
              {/* Wallet Section - Cyberpunk Card */}
              <div className="relative bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#00ffcc] rounded-2xl shadow-[0_0_40px_#00ffcc33] p-6 overflow-hidden animate-fadeIn">
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
                      onClick={handleCopyWalletAddress}
                    >
                      {userData?.walletAddress}
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
                    <div className="text-white font-mono flex items-center gap-2">
                      {userData?.phone || session?.user?.phone || 'Not specified'}
                      {userData?.phone && (
                        <a 
                          href={`https://wa.me/${userData.phone.replace(/\+/g, '').replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00ffcc] hover:underline inline-flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-1">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M8.46 14.45L7.5 16.5C7.16 16.3 6.84 16.08 6.53 15.81C6.21 15.58 5.65 15.05 5.16 14.47C4.68 13.88 4.27 13.17 4 12.5C4.19 12.22 4.39 11.86 4.55 11.58C4.71 11.29 4.94 10.87 5.17 10.5H7.17C7.6 11.26 7.97 11.84 8.14 12.05C8.3 12.26 8.5 12.59 8.46 14.45M12 17.5C11.5 17.5 10.97 17.47 10.5 17.39C10.34 16.96 10.21 16.39 10.2 16C10.03 15.83 9.85 15.67 9.41 15.5C9.08 15.36 8.28 15.11 8 15C8.3 13.86 8.5 12.5 8.5 12.5C8.5 12.5 9.97 12.09 10.4 11.95C10.82 11.81 10.94 11.66 11.24 11.5C11.5 11.35 12.31 11.11 12.89 11.03C13 11.82 13 12.5 13 12.5C13 12.5 13.44 12.5 14.02 12.5C14.59 12.5 14.95 12.55 15.09 12.69C15.22 12.84 15.38 13.08 15.42 13.5H13.5C13.5 13.5 13.24 13.5 13 13.95V15H15.5C15.35 15.6 15.17 16.06 15.03 16.34C14.89 16.62 14.5 17.5 14.5 17.5H12Z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#a259ff] font-semibold uppercase mb-1">Address</div>
                    <div className="text-white font-mono">{userData?.address || session?.user?.address || 'Not specified'}</div>
                  </div>
                </div>
              </div>

              {/* Profile Update Form */}
              <div className="bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#00bfff] rounded-2xl shadow-[0_0_30px_#00bfff33] p-6 animate-fadeIn">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setShowProfileUpdate(!showProfileUpdate)}
                >
                  <h3 className="text-lg font-bold text-white font-orbitron tracking-wider">Update Profile</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#00bfff]"
                  >
                    {showProfileUpdate ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {showProfileUpdate && (
                  <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6 mt-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-[#00bfff] uppercase mb-1">Phone Number (WhatsApp)</label>
                      <input
                        type="text"
                        id="phone"
                        {...registerProfile('phone')}
                        className="shadow-sm focus:ring-[#00ffcc] focus:border-[#00ffcc] block w-full sm:text-sm border-[#232526] bg-[#181a1b] text-white rounded-md px-3 py-2 font-mono"
                        placeholder="e.g. +6281234567890"
                      />
                      {userData?.phone && (
                        <a 
                          href={`https://wa.me/${userData.phone.replace(/\+/g, '').replace(/\s/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center text-xs text-[#00ffcc] hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2M8.46 14.45L7.5 16.5C7.16 16.3 6.84 16.08 6.53 15.81C6.21 15.58 5.65 15.05 5.16 14.47C4.68 13.88 4.27 13.17 4 12.5C4.19 12.22 4.39 11.86 4.55 11.58C4.71 11.29 4.94 10.87 5.17 10.5H7.17C7.6 11.26 7.97 11.84 8.14 12.05C8.3 12.26 8.5 12.59 8.46 14.45M12 17.5C11.5 17.5 10.97 17.47 10.5 17.39C10.34 16.96 10.21 16.39 10.2 16C10.03 15.83 9.85 15.67 9.41 15.5C9.08 15.36 8.28 15.11 8 15C8.3 13.86 8.5 12.5 8.5 12.5C8.5 12.5 9.97 12.09 10.4 11.95C10.82 11.81 10.94 11.66 11.24 11.5C11.5 11.35 12.31 11.11 12.89 11.03C13 11.82 13 12.5 13 12.5C13 12.5 13.44 12.5 14.02 12.5C14.59 12.5 14.95 12.55 15.09 12.69C15.22 12.84 15.38 13.08 15.42 13.5H13.5C13.5 13.5 13.24 13.5 13 13.95V15H15.5C15.35 15.6 15.17 16.06 15.03 16.34C14.89 16.62 14.5 17.5 14.5 17.5H12Z" />
                          </svg>
                          Open WhatsApp
                        </a>
                      )}
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
                )}
              </div>

              {/* Password Change Form */}
              <div className="bg-gradient-to-br from-[#232526cc] to-[#0f2027cc] border border-[#00ffcc] rounded-2xl shadow-[0_0_30px_#00ffcc33] p-6 animate-fadeIn">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => setShowPasswordUpdate(!showPasswordUpdate)}
                >
                  <h3 className="text-lg font-bold text-white font-orbitron tracking-wider">Change Password</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#00ffcc]"
                  >
                    {showPasswordUpdate ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                
                {showPasswordUpdate && (
                  <>
                    {passwordError && (
                      <div className="mt-4 p-3 bg-red-900 bg-opacity-50 border border-red-600 text-white rounded-lg text-sm animate-fadeIn">
                        {passwordError}
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="mt-4 p-3 bg-[#00ffcc33] border border-[#00ffcc] text-white rounded-lg text-sm animate-fadeIn">
                        {passwordSuccess}
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6 mt-4">
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
                  </>
                )}
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
