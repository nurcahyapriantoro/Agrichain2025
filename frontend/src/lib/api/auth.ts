import { apiPost, apiGet } from './client';
import { User } from '../../types/user';

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  user: User;
  token: string;
  success: boolean;
  message?: string;
}

// Add types for private key response
export interface PrivateKeyResponse {
  success: boolean;
  data: {
    privateKey: string;
  };
}

/**
 * Authenticate user with email and password
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  return apiPost<LoginResponse>('/auth/login', { email, password });
};

/**
 * Register a new user
 */
export const register = async (userData: {
  name: string; 
  email: string; 
  password: string; 
  role: string;
  phone?: string;
  address?: string;
}): Promise<RegisterResponse> => {
  return apiPost<RegisterResponse>('/auth/register', userData);
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    console.log('Fetching current user profile from /user/profile');
    const response = await apiGet<{ success: boolean; data: User }>('/user/profile');
    
    console.log('Response received:', response);
    
    if (response && response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Invalid response format from server');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<{ success: boolean }> => {
  return apiGet<{ success: boolean }>(`/auth/verify-email?token=${token}`);
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string): Promise<{ success: boolean }> => {
  return apiPost<{ success: boolean }>('/auth/forgot-password', { email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean }> => {
  return apiPost<{ success: boolean }>('/auth/reset-password', { token, newPassword });
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
  return apiPost<{ success: boolean }>('/auth/change-password', { currentPassword, newPassword });
};

/**
 * Logout (invalidate current token)
 */
export const logout = async (): Promise<{ success: boolean }> => {
  return apiPost<{ success: boolean }>('/auth/logout');
};

/**
 * Get the user's private key (requires password authentication)
 */
export const getPrivateKey = async (password: string): Promise<PrivateKeyResponse> => {
  return apiPost<PrivateKeyResponse>('/user/private-key', { password });
}; 