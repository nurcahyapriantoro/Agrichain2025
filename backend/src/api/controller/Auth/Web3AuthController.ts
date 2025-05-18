import { Request, Response } from "express";
import { ethers } from "ethers";
import { generateToken } from "../../../utils/jwtHelper";
import { User, saveUserToDb, getUserByWalletAddress, generateUserId, generateKeyPair } from "../../../utils/userUtils";

const SUPPORTED_CHAIN_ID = '0x531';

const loginWithWallet = async (req: Request, res: Response) => {
  const { address, signature, message } = req.body;
  if (!address || !signature || !message) {
    return res.status(400).json({ success: false, message: "Address, signature, and message are required" });
  }
  const signerAddress = ethers.verifyMessage(message, signature);
  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  } 
  let user = await getUserByWalletAddress(address);
  if (!user) {
    return res.status(404).json({ 
      success: false, 
      message: "Wallet not registered. Please register first.",
      needsRegistration: true
    });
  }
  const token = generateToken({ id: user.id, role: user.role, walletAddress: user.walletAddress });
  res.status(200).json({
    success: true,
    message: "Authentication successful",
    token,
    user: { id: user.id, role: user.role, walletAddress: user.walletAddress },
  });
};

const registerWithWallet = async (req: Request, res: Response) => {
  const { name, role, address, signature, message, chainId } = req.body;

  // Validasi field wajib
  if (!name) {
    return res.status(400).json({ success: false, message: "Name is required" });
  }
  if (!role) {
    return res.status(400).json({ success: false, message: "Role is required" });
  }
  
  // Validate role format
  const validRoles = ["FARMER", "COLLECTOR", "TRADER", "RETAILER", "CONSUMER"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false, 
      message: "Invalid role. Must be one of: FARMER, COLLECTOR, TRADER, RETAILER, CONSUMER" 
    });
  }
  
  if (!address) {
    return res.status(400).json({ success: false, message: "Address is required" });
  }
  if (!signature) {
    return res.status(400).json({ success: false, message: "Signature is required" });
  }
  if (!message) {
    return res.status(400).json({ success: false, message: "Message is required" });
  }
  if (!chainId) {
    return res.status(400).json({ success: false, message: "Chain ID is required" });
  }

  if (chainId !== SUPPORTED_CHAIN_ID) {
    return res.status(400).json({
      success: false,
      message: `Unsupported chain ID: ${chainId}. Expected: ${SUPPORTED_CHAIN_ID}`,
    });
  }

  try {
    // Verifikasi tanda tangan
    const signerAddress = ethers.verifyMessage(message, signature);
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    // Cek apakah wallet sudah terdaftar
    const existingUser = await getUserByWalletAddress(address);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This wallet address is already registered",
      });
    }

  const userId = generateUserId(role);
  generateKeyPair(); 
  const newUser = {
    id: userId,
    name,
    role,
    walletAddress: address.toLowerCase(),
    authMethods: ["metamask"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isEmailVerified: false,
    email: `${address.substring(0, 6)}@wallet.agrichain.local`,
    password: "",
    encryptedPrivateKey: "",
  };
  await saveUserToDb(newUser);
  const token = generateToken({ id: userId, role, walletAddress: address });
  res.status(201).json({
    success: true,
    message: "User registered successfully with wallet",
    token,
    user: { id: userId, name, role, walletAddress: address },
  });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user with wallet",
    });
  }
};

const linkWallet = async (req: Request, res: Response) => {
  const { address, signature, message } = req.body;
  const user = req.user as User;
  
  if (!address || !signature || !message) {
    return res.status(400).json({ success: false, message: "Address, signature, and message are required" });
  }
  
  const signerAddress = ethers.verifyMessage(message, signature);
  if (signerAddress.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }
  
  const existingWalletUser = await getUserByWalletAddress(address);
  if (existingWalletUser) {
    return res.status(400).json({ success: false, message: "This wallet address is already linked to another account" });
  }
  
  user.walletAddress = address.toLowerCase();
  if (!user.authMethods) {
    user.authMethods = [];
  }
  if (!user.authMethods.includes("metamask")) {
    user.authMethods.push("metamask");
  }
  user.updatedAt = Date.now();
  
  await saveUserToDb(user);
  
  res.status(200).json({
    success: true,
    message: "Wallet linked successfully",
    user: { id: user.id, role: user.role, walletAddress: user.walletAddress }
  });
};

const unlinkWallet = async (req: Request, res: Response) => {
  const user = req.user as User;
  
  if (!user.walletAddress) {
    return res.status(400).json({ success: false, message: "No wallet is linked to this account" });
  }
  
  user.walletAddress = undefined;
  if (user.authMethods) {
  user.authMethods = user.authMethods.filter((method: string) => method !== "metamask");
  }
  user.updatedAt = Date.now();
  
  await saveUserToDb(user);
  
  res.status(200).json({
    success: true,
    message: "Wallet unlinked successfully",
    user: { id: user.id, role: user.role }
  });
};

export { loginWithWallet, registerWithWallet, linkWallet, unlinkWallet };