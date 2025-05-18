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
} from "../controller/UserController"
import { authenticateJWT } from "../../middleware/auth"
import { uploadImage, handleUploadErrors } from "../../middleware/uploadLimiter"

const router = Router()

// User keypair management endpoints
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

export default router