import { Router } from "express"

import catcher from "../helper/handler"
import {
  getUserList,
  getUser,
  getPrivateKey,
  updateUserProfile,
  updateUserRole,
  getProfileInfo,
} from "../controller/UserController"
import { authenticateJWT } from "../../middleware/auth"

const router = Router()

// User private key retrieval
router.post("/private-key", authenticateJWT, catcher(getPrivateKey))

// User listing and profiles
router.get("/", catcher(getUserList))
router.get("/profile", authenticateJWT, catcher(getProfileInfo))
router.get("/profile/:id", authenticateJWT, catcher(getUser))
router.get("/:address", catcher(getUser))

// User profile updates
router.put("/profile", authenticateJWT, catcher(updateUserProfile))
router.post("/update-role", authenticateJWT, catcher(updateUserRole))


export default router