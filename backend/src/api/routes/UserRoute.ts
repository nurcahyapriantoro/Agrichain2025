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
} from "../controller/UserController"
import { authenticateJWT } from "../../middleware/auth"

const router = Router()

// User keypair management endpoints
router.post("/private-key", authenticateJWT, catcher(getPrivateKey))
router.get("/public-key", authenticateJWT, catcher(getPublicKey))
router.get("/check-keypair", authenticateJWT, catcher(checkKeyPair))
router.post("/regenerate-keypair", authenticateJWT, catcher(regenerateKeyPair))
router.get("/public-key/:id", authenticateJWT, catcher(getPublicKeyById))

// User listing and profiles
router.get("/", catcher(getUserList))
router.get("/profile", authenticateJWT, catcher(getProfileInfo))
router.get("/profile/:id", authenticateJWT, catcher(getUser))
router.get("/:address", catcher(getUser))

// User profile updates
router.put("/profile", authenticateJWT, catcher(updateUserProfile))
router.post("/update-role", authenticateJWT, catcher(updateUserRole))


export default router