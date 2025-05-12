import { Router } from "express"
import { Request, Response } from "express"

import catcher from "../helper/handler"
import {
  getUserList,
  getUser,
  register,
  login,
  getPrivateKey,
  linkGoogleAccount,
  googleLogin,
  updateUserProfile,
  changePassword,
  getProfileChangeHistory,
  updateUserRole,
  getCurrentUserById,
  getProfileInfo,
  getUserStatistics,
  getUserSignupTrend
} from "../controller/UserController"
import { authenticateJWT } from "../../middleware/auth"
import validate from "../middleware/validation"
import { registerSchema, loginSchema } from "../validation/userSchema"
import { authRateLimiter } from "../../middleware/rateLimiter"

const router = Router()

router.post("/register", authRateLimiter, validate(registerSchema), catcher(register))

router.post("/login", validate(loginSchema), catcher(login))

router.post("/link-google", catcher(linkGoogleAccount))

router.post("/google-login", catcher(googleLogin))

router.post("/private-key", authenticateJWT, catcher(getPrivateKey))

router.get("/", catcher(getUserList))

router.get("/profile", authenticateJWT, catcher(getProfileInfo));

router.get("/profile/history", authenticateJWT, catcher(getProfileChangeHistory));

router.get("/profile/:id", authenticateJWT, catcher(getCurrentUserById));

router.get("/:address", catcher(getUser))

router.put("/profile", authenticateJWT, catcher(updateUserProfile));

router.post("/update-role", authenticateJWT, catcher(updateUserRole));

router.post("/change-password", authenticateJWT, catcher(changePassword));

router.get("/statistics", catcher(getUserStatistics))

router.get("/trend", catcher(getUserSignupTrend));

export default router