import express, { Request, Response } from "express";
import { 
  createProduct, 
  getProduct, 
  getProductsByOwner,
  getAllProducts 
} from "../controller/ProductController";
import ProductTransferController from "../controller/ProductTransferController";
import ProductManagementController from "../controller/ProductManagementController";
import { container } from 'tsyringe';
import { productCreationRateLimiter } from "../../middleware/rateLimiter";
import { authenticateJWT } from "../../middleware/auth";
import { UserRole } from '../../enum';
import { trackProductView, trackProductTransaction } from "../../middleware/productAnalytics";

const router = express.Router();
const productManagementController = container.resolve(ProductManagementController);

// Add body parser middleware
router.use(express.json());

// Helper function to check if user is a farmer
const isFarmer = (req: Request): boolean => {
  return req.user?.role === UserRole.FARMER;
};

// Middleware to ensure only farmers can create products
const ensureFarmerAccess = (req: Request, res: Response, next: Function) => {
  if (!isFarmer(req)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only farmers can create products."
    });
  }
  next();
};

// Get all products
router.get("/", getAllProducts);
// Create a new product
router.post("/", authenticateJWT, ensureFarmerAccess, productCreationRateLimiter, createProduct);
// Get the latest status of a product
router.get("/status/:productId", productManagementController.getProductStatus);
// Get product by ID
router.get("/:productId", trackProductView, getProduct);
// Get all products owned by a specific user
router.get("/owner/:ownerId", getProductsByOwner);
// Produk akan otomatis di-receive saat transfer antar role
router.post("/transfer", authenticateJWT, trackProductTransaction, ProductTransferController.transferProduct);
// Verify product quality and update status
router.post("/verify", authenticateJWT, productManagementController.verifyProduct);
// Get verification status and consensus information for a product
router.get("/verifications/:productId", productManagementController.getProductVerifications);
// Check if consensus has been reached and update product status if needed
router.post("/check-consensus/:productId", authenticateJWT, productManagementController.checkVerificationConsensus);
// Get consensus status for a product
router.get("/consensus/:productId", productManagementController.getProductVerifications);

export default router;