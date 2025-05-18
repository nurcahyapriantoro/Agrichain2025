import type { Request, Response } from "express";
import { generateToken } from "../../../utils/jwtHelper";
import { encryptPrivateKey, decryptPrivateKey } from "../../../utils/encryption";
import { hashPassword, comparePassword } from "../../../utils/passwordUtils";
import { 
  User, 
  saveUserToDb, 
  getUserByEmail, 
  getUserById, 
  generateUserId, 
  generateKeyPair 
} from "../../../utils/userUtils";
import {
  sendEmail,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyToken as verifyEmailToken,
  createVerificationEmailTemplate,
  createPasswordResetEmailTemplate
} from '../../../utils/emailService';

// Register new user
const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }
    const userId = generateUserId(role);
    
    // Generate a unique key pair for this user
    const { privateKey, publicKey } = generateKeyPair();
    
    // Encrypt the private key with the user's password
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // Hash the password for secure storage
    const hashedPassword = await hashPassword(password);
    
    const newUser: User = {
      id: userId,
      email,
      password: hashedPassword,
      name,
      role,
      walletAddress: publicKey,
      encryptedPrivateKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      authMethods: ['email']
    };
    await saveUserToDb(newUser);
    
    // Generate token for the new user
    const token = generateToken({ id: userId, role: role });
    
    // Return user info (without sensitive data) and token
    const userResponse = {
      id: userId,
      email,
      name,
      role,
      walletAddress: publicKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      authMethods: ['email']
    };
    
    res.status(201).json({ 
      success: true, 
      message: "User registered successfully",
      token,
      user: userResponse
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
};

// Login user
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  
  // Check if the user has a password set (both regular users and wallet users with completed profiles)
  if (!user.password) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  
  // Verify password using bcrypt compare
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  
  // Generate a token with wallet address if it exists
  type TokenPayload = {
    id: string;
    role: string;
    walletAddress?: string;
  };
  
  const tokenPayload: TokenPayload = { 
    id: user.id, 
    role: user.role 
  };
  
  if (user.walletAddress) {
    tokenPayload.walletAddress = user.walletAddress;
  }
  
  const token = generateToken(tokenPayload);
  
  // Create a user response object without sensitive data
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    walletAddress: user.walletAddress,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    authMethods: user.authMethods || [],
    isEmailVerified: user.isEmailVerified || false
  };
  
  res.json({ 
    success: true, 
    message: "Login successful",
    token,
    user: userResponse
  });
};

// Change password
const changePassword = async (req: Request, res: Response) => {
  const user = req.user as User;
  const { oldPassword, newPassword } = req.body;
  
  // Verify old password
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  const isValidPassword = await comparePassword(oldPassword, user.password);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: "Invalid old password" });
  }
  
  try {
    // Re-encrypt private key with new password
    const privateKey = decryptPrivateKey(user.encryptedPrivateKey, oldPassword);
    const newEncryptedPrivateKey = encryptPrivateKey(privateKey, newPassword);
    
    // Update password and encrypted private key
    user.password = await hashPassword(newPassword);
    user.encryptedPrivateKey = newEncryptedPrivateKey;
    user.updatedAt = Date.now();
    
    await saveUserToDb(user);
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

// Send verification email
const sendVerificationEmail = async (req: Request, res: Response) => {
  const user = req.user as User;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const token = generateEmailVerificationToken(user.id);
  user.emailVerificationToken = token;
  user.emailVerificationExpires = Date.now() + 3600000; // 1 hour
  await saveUserToDb(user);
  const emailContent = createVerificationEmailTemplate(user.name || user.email, token);
  await sendEmail({
    to: user.email,
    subject: "Verify Your Email",
    html: emailContent
  });
  res.json({ success: true, message: "Verification email sent" });
};

// Verify email
const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;
  const tokenData = verifyEmailToken(token as string);
  if (!tokenData) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  const userId = tokenData.id;
  const user = await getUserById(userId);
  if (!user || user.emailVerificationToken !== token || (user.emailVerificationExpires && user.emailVerificationExpires < Date.now())) {
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await saveUserToDb(user);
  res.json({ success: true, message: "Email verified successfully" });
};

// Request password reset
const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  const token = generatePasswordResetToken(user.id);
  user.passwordResetToken = token;
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await saveUserToDb(user);
  const emailContent = createPasswordResetEmailTemplate(user.name || user.email, token);
  await sendEmail({
    to: user.email,
    subject: "Reset Your Password",
    html: emailContent
  });
  res.json({ success: true, message: "Password reset email sent" });
};

// Reset password form - redirect to frontend
const resetPasswordForm = async (req: Request, res: Response) => {
  const { token } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000' || 'http://localhost:3001';
  res.redirect(`${frontendUrl}/reset-password?token=${token}`);
};

// Reset password
const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.query;
  const { password } = req.body;
  const tokenData = verifyEmailToken(token as string);
  if (!tokenData) {
    return res.status(400).json({ success: false, message: "Invalid token" });
  }
  const userId = tokenData.id;
  const user = await getUserById(userId);
  if (!user || user.passwordResetToken !== token || (user.passwordResetExpires && user.passwordResetExpires < Date.now())) {
    return res.status(400).json({ success: false, message: "Invalid or expired token" });
  }
  
  try {
    // In case of password reset, we need to generate a new keypair since we can't decrypt the old one
    const { privateKey, publicKey } = generateKeyPair();
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // Update user data
    user.password = await hashPassword(password);
    user.walletAddress = publicKey;
    user.encryptedPrivateKey = encryptedPrivateKey;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.updatedAt = Date.now();
    
    await saveUserToDb(user);
    res.json({ 
      success: true, 
      message: "Password reset successfully. Note that a new keypair has been generated for your account." 
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Failed to reset password" });
  }
};

// Verify token
const verifyToken = async (req: Request, res: Response) => {
  // If request reaches here, the token is valid (checked by isAuthenticated middleware)
  // Just return the user data from the request
  res.json({ 
    success: true, 
    message: "Token is valid", 
    data: {
      user: req.user
    }
  });
};

// Refresh token
const refreshToken = async (req: Request, res: Response) => {
  const { userId, refreshToken } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }
  
  try {
    // Get user by ID
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Generate a new token with user data
    const tokenPayload: { 
      id: string; 
      role: string; 
      walletAddress?: string 
    } = { 
      id: user.id, 
      role: user.role
    };
    
    if (user.walletAddress) {
      tokenPayload.walletAddress = user.walletAddress;
    }
    
    const newToken = generateToken(tokenPayload);
    
    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          walletAddress: user.walletAddress,
        }
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Logout user
const logout = async (req: Request, res: Response) => {
  // In a JWT-based auth system, we typically don't store tokens server-side
  // Client should remove the token from storage
  // For additional security, you could implement a token blacklist or short expiry
  
  // If you have a token blacklist implementation, you could add:
  // const token = req.headers.authorization?.split(' ')[1];
  // await addToTokenBlacklist(token, req.user.id);
  
  res.json({ success: true, message: "Successfully logged out" });
};

export { 
  register, 
  login, 
  changePassword, 
  sendVerificationEmail, 
  verifyEmail, 
  requestPasswordReset, 
  resetPasswordForm, 
  resetPassword,
  logout,
  verifyToken,
  refreshToken
};