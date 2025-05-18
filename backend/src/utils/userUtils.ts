import { txhashDB } from "../helper/level.db.client";
import { v4 as uuidv4 } from 'uuid';
import { ec as EC } from "elliptic";

// Interface for User data
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  walletAddress?: string;
  encryptedPrivateKey: string;
  googleId?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: number;
  passwordResetToken?: string;
  passwordResetExpires?: number;
  authMethods?: string[];
}

// Helper function to save user to database
export async function saveUserToDb(user: User): Promise<void> {
  try {
    if (!user.authMethods) {
      user.authMethods = [];
    }
    
    await txhashDB.put(`user:${user.id}`, JSON.stringify(user));
    if (user.email) {
      await txhashDB.put(`user-email:${user.email.toLowerCase()}`, user.id);
    }
    if (user.walletAddress) {
      await txhashDB.put(`user-wallet:${user.walletAddress.toLowerCase()}`, user.id);
    }
  } catch (error) {
    console.error(`Error saving user ${user.id} to database:`, error);
    throw error;
  }
}

// Helper function to get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userData = await txhashDB.get(`user:${userId}`);
    // Check if userData is already an object or needs parsing
    return typeof userData === 'object' ? userData : JSON.parse(userData) as User;
  } catch (error) {
    console.error(`Error getting user by ID ${userId}:`, error);
    return null;
  }
}

// Helper function to get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const userId = await txhashDB.get(`user-email:${normalizedEmail}`);
    return await getUserById(userId);
  } catch (error) {
    return null;
  }
}

// Helper function to get user by wallet address
export async function getUserByWalletAddress(walletAddress: string): Promise<User | null> {
  try {
    if (!walletAddress) return null;
    const normalizedAddress = walletAddress.toLowerCase().trim();
    const userId = await txhashDB.get(`user-wallet:${normalizedAddress}`);
    const userData = await txhashDB.get(`user:${userId}`);
    
    if (!userData) return null;
    
    // Check if userData is already an object or needs parsing
    return typeof userData === 'object' ? userData : JSON.parse(userData) as User;
  } catch (error) {
    console.error(`Error finding user by wallet address ${walletAddress}:`, error);
    return null;
  }
}

// Generate User ID based on role
export function generateUserId(role: string): string {
  const uniqueCode = uuidv4().split('-')[0];
  return `${role.toUpperCase()}-${uniqueCode}`;
}

// Generate key pair
export function generateKeyPair() {
  const ec = new EC('secp256k1');
  const keyPair = ec.genKeyPair();
  const privateKey = keyPair.getPrivate('hex');
  const publicKey = keyPair.getPublic('hex');
  return { privateKey, publicKey };
}

// Get current user by ID
export const getCurrentUserById = async (id: string): Promise<User | null> => {
  return await getUserById(id);
}; 