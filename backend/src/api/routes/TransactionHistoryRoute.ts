import express from "express";
import { 
  getProductTransactionHistory,
  getUserTransactionHistory,
  getTransactionHistoryByPublicKey,
  getLatestTransactions,
  getTransactionDetails,
  getTransactionStats
} from "../controller/TransactionHistoryController";

const router = express.Router();

// GET latest transactions (for ALL TRANSACTION tab)
router.get("/latest", getLatestTransactions);

// GET transaction history for a specific product
router.get("/product/:productId", getProductTransactionHistory);

// GET transaction history for a specific user
router.get("/user/:userId", getUserTransactionHistory);

// GET transaction history by public key
router.get("/public-key/:publicKey", getTransactionHistoryByPublicKey);

// GET details for a specific transaction
router.get("/transaction/:transactionId", getTransactionDetails);

// GET statistics about transactions (for debugging)
router.get("/stats", getTransactionStats);

export default router;