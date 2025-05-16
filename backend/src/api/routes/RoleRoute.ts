import express from "express";
import { validateUserAction, validateTransaction, getUserRole } from "../controller/RoleController";

const router = express.Router();

router.get("/:userId", getUserRole);
router.post("/validate-action", validateUserAction);
router.post("/validate-transaction", validateTransaction);

export default router; 