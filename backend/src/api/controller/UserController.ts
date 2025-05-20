import type { Request, Response } from "express";
import { txhashDB } from "../../helper/level.db.client";
import { encryptPrivateKey, decryptPrivateKey } from "../../utils/encryption";
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
    
    const userList = [];
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        // Check if userData is already an object or needs parsing
        const userObj = typeof userData === 'object' ? userData : JSON.parse(userData);
        userList.push(userObj);
      } catch (parseError) {
        console.error(`Error parsing user data for key ${key}:`, parseError);
        // Continue processing other users
      }
    }
    
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
  const user = req.user as User;
  const { password } = req.body;
  
  if (!user || !user.encryptedPrivateKey) {
    return res.status(404).json({ success: false, message: "User or private key not found" });
  }
  
  try {
    const privateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
    res.json({ 
      success: true, 
      data: {
        privateKey,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid password" });
  }
};

// Get user's public key
const getPublicKey = async (req: Request, res: Response) => {
  const user = req.user as User;
  
  if (!user || !user.walletAddress) {
    return res.status(404).json({ success: false, message: "User or public key not found" });
  }
  
  res.json({ 
    success: true, 
    data: {
      publicKey: user.walletAddress,
      userId: user.id,
      userName: user.name
    }
  });
};

// Check if user has keypair
const checkKeyPair = async (req: Request, res: Response) => {
  const user = req.user as User;
  
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  const hasKeyPair = !!(user.walletAddress && user.encryptedPrivateKey);
  
  res.json({ 
    success: true, 
    data: {
      hasKeyPair,
      publicKey: user.walletAddress || null
    }
  });
};

// Regenerate keypair for user
const regenerateKeyPair = async (req: Request, res: Response) => {
  const user = req.user as User;
  const { password } = req.body;
  
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  try {
    // Generate new keypair
    const { privateKey, publicKey } = generateKeyPair();
    
    // Encrypt private key with user's password
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // Update user record
    user.walletAddress = publicKey;
    user.encryptedPrivateKey = encryptedPrivateKey;
    user.updatedAt = Date.now();
    
    await saveUserToDb(user);
    
    res.json({ 
      success: true, 
      message: "Key pair regenerated successfully",
      data: {
        publicKey
      }
    });
  } catch (error) {
    console.error("Error regenerating key pair:", error);
    res.status(500).json({ success: false, message: "Failed to regenerate key pair" });
  }
};

// Get public key by user ID
const getPublicKeyById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const user = await getUserById(id);
    if (!user || !user.walletAddress) {
      return res.status(404).json({ success: false, message: "User or public key not found" });
    }
    
    res.json({ 
      success: true, 
      data: {
        publicKey: user.walletAddress,
        userId: user.id,
        userName: user.name
      }
    });
  } catch (error) {
    console.error("Error retrieving public key:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve public key" });
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

// Upload profile picture
const uploadProfilePicture = async (req: Request, res: Response) => {
  const user = req.user as User;
  if (!user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }

  try {
    // Update user's profile picture with the file path
    const filePath = `/uploads/${req.file.filename}`;
    user.profilePicture = filePath;
    user.updatedAt = Date.now();
    
    await saveUserToDb(user);
    
    res.json({ 
      success: true, 
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: filePath
      }
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: "Failed to upload profile picture" });
  }
};

// Get users by role COLLECTOR
const getUsersByRoleCollector = async (req: Request, res: Response) => {
  try {
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.startsWith('user:'));
    
    const userList = [];
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        // Check if userData is already an object or needs parsing
        const userObj = typeof userData === 'object' ? userData : JSON.parse(userData);
        
        // Filter only COLLECTOR role users
        if (userObj.role === UserRole.COLLECTOR) {
          userList.push({
            id: userObj.id,
            name: userObj.name || `User ${userObj.id.substring(0, 6)}`,
            role: userObj.role,
            email: userObj.email
          });
        }
      } catch (parseError) {
        console.error(`Error parsing user data for key ${key}:`, parseError);
        // Continue processing other users
      }
    }
    
    res.json({ success: true, data: userList });
  } catch (error) {
    console.error("Error retrieving COLLECTOR users:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve COLLECTOR users" });
  }
};

// Get users by role TRADER
const getUsersByRoleTrader = async (req: Request, res: Response) => {
  try {
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.startsWith('user:'));
    
    const userList = [];
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        // Check if userData is already an object or needs parsing
        const userObj = typeof userData === 'object' ? userData : JSON.parse(userData);
        
        // Filter only TRADER role users
        if (userObj.role === UserRole.TRADER) {
          userList.push({
            id: userObj.id,
            name: userObj.name || `User ${userObj.id.substring(0, 6)}`,
            role: userObj.role,
            companyName: userObj.companyName || '',
            location: userObj.address || '',
            email: userObj.email
          });
        }
      } catch (parseError) {
        console.error(`Error parsing user data for key ${key}:`, parseError);
        // Continue processing other users
      }
    }
    
    res.json({ success: true, data: userList });
  } catch (error) {
    console.error("Error retrieving TRADER users:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve TRADER users" });
  }
};

// Get users by role RETAILER
const getUsersByRoleRetailer = async (req: Request, res: Response) => {
  try {
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.startsWith('user:'));
    
    const userList = [];
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        // Check if userData is already an object or needs parsing
        const userObj = typeof userData === 'object' ? userData : JSON.parse(userData);
        
        // Filter only RETAILER role users
        if (userObj.role === UserRole.RETAILER) {
          userList.push({
            id: userObj.id,
            name: userObj.name || `User ${userObj.id.substring(0, 6)}`,
            role: userObj.role,
            companyName: userObj.companyName || '',
            location: userObj.address || '',
            email: userObj.email
          });
        }
      } catch (parseError) {
        console.error(`Error parsing user data for key ${key}:`, parseError);
        // Continue processing other users
      }
    }
    
    res.json({ success: true, data: userList });
  } catch (error) {
    console.error("Error retrieving RETAILER users:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve RETAILER users" });
  }
};

export { 
  getUserList, 
  getUser, 
  getPrivateKey,
  getPublicKey,
  checkKeyPair,
  regenerateKeyPair,
  getPublicKeyById,
  updateUserProfile,
  updateUserRole,
  getProfileInfo,
  uploadProfilePicture,
  getUserById,
  saveUserToDb,
  getUserByEmail,
  getUserByWalletAddress,
  generateUserId,
  generateKeyPair,
  getUsersByRoleCollector,
  getUsersByRoleTrader,
  getUsersByRoleRetailer
};