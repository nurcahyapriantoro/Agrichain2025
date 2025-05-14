import { Router } from "express";
import { loginWithWallet, registerWithWallet } from "../../controller/Auth/Web3AuthController";
import catcher from "../../helper/handler";

const router = Router();

router.post("/login", catcher(loginWithWallet));
router.post("/register", catcher(registerWithWallet));

export default router;