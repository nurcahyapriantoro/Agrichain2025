import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { jwtConfig } from '../../config';
import { UserRole } from '../../enum';

// Simplified interface for our User model - focusing on the data structure
interface IUser {
  _id: string;
  email?: string;
  role: UserRole;
  walletAddress?: string;
  profile: {
    name: string;
    [key: string]: any;
  };
  isEmailVerified: boolean;
  authMethods?: string[];
  save(): Promise<void>;
}

// Mock User model with static methods
const User = {
  findOne: async (query: any): Promise<IUser | null> => {
    return null;
  },
  findById: async (id: string): Promise<IUser | null> => {
    return null;
  },
  findByIdAndUpdate: async (id: string, update: any, options: any): Promise<IUser | null> => {
    return null;
  }
};

// Mock User constructor
class UserModel implements IUser {
  _id: string = '';
  email?: string;
  role: UserRole;
  walletAddress?: string;
  profile: { name: string; [key: string]: any };
  isEmailVerified: boolean;
  authMethods?: string[];

  constructor(data: Partial<IUser>) {
    this.role = data.role || UserRole.FARMER;
    this.profile = data.profile || { name: '' };
    this.isEmailVerified = data.isEmailVerified || false;
    this.walletAddress = data.walletAddress;
    this.authMethods = data.authMethods;
  }

  async save(): Promise<void> {
    // Mock implementation
  }
}

export const verifyWalletSignature = async (req: Request, res: Response) => {
  try {
    const { address, signature, message } = req.body;

    if (!address || !signature || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address, signature, and message are required' 
      });
    }
    
    // Verify the signature
    const signerAddress = ethers.verifyMessage(message, signature);
    
    // Check if the recovered address matches the claimed address
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    // Find or create user with this wallet address
    let user = await User.findOne({ walletAddress: address.toLowerCase() });
    
    if (!user) {
      // Create a new user with this wallet address
      user = new UserModel({
        walletAddress: address.toLowerCase(),
        authMethods: ['metamask'],
        role: UserRole.FARMER, 
        profile: {
          name: `Wallet ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        },
        isEmailVerified: true, // No email to verify for wallet-based accounts
      });
      
      await user.save();
    }
    
    // Generate JWT token - handle the secret properly
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        walletAddress: user.walletAddress
      },
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '24h' }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        role: user.role,
        walletAddress: user.walletAddress,
        profile: user.profile
      }
    });
    
  } catch (error: unknown) {
    console.error('Web3 authentication error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: errorMessage
    });
  }
};

export const linkWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { address, signature, message } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to link a wallet'
      });
    }
    
    if (!address || !signature || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address, signature, and message are required' 
      });
    }
    
    // Verify the signature
    const signerAddress = ethers.verifyMessage(message, signature);
    
    // Check if the recovered address matches the claimed address
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    // Check if wallet is already linked to another account
    const existingUser = await User.findOne({ walletAddress: address.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already linked to another account'
      });
    }
    
    // Update user with wallet address
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        walletAddress: address.toLowerCase(),
        $addToSet: { authMethods: 'metamask' }
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Wallet linked successfully',
      user: {
        id: user._id,
        role: user.role,
        walletAddress: user.walletAddress,
        profile: user.profile,
        authMethods: user.authMethods
      }
    });
    
  } catch (error: unknown) {
    console.error('Link wallet error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to link wallet';
    return res.status(500).json({
      success: false,
      message: 'Failed to link wallet',
      error: errorMessage
    });
  }
};

export const unlinkWallet = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to unlink a wallet'
      });
    }
    
    // Ensure user has email authentication before unlinking wallet
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has email auth method
    const hasEmailAuth = user.email && (user.authMethods?.includes('email') || user.authMethods?.includes('google'));
    
    if (!hasEmailAuth) {
      return res.status(400).json({
        success: false,
        message: 'Cannot unlink wallet: you need at least one alternative login method'
      });
    }
    
    // Remove wallet address
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $unset: { walletAddress: 1 },
        $pull: { authMethods: 'metamask' }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Failed to update user'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Wallet unlinked successfully',
      user: {
        id: updatedUser._id,
        role: updatedUser.role,
        email: updatedUser.email,
        profile: updatedUser.profile,
        authMethods: updatedUser.authMethods
      }
    });
    
  } catch (error: unknown) {
    console.error('Unlink wallet error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to unlink wallet';
    return res.status(500).json({
      success: false,
      message: 'Failed to unlink wallet',
      error: errorMessage
    });
  }
}; 