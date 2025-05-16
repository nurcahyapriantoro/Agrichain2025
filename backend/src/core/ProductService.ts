import { UserRole } from "../enum";
import OwnershipTransfer from "./OwnershipTransfer";
import RoleService from "./RoleService";
import { TransactionHistoryService } from "./TransactionHistory";
import { txhashDB } from "../helper/level.db.client";
import { ProductStatus } from "../enum";
import { ContractRegistry } from "../contracts/ContractRegistry";
import BlockchainIntegration from "./BlockchainIntegration";

// Update the interface for blockchain integration return type to include blockHeight
interface BlockchainResult {
  success: boolean;
  transactionHash?: string;
  blockHash?: string;
  blockHeight?: number;
  timestamp?: number;
}

// ID kontrak untuk pengelolaan produk
const contractId = 'product-management-v1';

interface ProductData {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  quantity?: number;
  price?: number;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  status: ProductStatus;
  ownerName?: string;
}

interface ProductTransferParams {
  productId: string;
  currentOwnerId: string;
  newOwnerId: string;
  role: UserRole;
  details?: Record<string, any>;
}

interface BlockchainData {
  blockHeight: number;
  blockHash: string;
  transactionHash: string;
  timestamp: number;
  validator: string;
}

/**
 * Service for managing products and their ownership
 */
class ProductService {
  /**
   * Get product by ID
   * @param productId ID of the product to retrieve
   * @returns Product data or null if not found
   */
  static async getProduct(productId: string): Promise<ProductData | null> {
    try {
      // Retrieve data from the database
      try {
        const data = await txhashDB.get(`product:${productId}`);
        
        // Check if data is already an object or needs parsing
        let productData;
        if (typeof data === 'string') {
          try {
            productData = JSON.parse(data);
          } catch (parseError) {
            console.error(`Error parsing product data for ID ${productId}:`, parseError);
            return null;
          }
        } else {
          // Data is already an object
          productData = data;
        }
        
        // Add owner name if available
        if (productData && productData.ownerId) {
          try {
            const ownerId = productData.ownerId;
            // Try to get user data from database
            const userData = await txhashDB.get(`user:${ownerId}`).catch(() => null);
            
            if (userData) {
              let ownerData;
              if (typeof userData === 'string') {
                try {
                  ownerData = JSON.parse(userData);
                  productData.ownerName = ownerData.name;
                } catch (e) {
                  console.warn(`Could not parse owner data for user ${ownerId}`);
                }
              } else {
                productData.ownerName = userData.name;
              }
            }
          } catch (e) {
            console.warn(`Error getting owner information: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
        
        return productData;
      } catch (err) {
        console.error("Error retrieving product from database:", err);
        // Fallback if data not found
        return null;
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  }

  /**
   * Validate and execute a product ownership transfer
   * @param params Parameters for the ownership transfer
   * @returns Result of the transfer operation
   */
  static async transferOwnership(
    params: ProductTransferParams
  ): Promise<{ success: boolean; message?: string; transactionId?: string }> {
    const { productId, currentOwnerId, newOwnerId, role, details } = params;

    // Get product data
    const productData = await this.getProduct(productId);
    
    if (!productData) {
      return {
        success: false,
        message: `Product with ID ${productId} not found.`
      };
    }
    
    // Tambahan: Verifikasi status produk sebelum transfer
    if (productData.status === ProductStatus.RECALLED) {
      return {
        success: false,
        message: "Product has been recalled and cannot be transferred."
      };
    }

    // Create an ownership transfer instance
    const ownershipTransfer = new OwnershipTransfer(
      productId,
      currentOwnerId,
      newOwnerId,
      role
    );
    
    // Set the product data for validation
    ownershipTransfer.setProductData(productData);
    
    // Execute the transfer
    const transferResult = await ownershipTransfer.executeTransfer();
    
    // If transfer is successful, record it in the transaction history
    if (transferResult.success) {
      // Get the roles of both parties
      const fromRole = await RoleService.getUserRole(currentOwnerId);
      const toRole = await RoleService.getUserRole(newOwnerId);
      
      if (fromRole && toRole) {
        // Record the transfer in transaction history
        const historyResult = await TransactionHistoryService.recordProductTransfer(
          productId,
          currentOwnerId,
          fromRole,
          newOwnerId,
          toRole,
          details
        );
        
        if (historyResult.success) {
          // Update product ownership in database
          productData.ownerId = newOwnerId;
          productData.updatedAt = Date.now();
          
          // Update product status to TRANSFERRED
          productData.status = ProductStatus.TRANSFERRED;
          
          // Save updated product data
          await txhashDB.put(`product:${productId}`, JSON.stringify(productData));
          
          // Mencoba mendaftarkan transfer ke blockchain
          let blockchainRegistered = false;
          let blockchainTransactionId = undefined;
          
          try {
            // SIMULASI: Dalam aplikasi nyata, private key harus diberikan oleh user secara aman
            const simulatedPrivateKey = "5e4d387c55f6c2b1ef1c6082057a0e6d0d44833239e6d9d921c3c2050690a482"; // EXAMPLE ONLY!
            
            // Gunakan BlockchainIntegration untuk mencatat transfer ke blockchain
            const blockchainIntegration = BlockchainIntegration.getInstance();
            const blockchainResult = await blockchainIntegration.recordProductTransfer(
              productId,
              currentOwnerId,
              newOwnerId,
              fromRole,
              toRole,
              simulatedPrivateKey,
              details || {}
            );
            
            if (blockchainResult.success) {
              blockchainRegistered = true;
              blockchainTransactionId = blockchainResult.transactionHash || undefined;
              
              console.log(`Transfer for product ${productId} recorded in blockchain with hash: ${blockchainTransactionId}`);
            }
          } catch (blockchainError) {
            console.error("Error recording transfer to blockchain:", blockchainError);
            // Continue despite blockchain registration failure
          }
          
          return {
            success: true,
            message: transferResult.message + (blockchainRegistered ? " and recorded in blockchain." : ""),
            transactionId: historyResult.transactionId
          };
        }
      }
    }
    
    return transferResult;
  }
  
  /**
   * Create a new product with the user as the initial owner and register it in blockchain
   * @param ownerId ID of the user creating the product
   * @param productData Data produk (name, description, quantity, price, metadata, status)
   * @param details Informasi tambahan yang akan direkam dalam transaksi
   * @returns Result of the product creation
   */
  static async createProduct(
    ownerId: string, 
    productData: Omit<ProductData, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>,
    details?: Record<string, any>
  ): Promise<{ 
    success: boolean; 
    productId?: string; 
    message?: string; 
    transactionId?: string; 
    blockchainRegistered?: boolean; 
    blockchainTransactionId?: string | null;
    blockchainData?: BlockchainData;
  }> {
    try {
      // Verify that the creator is a farmer
      const farmerRole = await RoleService.getUserRole(ownerId);
      
      if (farmerRole !== UserRole.FARMER) {
        return {
          success: false,
          message: "Only farmers can create new products."
        };
      }
      
      // Generate a unique product ID
      const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create the product
      const newProduct: ProductData = {
        id: productId,
        ownerId: ownerId,
        ...productData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: ProductStatus.CREATED
      };
      
      // Pastikan quantity tidak undefined
      if (newProduct.quantity === undefined) {
        if (details && details.initialQuantity) {
          newProduct.quantity = details.initialQuantity;
        } else {
          newProduct.quantity = 0; // Default fallback
        }
      }
      
      // Save the product to the database
      await txhashDB.put(`product:${productId}`, JSON.stringify(newProduct));
      
      // Record the product creation in the database through Transaction History Service
      const historyResult = await TransactionHistoryService.recordProductCreation(
        productId,
        ownerId,
        details
      );
      
      // Mencoba mendaftarkan produk ke blockchain
      let blockchainRegistered = false;
      let blockchainTransactionId = null;
      let blockchainData = historyResult.blockchainData;
      
      try {
        // Get user's private key - in a real world scenario, this should be securely provided by the user
        // SIMULASI: Dalam aplikasi nyata, private key harus diberikan oleh user secara aman
        const simulatedPrivateKey = "5e4d387c55f6c2b1ef1c6082057a0e6d0d44833239e6d9d921c3c2050690a482"; // EXAMPLE ONLY!
        
        // Gunakan BlockchainIntegration untuk mencatat ke blockchain
        const blockchainIntegration = BlockchainIntegration.getInstance();
        const blockchainResult: BlockchainResult = await blockchainIntegration.recordProductCreation(
          productId,
          ownerId,
          simulatedPrivateKey,
          {
            ...newProduct,
            // Hilangkan informasi sensitif jika ada
            metadata: {
              ...newProduct.metadata,
              sensitiveData: undefined
            }
          }
        );
        
        if (blockchainResult.success) {
          blockchainRegistered = true;
          blockchainTransactionId = blockchainResult.transactionHash || undefined;
          
          // If we have a transaction hash but no blockchain data from history service
          if (blockchainTransactionId && !blockchainData) {
            blockchainData = {
              blockHeight: blockchainResult.blockHeight || 0,
              blockHash: blockchainResult.blockHash || "",
              transactionHash: blockchainTransactionId,
              timestamp: Date.now(),
              validator: 'agrichain-node-1'
            };
          }
        }
      } catch (blockchainError) {
        console.error("Error registering product to blockchain:", blockchainError);
        // Lanjutkan meskipun gagal terdaftar di blockchain
      }
      
      return {
        success: true,
        productId,
        message: `Product created successfully with ID: ${productId}`,
        transactionId: historyResult.transactionId,
        blockchainRegistered,
        blockchainTransactionId,
        blockchainData
      };
    } catch (error) {
      console.error("Error creating product:", error);
      return {
        success: false,
        message: "Failed to create product due to an error."
      };
    }
  }
  
  /**
   * Get all products owned by a specific user
   * @param ownerId ID of the product owner
   * @returns Array of products owned by the user
   */
  static async getProductsByOwner(ownerId: string): Promise<ProductData[]> {
    try {
      // Implementasi yang lebih baik untuk mendapatkan produk berdasarkan pemilik
      const products: ProductData[] = [];
      
      // Get all product keys (excluding transaction references)
      const allKeys = await txhashDB.keys().all();
      const productKeys = allKeys.filter(key => {
        const keyStr = key.toString();
        // Match only keys with the pattern "product:{id}" (no additional colons)
        return keyStr.startsWith('product:') && keyStr.split(':').length === 2;
      });
      
      // Iterasi semua produk
      for (const key of productKeys) {
        try {
          const data = await txhashDB.get(key);
          
          // Check if data is already an object or needs parsing
          let productData;
          if (typeof data === 'string') {
            try {
              productData = JSON.parse(data);
            } catch (parseError) {
              console.error(`Error parsing product data for key ${key}:`, parseError);
              continue; // Skip this product and move to the next
            }
          } else {
            // Data is already an object
            productData = data;
          }
          
          // Now check if it matches the owner and is a valid product
          if (productData && productData.id && productData.ownerId === ownerId) {
            products.push(productData);
          }
        } catch (productError) {
          console.error(`Error retrieving product for key ${key}:`, productError);
          // Continue to the next product
        }
      }
      
      return products;
    } catch (error) {
      console.error("Error fetching products by owner:", error);
      return [];
    }
  }

  /**
   * Get all products 
   * @returns Array of all products
   */
  static async getAllProducts(): Promise<ProductData[]> {
    try {
      // Get all product keys
      const allKeys = await txhashDB.keys().all();
      
      // Filter to get only product keys (exact match for product:{id} format)
      // This excludes transaction references like product:{id}:transaction:{txid}
      const productKeys = allKeys.filter(key => {
        const keyStr = key.toString();
        // Match only keys with the pattern "product:{id}" (no additional colons)
        return keyStr.startsWith('product:') && keyStr.split(':').length === 2;
      });
      
      // Get all products with proper type checking
      const products: ProductData[] = [];
      
      for (const key of productKeys) {
        try {
          const data = await txhashDB.get(key);
          
          // Check if data is already an object or needs parsing
          let productData;
          if (typeof data === 'string') {
            try {
              productData = JSON.parse(data);
            } catch (parseError) {
              console.error(`Error parsing product data for key ${key}:`, parseError);
              continue; // Skip this product
            }
          } else {
            // Data is already an object
            productData = data;
          }
          
          // Check if it has required product fields to confirm it's a valid product
          if (productData && productData.id && productData.ownerId) {
            products.push(productData);
          }
        } catch (productError) {
          console.error(`Error retrieving product for key ${key}:`, productError);
          // Continue to the next product
        }
      }
      
      return products;
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  }
}

export default ProductService;