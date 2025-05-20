import { Router } from "express"

import catcher from "../helper/handler"
import {
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
  getUsersByRoleCollector,
  getUsersByRoleTrader,
  getUsersByRoleRetailer,
} from "../controller/UserController"
import { authenticateJWT } from "../../middleware/auth"
import { uploadImage, handleUploadErrors } from "../../middleware/uploadLimiter"
import { authMiddleware } from "../middleware/authMiddleware"

const router = Router()

// User keypair management endpoints
router.get("/", authenticateJWT, catcher(getUserList))
router.post("/private-key", authenticateJWT, catcher(getPrivateKey))
router.get("/public-key", authenticateJWT, catcher(getPublicKey))
router.get("/public-key/:id", authenticateJWT, catcher(getPublicKeyById))
router.post("/check-keypair", authenticateJWT, catcher(checkKeyPair))
router.post("/regenerate-keypair", authenticateJWT, catcher(regenerateKeyPair))

// User profile updates
router.put("/profile", authenticateJWT, catcher(updateUserProfile))
router.post("/profile-picture", authenticateJWT, uploadImage.single('profilePicture'), handleUploadErrors, catcher(uploadProfilePicture))
router.put("/role", authenticateJWT, catcher(updateUserRole))

// User profile retrieval
router.get("/profile", authenticateJWT, catcher(getProfileInfo))
router.get("/list", authenticateJWT, catcher(getUserList))
router.get("/:id", authenticateJWT, catcher(getUser))

router.get('/by-role/COLLECTOR', authenticateJWT, getUsersByRoleCollector);
router.get('/by-role/TRADER', authenticateJWT, getUsersByRoleTrader);
router.get('/by-role/RETAILER', authenticateJWT, getUsersByRoleRetailer);
export default router