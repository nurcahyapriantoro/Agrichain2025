import { Router } from "express";
import { 
  register, 
  login, 
  sendVerificationEmail, 
  verifyEmail, 
  requestPasswordReset, 
  resetPasswordForm, 
  resetPassword,
  changePassword
} from "../../controller/Auth/FormAuthController";
import validate from "../../middleware/validation";
import { registerSchema, loginSchema } from "../../validation/userSchema";
import { authRateLimiter } from "../../../middleware/rateLimiter";
import catcher from "../../helper/handler";
import { isAuthenticated } from "../../../middleware/auth";

const router = Router();

// Basic auth routes
router.post("/register", authRateLimiter, validate(registerSchema), catcher(register));
router.post("/login", validate(loginSchema), catcher(login));

// Email verification
router.post("/send-verification-email", isAuthenticated, catcher(sendVerificationEmail));
router.get("/verify-email/:token", catcher(verifyEmail));

// Password management
router.post("/forgot-password", catcher(requestPasswordReset));
router.get("/reset-password/:token", catcher(resetPasswordForm));
router.post("/reset-password", catcher(resetPassword));
router.post("/change-password", isAuthenticated, catcher(changePassword));

export default router;