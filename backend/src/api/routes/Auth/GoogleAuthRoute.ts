import { Router } from "express";
import passport from "passport";
import { 
  startGoogleAuth, 
  handleGoogleCallback,
  registerWithGoogle,
  selectRole,
  linkGoogleAccount,
  findOrCreateGoogleUser
} from "../../controller/Auth/GoogleAuthController";
import session from "express-session";
import { jwtConfig } from "../../../config";
import { configurePassport } from "../../../config/passport";
import catcher from "../../helper/handler";
import { isAuthenticated } from "../../../middleware/auth";

const router = Router();

// Configure session
router.use(session({
  secret: process.env.SESSION_SECRET || jwtConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" },
}));

// Initialize passport
const passportInstance = configurePassport(findOrCreateGoogleUser);
router.use(passportInstance.initialize());
router.use(passportInstance.session());

// Google OAuth flow
router.get("/", startGoogleAuth);
router.get("/callback", passport.authenticate("google", { failureRedirect: "/login" }), handleGoogleCallback);

// Register with Google after OAuth
router.get("/select-role", catcher(selectRole));
router.post("/register", catcher(registerWithGoogle));

// Link Google account to existing account
router.post("/link", isAuthenticated, catcher(linkGoogleAccount));

export default router;