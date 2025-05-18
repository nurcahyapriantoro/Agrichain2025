import { Router } from "express";
import { loginWithWallet, registerWithWallet, linkWallet, unlinkWallet } from "../../controller/Auth/Web3AuthController";
import catcher from "../../helper/handler";
import { authMiddleware } from "../../middleware/authMiddleware";

const router = Router();

router.post("/login", catcher(loginWithWallet));
router.post("/register", catcher(registerWithWallet));
router.post("/link", authMiddleware, catcher(linkWallet));
router.post("/unlink", authMiddleware, catcher(unlinkWallet));

export default router;