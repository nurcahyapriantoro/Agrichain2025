import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateToken } from "../../../utils/jwtHelper";
import { encryptPrivateKey } from "../../../utils/encryption";
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
  const { email, password, name, role } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Email already in use" });
  }
  const userId = generateUserId(role);
  const { privateKey, publicKey } = generateKeyPair();
  const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
  const hashedPassword = await bcrypt.hash(password, 10);
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
  res.status(201).json({ success: true, message: "User registered successfully" });
};

// Login user
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  const token = generateToken({ id: user.id, role: user.role });
  res.json({ success: true, token });
};

// Change password
const changePassword = async (req: Request, res: Response) => {
  const user = req.user as User;
  const { oldPassword, newPassword } = req.body;
  if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
    return res.status(401).json({ success: false, message: "Invalid old password" });
  }
  user.password = await bcrypt.hash(newPassword, 10);
  user.updatedAt = Date.now();
  await saveUserToDb(user);
  res.json({ success: true, message: "Password changed successfully" });
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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await saveUserToDb(user);
  res.json({ success: true, message: "Password reset successfully" });
};

export { 
  register, 
  login, 
  changePassword, 
  sendVerificationEmail, 
  verifyEmail, 
  requestPasswordReset, 
  resetPasswordForm, 
  resetPassword 
};