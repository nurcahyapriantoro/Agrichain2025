import express, { Request, Response } from "express";
import { authenticateJWT } from "../../middleware/auth";
import ProductService from "../../core/ProductService";
import { extractPaginationParams, paginateArray } from "../../utils/paginationUtils";
import { extractProductSearchParams, filterProducts } from "../../utils/searchUtils";
import { ErrorCode, sendErrorResponse } from "../../utils/errorHandler";
import cacheManager from "../../utils/cacheManager";

const router = express.Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    // Extract search and pagination parameters
    const searchParams = extractProductSearchParams(req.query);
    const paginationParams = extractPaginationParams(req.query);

    // Generate cache key based on all query parameters
    const cacheKey = `product_search:${JSON.stringify(req.query)}`;

    // Try to get results from cache
    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }

    // Get all products (ideally we'd have a more efficient search in a real DB)
    const allProducts = await ProductService.getAllProducts();
    
    // Apply filters
    const filteredProducts = filterProducts(allProducts, searchParams);
    
    // Apply pagination
    const paginatedResult = paginateArray(filteredProducts, paginationParams);
    
    const result = {
      success: true,
      data: {
        products: paginatedResult.data,
        pagination: paginatedResult.pagination
      }
    };
    
    // Cache the result for 5 minutes
    cacheManager.set(cacheKey, result, { ttl: 5 * 60 * 1000 });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in product search:", error);
    return sendErrorResponse(
      res,
      ErrorCode.GENERAL_ERROR,
      "Error searching products",
      error instanceof Error ? error.message : undefined
    );
  }
});

router.get("/popular", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Try to get from cache
    const cacheKey = `popular_products:${limit}`;
    const cachedResult = cacheManager.get(cacheKey);
    
    if (cachedResult) {
      return res.status(200).json(cachedResult);
    }
    
    // Get popular product IDs from analytics service
    const ProductAnalyticsService = (await import("../../services/ProductAnalyticsService")).default;
    const popularProducts = await ProductAnalyticsService.getMostPopularProducts(limit);
    
    // Get full product details
    const productDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const product = await ProductService.getProduct(item.productId);
        return {
          ...product,
          popularityScore: item.popularityScore
        };
      })
    );
    
    const result = {
      success: true,
      data: {
        products: productDetails.filter(p => p !== null)
      }
    };
    
    // Cache for 15 minutes
    cacheManager.set(cacheKey, result, { ttl: 15 * 60 * 1000 });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error getting popular products:", error);
    return sendErrorResponse(
      res,
      ErrorCode.GENERAL_ERROR,
      "Error retrieving popular products",
      error instanceof Error ? error.message : undefined
    );
  }
});

router.get("/:productId/stats", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;

    // Get product to check ownership
    const product = await ProductService.getProduct(productId);
    
    if (!product) {
      return sendErrorResponse(
        res,
        ErrorCode.PRODUCT_NOT_FOUND,
        `Product with ID ${productId} not found`
      );
    }
    
    // Check if user is the owner or admin
    if (product.ownerId !== userId) {
      return sendErrorResponse(
        res,
        ErrorCode.FORBIDDEN,
        "Only the product owner can view product analytics"
      );
    }
    
    // Get analytics data
    const ProductAnalyticsService = (await import("../../services/ProductAnalyticsService")).default;
    const stats = await ProductAnalyticsService.getProductStats(productId);
    
    return res.status(200).json({
      success: true,
      data: {
        productId,
        stats
      }
    });
  } catch (error) {
    console.error("Error getting product stats:", error);
    return sendErrorResponse(
      res,
      ErrorCode.GENERAL_ERROR,
      "Error retrieving product statistics",
      error instanceof Error ? error.message : undefined
    );
  }
});

export default router; 