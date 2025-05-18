import { Router } from "express";
import { updateWalletUserProfile } from "../../controller/User/WalletUserProfileController";
import catcher from "../../helper/handler";
import { authenticateJWT } from "../../../middleware/auth";

const router = Router();

// This route requires authentication
router.post("/update-profile", authenticateJWT, catcher(updateWalletUserProfile));

export default router;
