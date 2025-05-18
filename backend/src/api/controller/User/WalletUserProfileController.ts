import { Request, Response } from "express";
import { User, saveUserToDb, getUserById } from "../../../utils/userUtils";
import { hashPassword } from "../../../utils/passwordUtils";

/**
 * Update wallet user's profile with email and password
 * This is used after a wallet user has registered and wants to add email and password
 */
const updateWalletUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { email, password } = req.body;
    
    // Validate request
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password is required and must be at least 6 characters long" 
      });
    }
    
    // Get current user data
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Ensure user is a wallet user
    if (!user.walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: "This operation is only available for wallet users" 
      });
    }
    
    // Check if the email is already in the default format from wallet registration
    const walletEmailPattern = /.+@wallet\.agrichain\.local$/;
    if (!walletEmailPattern.test(user.email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Email has already been updated" 
      });
    }
      // Update user data
    const hashedPassword = await hashPassword(password);
    user.email = email;
    user.password = hashedPassword;
    user.isEmailVerified = false; // Set to false until email is verified
    user.updatedAt = Date.now();
    
    // Add email to authMethods if not already there
    if (!user.authMethods) {
      user.authMethods = ["metamask", "email"];
    } else if (!user.authMethods.includes("email")) {
      user.authMethods.push("email");
    }
    
    // Save updated user to database
    await saveUserToDb(user);
      return res.status(200).json({
      success: true,
      message: "Profile updated successfully. You can now log in with your email and password.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error("Error updating wallet user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};

export { updateWalletUserProfile };
