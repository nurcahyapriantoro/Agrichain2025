import type { Request, Response } from "express";
import { txhashDB } from "../../helper/level.db.client";
import { decryptPrivateKey } from "../../utils/encryption";
import { UserRole } from "../../enum";
import { 
  User,
  getUserById,
  saveUserToDb,
  getUserByEmail,
  getUserByWalletAddress,
  generateUserId,
  generateKeyPair
} from "../../utils/userUtils";

// Get all users
const getUserList = async (_req: Request, res: Response) => {
  try {
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.startsWith('user:'));
    const userList = await Promise.all(
      userKeys.map(async key => {
        const userData = await txhashDB.get(key);
        return JSON.parse(userData) as User;
      })
    );
    res.json({ success: true, data: userList });
  } catch (error) {
    console.error("Error retrieving user list:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve user list" });
  }
};

// Get user by ID
const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve user" });
  }
};

// Get private key
const getPrivateKey = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { password } = req.body;
  const user = await getUserById(id);
  if (!user || !user.encryptedPrivateKey) {
    return res.status(404).json({ success: false, message: "User or private key not found" });
  }
  try {
    const privateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
    res.json({ success: true, privateKey });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
};

// Update user profile
const updateUserProfile = async (req: Request, res: Response) => {
  const user = req.user as User;
  const { name, phone, address, profilePicture } = req.body;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  user.name = name || user.name;
  user.phone = phone || user.phone;
  user.address = address || user.address;
  user.profilePicture = profilePicture || user.profilePicture;
  user.updatedAt = Date.now();
  await saveUserToDb(user);
  res.json({ success: true, message: "Profile updated successfully" });
};

// Update user role
const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = await getUserById(id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }
  user.role = role;
  user.updatedAt = Date.now();
  await saveUserToDb(user);
  res.json({ success: true, message: "Role updated successfully" });
};

// Get profile info
const getProfileInfo = async (req: Request, res: Response) => {
  const user = req.user as User;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  res.json({ success: true, data: user });
};

export { 
  getUserList, 
  getUser, 
  getPrivateKey,
  updateUserProfile,
  updateUserRole,
  getProfileInfo,
  getUserById,
  saveUserToDb,
  getUserByEmail,
  getUserByWalletAddress,
  generateUserId,
  generateKeyPair
};