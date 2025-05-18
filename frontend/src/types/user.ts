export enum UserRole {
  FARMER = 'FARMER',
  COLLECTOR = 'COLLECTOR',
  TRADER = 'TRADER',
  RETAILER = 'RETAILER',
  CONSUMER = 'CONSUMER'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
  publicKey?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  latitude?: number;
  longitude?: number;
  companyName?: string;
  bio?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  createdAt?: number;
  updatedAt?: number;
  isEmailVerified?: boolean;
  needsRoleSelection?: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  farmerCount: number;
  collectorCount: number;
  traderCount: number;
  retailerCount: number;
  consumerCount: number;
} 