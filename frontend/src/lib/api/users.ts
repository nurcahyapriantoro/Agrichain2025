import { apiGet, apiPost, apiPut } from './client';
import { User, UserRole } from '../../types/user';
import { PaginatedResponse } from '../../types/common';


export interface UserListResponse extends PaginatedResponse<User> {
  users: User[];
}

/**
 * Get list of users with pagination
 */
export const getUsers = async (page = 1, limit = 10, filters = {}): Promise<UserListResponse> => {
  return apiGet<UserListResponse>('/user', { page, limit, ...filters });
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string): Promise<User> => {
  return apiGet<User>(`/user/${id}`);
};

/**
 * Update user profile
 */
export const updateProfile = async (data: Partial<Omit<User, 'id' | 'email'>>): Promise<User> => {
  return apiPut<User>('/user/profile', data);
};

/**
 * Update user role
 */
export const updateUserRole = async (role: UserRole): Promise<{data: {success: boolean}}> => {
  const response = await apiPut<{success: boolean}>('/user/role', { role });
  return { data: response };
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: string, page = 1, limit = 100): Promise<UserListResponse> => {
  return apiGet<UserListResponse>(`/user/by-role/${role}`, { page, limit });
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean }> => {
  return apiPost<{ success: boolean }>('/user/change-password', { 
    currentPassword,
    newPassword
  });
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = async (): Promise<User> => {
  return apiGet<User>('/user/profile');
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<{ success: boolean; data?: { profilePicture: string } }> => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  
  return apiPost<{ success: boolean; data?: { profilePicture: string } }>('/user/profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}; 