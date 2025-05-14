import type { Request, Response } from "express";
import passport from "passport";
import { Profile } from 'passport-google-oauth20';
import { generateToken } from "../../../utils/jwtHelper";
import { User, saveUserToDb, getUserById, generateUserId } from "../../../utils/userUtils";
import { UserRole } from "../../../enum";

// Start Google authentication
const startGoogleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

// Google login handler
const handleGoogleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as User;
    if (!user) {
      return res.status(401).json({ success: false, message: "Authentication failed" });
    }
    const token = generateToken({ id: user.id, role: user.role });
    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: { user, token },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ success: false, message: "An error occurred during Google login" });
  }
};

// Find or create Google user
const findOrCreateGoogleUser = async (profile: Profile): Promise<User | null> => {
  let user = await getUserById(`user-google:${profile.id}`);
  if (!user) {
    const userId = generateUserId('USER');
    user = {
      id: userId,
      email: profile.emails?.[0].value || '',
      name: profile.displayName,
      role: 'USER',
      googleId: profile.id,
      authMethods: ['google'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      password: '',
      encryptedPrivateKey: ''
    };
    await saveUserToDb(user);
  }
  return user;
};

// Register with Google
const registerWithGoogle = async (req: Request, res: Response) => {
  const { role } = req.body;
  const googleProfile = (req.session as any).googleProfile as Profile;
  if (!googleProfile || !role) {
    return res.status(400).json({ success: false, message: "Missing Google profile or role" });
  }
  const user = await findOrCreateGoogleUser(googleProfile);
  if (!user) {
    return res.status(500).json({ success: false, message: "Failed to create user" });
  }
  user.role = role;
  await saveUserToDb(user);
  const token = generateToken({ id: user.id, role: user.role });
  res.json({ success: true, token });
};

// Select role for new Google user
const selectRole = async (req: Request, res: Response) => {
  if (!(req.session as any).googleProfile) {
    return res.redirect('/api/auth/google');
  }
  const roleOptions = Object.values(UserRole)
    .map(role => `<option value="${role}">${role}</option>`)
    .join('');
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Pilih Role - Agrichain</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      h1 { color: #333; }
      select { width: 100%; padding: 8px; margin: 10px 0; }
      button { background: #4285f4; color: white; border: none; padding: 10px 15px; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Pilih Role untuk Akun Anda</h1>
    <p>Anda berhasil login dengan Google. Silakan pilih role untuk akun Anda:</p>
    <form action="/api/auth/register-google" method="post">
      <select name="role" required>
        <option value="">-- Pilih Role --</option>
        ${roleOptions}
      </select>
      <p><button type="submit">Daftar</button></p>
    </form>
  </body>
  </html>
  `;
  res.send(html);
};

// Link Google account
const linkGoogleAccount = async (req: Request, res: Response) => {
  const user = req.user as User;
  const googleProfile = req.body.profile as Profile;
  if (!user || !googleProfile) {
    return res.status(400).json({ success: false, message: "User or Google profile not found" });
  }
  user.googleId = googleProfile.id;
  user.authMethods?.push('google');
  await saveUserToDb(user);
  res.json({ success: true, message: "Google account linked successfully" });
};

export { 
  startGoogleAuth, 
  handleGoogleCallback, 
  findOrCreateGoogleUser, 
  registerWithGoogle, 
  selectRole, 
  linkGoogleAccount 
};