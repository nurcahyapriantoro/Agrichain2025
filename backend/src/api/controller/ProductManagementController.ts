import type { Request, Response } from "express";
import { ProductStatus, RecallReason, UserRole, TransactionActionType } from "../../enum";
import { ContractRegistry } from "../../contracts/ContractRegistry";
import { container, injectable } from 'tsyringe';
import ProductManagement, { PRODUCT_ID, USER_ID } from '../../core/ProductManagement';
import RoleService from '../../core/RoleService';
import ProductService from '../../core/ProductService';
import { txhashDB } from "../../helper/level.db.client";
import { formatVerificationResponse } from '../../utils/ResponseFormatter';
import BlockchainIntegration from "../../core/BlockchainIntegration";

// ID kontrak untuk pengelolaan produk
const contractId = 'product-management-v1';

@injectable()
export default class ProductManagementController {
  constructor() {
    // Tidak perlu lagi menyimpan instance roleService
  }

  /**
   * Menentukan status produk otomatis berdasarkan aksi dan peran pengguna
   * @param action Aksi yang dilakukan pada produk
   * @param currentStatus Status produk saat ini
   * @param userRole Peran pengguna yang melakukan aksi
   * @param targetRole Peran pengguna tujuan (opsional, untuk transfer)
   * @returns Status baru yang sesuai
   */
  private determineAutomaticStatus(
    action: TransactionActionType,
    currentStatus: ProductStatus,
    userRole: UserRole,
    targetRole?: UserRole
  ): ProductStatus {
    // Transisi status berdasarkan aksi dan peran
    switch (action) {
      case TransactionActionType.CREATE:
        return ProductStatus.CREATED;
      
      case TransactionActionType.TRANSFER:
        // Status berbeda tergantung peran pengirim dan penerima
        if (userRole === UserRole.FARMER && targetRole === UserRole.COLLECTOR) {
          return ProductStatus.TRANSFERRED;
        } else if (userRole === UserRole.COLLECTOR && targetRole === UserRole.TRADER) {
          return ProductStatus.TRANSFERRED;
        } else if (userRole === UserRole.TRADER && targetRole === UserRole.RETAILER) {
          return ProductStatus.TRANSFERRED;
        }
        return ProductStatus.TRANSFERRED;
      
      case TransactionActionType.RECEIVE:
        return ProductStatus.RECEIVED;
      
      case TransactionActionType.SELL:
        return ProductStatus.SOLD;
      
      case TransactionActionType.VERIFY:
        return ProductStatus.VERIFIED;
  
      default:
        // Jika tidak ada pemetaan khusus, pertahankan status saat ini
        return currentStatus;
    }
  }

  /**
   * Proses transaksi produk dan mengupdate status secara otomatis
   * @param req Request HTTP
   * @param res Response HTTP
   * @param action Jenis aksi pada produk
   */
  processProductTransaction = async (req: Request, res: Response, action: TransactionActionType) => {
    try {
      console.log(`Processing ${action} transaction with body:`, JSON.stringify(req.body));
      const { productId, targetUserId, details } = req.body;
      const userId = req.user?.id;

      if (!productId || !userId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters: productId and user authentication"
        });
      }

      // Dapatkan produk saat ini
      const registry = ContractRegistry.getInstance();
      const productResult = await registry.queryContract(
        contractId,
        'getProduct',
        { productId }
      );

      if (!productResult.success || !productResult.product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      const product = productResult.product;

      // Dapatkan peran pengguna saat ini - use RoleService directly
      let userRole: UserRole;
      try {
        const role = await RoleService.getUserRole(userId);
        if (!role) {
          return res.status(401).json({
            success: false,
            message: "User role not found"
          });
        }
        userRole = role;
      } catch (error) {
        console.error("Error getting user role:", error);
        return res.status(401).json({
          success: false,
          message: "Unable to determine user role"
        });
      }

      // Jika ada targetUserId, dapatkan perannya - use RoleService directly
      let targetRole: UserRole | undefined;
      if (targetUserId) {
        try {
          const role = await RoleService.getUserRole(targetUserId);
          if (role) {
            targetRole = role;
          }
        } catch (error) {
          console.warn(`Could not determine role for target user ${targetUserId}`, error);
        }
      }

      // Log roles for debugging
      console.log(`User roles - Current: ${userRole}, Target: ${targetRole}`);

      // Tentukan status baru berdasarkan aksi dan peran
      const newStatus = this.determineAutomaticStatus(
        action, 
        product.status,
        userRole,
        targetRole
      );

      // Validasi peran pengguna dengan status yang akan diupdate
      const isAllowed = this.isStatusUpdateAllowed(userRole, newStatus);
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `User with role ${userRole} is not authorized to set product status to ${newStatus}`
        });
      }
      // Sebagai contoh, untuk proses transfer:
      if (action === TransactionActionType.TRANSFER && targetUserId) {
        // Lakukan logika transfer produk ke pengguna lain
        // ...
      }

      // Lalu update status produk secara otomatis
      const result = await registry.executeContract(
        contractId,
        'updateProductStatus',
        { productId, newStatus, details },
        userId
      );

      if (result.success) {
        // Update local database status to match blockchain status
        const localProduct = await ProductService.getProduct(productId);
        if (localProduct) {
          localProduct.status = newStatus;
          localProduct.updatedAt = Date.now();
          await txhashDB.put(`product:${productId}`, JSON.stringify(localProduct));
        }
        
        return res.status(200).json({
          success: true,
          message: `Product ${action} successful and status updated to ${newStatus}`,
          data: {
            ...result,
            newStatus
          }
        });
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error(`Error in processProductTransaction (${action}):`, error);
      return res.status(500).json({
        success: false,
        message: `Error processing product transaction: ${(error as Error).message}`
      });
    }
  }

  /**
   * Check if user role is allowed to update product to the specified status
   * @param userRole User role
   * @param newStatus New product status
   * @returns Whether the update is allowed
   */
  private isStatusUpdateAllowed(userRole: UserRole, newStatus: ProductStatus): boolean {
    // Mapping peran pengguna dengan status produk yang diizinkan
    const allowedStatusUpdates: Record<UserRole, ProductStatus[]> = {
      [UserRole.FARMER]: [
        ProductStatus.CREATED,
        ProductStatus.TRANSFERRED
      ],
      [UserRole.COLLECTOR]: [
        ProductStatus.RECEIVED,
        ProductStatus.TRANSFERRED,
      ],
      [UserRole.TRADER]: [
        ProductStatus.RECEIVED,
        ProductStatus.TRANSFERRED,
      ],
      [UserRole.RETAILER]: [
        ProductStatus.RECEIVED,
        ProductStatus.SOLD,
      ],
      [UserRole.CONSUMER]: [
        // Konsumen biasanya tidak memperbarui status produk
      ],
      [UserRole.UNKNOWN]: [
        // Pengguna dengan role UNKNOWN tidak dapat memperbarui status produk
      ]
    };

    // Jika peran pengguna tidak ditemukan dalam pemetaan, kembalikan false
    if (!allowedStatusUpdates[userRole]) {
      return false;
    }

    // Periksa apakah status produk baru diizinkan untuk peran pengguna ini
    return allowedStatusUpdates[userRole].includes(newStatus);
  }

  /**
   * Transfer product from one user to another
   * This function will automatically update product status based on roles
   */
  transferProduct = async (req: Request, res: Response) => {
    return this.processProductTransaction(req, res, TransactionActionType.TRANSFER);
  }

  /**
   * Process product receipt
   * This function will automatically update status to RECEIVED
   */
  receiveProduct = async (req: Request, res: Response) => {
    return this.processProductTransaction(req, res, TransactionActionType.RECEIVE);
  }

  /**
   * Package product for shipping
   * This function will automatically update status to PACKAGED
   */
  packageProduct = async (req: Request, res: Response) => {
    return this.processProductTransaction(req, res, TransactionActionType.PACKAGE);
  }

  /**
   * Ship product to destination
   * This function will automatically update status to SHIPPED
   */
  shipProduct = async (req: Request, res: Response) => {
    return this.processProductTransaction(req, res, TransactionActionType.SHIP);
  }

  /**
   * Sell product to customer
   * This function will automatically update status to SOLD
   * Only retailers can sell products to consumers
   */
  sellProduct = async (req: Request, res: Response) => {
    try {
      console.log("Starting sellProduct with request body:", JSON.stringify(req.body));
      
      // Extract productId from request (handle both body and params)
      const productIdFromBody = req.body.productId;
      const productIdFromParams = req.params.productId;
      const productId = productIdFromBody || productIdFromParams;
      
      // Extract targetUserId (the consumer who is buying the product)
      const { targetUserId, details } = req.body;
      
      // Check if product ID was provided
      if (!productId) {
        console.error("Missing productId in request");
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: productId"
        });
      }
      
      // Check if targetUserId was provided
      if (!targetUserId) {
        console.error("Missing targetUserId in request");
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: targetUserId (the consumer who is buying the product)"
        });
      }
      
      console.log("Processing sell request for product ID:", productId);
      
      // Get user ID (from JWT token) - the seller
      const userId = req.user?.id;
      if (!userId) {
        console.error("User ID not found in request. Authentication failed.");
        return res.status(401).json({
          success: false,
          message: "User authentication required for selling a product"
        });
      }
      
      console.log("User ID for sell operation:", userId);
      console.log("User role:", await RoleService.getUserRole(userId));
      console.log("Target user role:", await RoleService.getUserRole(targetUserId));
      
      // Verify the seller has the RETAILER role
      let userRole: UserRole;
      try {
        const role = await RoleService.getUserRole(userId);
        if (!role) {
          console.error("Role not found for user ID:", userId);
          return res.status(401).json({
            success: false,
            message: "User role not found"
          });
        }
        userRole = role;
        console.log("User role:", userRole);
        
        // Verify user is a retailer
        if (userRole !== UserRole.RETAILER) {
          console.error("User does not have retailer role. Has role:", userRole);
          return res.status(403).json({
            success: false, 
            message: "Only retailers can sell products to consumers"
          });
        }
      } catch (error) {
        console.error("Error determining user role:", error);
        return res.status(500).json({
          success: false,
          message: "Unable to determine user role"
        });
      }
      
      // Verify the buyer has the CONSUMER role
      try {
        const targetRole = await RoleService.getUserRole(targetUserId);
        if (!targetRole) {
          console.error("Role not found for target user ID:", targetUserId);
          return res.status(400).json({
            success: false,
            message: "Target user role not found"
          });
        }
        
        console.log("Target user role:", targetRole);
        
        // Verify target user is a consumer
        if (targetRole !== UserRole.CONSUMER) {
          console.error("Target user does not have consumer role. Has role:", targetRole);
          return res.status(403).json({
            success: false, 
            message: "Products can only be sold to users with CONSUMER role"
          });
        }
      } catch (error) {
        console.error("Error determining target user role:", error);
        return res.status(500).json({
          success: false,
          message: "Unable to determine target user role"
        });
      }
      
      // Try to get product directly from ProductService first to verify format
      const directProductCheck = await ProductService.getProduct(productId);
      console.log("Direct product check result:", directProductCheck ? "Found" : "Not found");
      
      // Check that product exists before trying to sell it
      const registry = ContractRegistry.getInstance();
      let productCheckResult = await registry.queryContract(
        contractId,
        'getProduct',
        { productId }
      );
      
      console.log("Product check result:", JSON.stringify(productCheckResult));
      
      // If product exists in database but not in blockchain, register it in blockchain
      if (directProductCheck && (!productCheckResult.success || !productCheckResult.product)) {
        console.log("Product found in database but not in blockchain. Attempting to register in blockchain...");
        
        // Register the product in blockchain using executeContract
        const registerResult = await registry.executeContract(
          contractId,
          'createProduct',
          { 
            farmerId: directProductCheck.ownerId,
            name: directProductCheck.name,
            productName: directProductCheck.name, // Using name as productName if not available
            description: directProductCheck.description || '',
            initialQuantity: directProductCheck.quantity || 0,
            unit: directProductCheck.metadata?.unit || 'unit',
            price: directProductCheck.price || 0,
            productionDate: directProductCheck.metadata?.productionDate || new Date().toISOString(),
            expiryDate: directProductCheck.metadata?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            location: directProductCheck.metadata?.location || 'Unknown',
            metadata: directProductCheck.metadata || {}
          },
          directProductCheck.ownerId
        );
        
        console.log("Registration result:", JSON.stringify(registerResult));
        
        // Check registration result and fetch product again
        if (registerResult.success) {
          productCheckResult = await registry.queryContract(
            contractId,
            'getProduct',
            { productId }
          );
          console.log("Product check after registration:", JSON.stringify(productCheckResult));
        }
      }
      
      if (!productCheckResult.success || !productCheckResult.product) {
        console.error("Product not found:", productId);
        
        // Provide a more detailed error to help debug
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found. Please verify the product ID.`,
          details: {
            productIdProvided: productId,
            source: productIdFromBody ? "request body" : "request params"
          }
        });
      }
      
      const product = productCheckResult.product;
      console.log("Found product:", product.name, "with current status:", product.status);
      
      // Check that the product belongs to the seller
      if (product.ownerId !== userId) {
        console.error("Product not owned by seller. Owner:", product.ownerId, "Seller:", userId);
        return res.status(403).json({
          success: false,
          message: "You can only sell products that you own"
        });
      }
      
      // Verify the product is not reconstructed or has integrity issues
      if (product.metadata && (
          product._integrityFixed || 
          product.metadata._integrityFixed || 
          product.name === "Rekonstruksi Produk" || 
          product.productName === "Produk Direkonstruksi" ||
          (product.description && product.description.includes("direkonstruksi"))
        )) {
        console.error("Attempted to sell a reconstructed product:", productId);
        return res.status(403).json({
          success: false,
          message: "Cannot sell reconstructed products. Only original products can be sold to consumers."
        });
      }
      
      // All checks passed, continue with the sale
      // Add the targetUserId to the request body if not already there
      req.body.targetUserId = targetUserId;
      
      // Continue with normal flow by delegating to processProductTransaction
      return this.processProductTransaction(req, res, TransactionActionType.SELL);
    } catch (error) {
      console.error("Error in sellProduct:", error);
      return res.status(500).json({
        success: false,
        message: `Error selling product: ${(error as Error).message}`
      });
    }
  }

  /**
   * Recall a product
   */
  recallProduct = async (req: Request, res: Response) => {
    try {
      const { productId, reason, details } = req.body;
      const userId = req.user?.id;

      if (!productId || !reason) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameters: productId and reason are required"
        });
      }

      // Check if userId exists
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required"
        });
      }

      // Validate that the reason is a valid RecallReason
      if (!Object.values(RecallReason).includes(reason as RecallReason)) {
        return res.status(400).json({
          success: false,
          message: "Invalid recall reason specified"
        });
      }

      // Register runtime values for ProductManagement
      container.register(PRODUCT_ID, { useValue: productId });
      container.register(USER_ID, { useValue: userId });
      const productManagement = container.resolve(ProductManagement);

      // Panggil smart contract melalui ContractRegistry
      const registry = ContractRegistry.getInstance();
      const result = await registry.executeContract(
        contractId,
        'recallProduct',
        { productId, reason, details },
        userId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in recallProduct:", error);
      return res.status(500).json({
        success: false,
        message: `Error recalling product: ${(error as Error).message}`
      });
    }
  };

  /**
   * Verify product quality
   */
  verifyProduct = async (req: Request, res: Response) => {
    try {
      const { productId, qualityChecks, requiredAttributes, minimumStandards, details, qualityScore } = req.body;
      const userId = req.user?.id;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: productId is required"
        });
      }

      // Check if userId exists
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User authentication required"
        });
      }
      
      console.log(`Processing product verification for product ID: ${productId} by user: ${userId}`);
      
      // Dapatkan peran pengguna saat ini
      let userRole: UserRole;
      try {
        const role = await RoleService.getUserRole(userId);
        if (!role) {
          return res.status(401).json({
            success: false,
            message: "User role not found"
          });
        }
        userRole = role;
        console.log(`User role for verification: ${userRole}`);
      } catch (error) {
        console.error("Error getting user role:", error);
        return res.status(401).json({
          success: false,
          message: "Unable to determine user role"
        });
      }
      
      // Dapatkan produk saat ini untuk update
      const currentProduct = await ProductService.getProduct(productId);
      
      // Log untuk debugging
      console.log(`Product from local database: ${currentProduct ? "Found" : "Not found"}`);
      
      if (!currentProduct) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${productId} not found in database`
        });
      }
      
      // Periksa apakah pengguna sudah memverifikasi produk ini sebelumnya
      if (currentProduct.metadata?.qualityScoreHistory) {
        const userVerifications = currentProduct.metadata.qualityScoreHistory.filter(
          (entry: any) => entry.userId === userId
        );
        
        if (userVerifications.length > 0) {
          return res.status(403).json({
            success: false,
            message: `USER_ALREADY_VERIFIED: Anda sudah memverifikasi produk ini sebelumnya. Setiap pengguna hanya dapat memverifikasi sekali.`,
            details: {
              previousVerifications: userVerifications
            }
          });
        }
        
        // Periksa juga apakah peran yang sama sudah memverifikasi produk
        const roleVerifications = currentProduct.metadata.qualityScoreHistory.filter(
          (entry: any) => entry.role === userRole
        );
        
        if (roleVerifications.length > 0) {
          return res.status(403).json({
            success: false,
            message: `ROLE_ALREADY_VERIFIED: Peran ${userRole} sudah memverifikasi produk ini sebelumnya. Setiap peran hanya dapat memverifikasi sekali.`,
            details: {
              previousVerifications: roleVerifications
            }
          });
        }
      }
      
      // Petani tidak boleh memverifikasi produk mereka sendiri
      if (userRole === UserRole.FARMER) {
        // Cek apakah petani adalah pembuat produk ini
        if (currentProduct.ownerId === userId) {
          return res.status(403).json({
            success: false,
            message: "FARMERS_CANNOT_VERIFY_OWN: Petani tidak dapat memverifikasi produk miliknya sendiri. Skor kualitas sudah ditetapkan saat pembuatan produk."
          });
        }
        
        // Cek juga apakah petani dari kelompok atau area yang sama (jika informasi tersedia)
        if (currentProduct.metadata?.farmerGroup && 
            userId.startsWith('FARM-') && 
            currentProduct.metadata.farmerGroup === userId.substring(5, 10)) {
          return res.status(403).json({
            success: false,
            message: "FARMERS_CANNOT_VERIFY_SAME_GROUP: Petani tidak dapat memverifikasi produk dari kelompok petani yang sama. Verifikasi harus dilakukan oleh peran berbeda dalam rantai pasok."
          });
        }
      }
      
      // Validasi qualityScore jika ada
      let validQualityScore: number | undefined = undefined;
      if (qualityScore !== undefined) {
        validQualityScore = parseFloat(qualityScore);
        if (isNaN(validQualityScore) || validQualityScore < 0 || validQualityScore > 100) {
          return res.status(400).json({
            success: false,
            message: "qualityScore harus berupa angka antara 0 dan 100"
          });
        }
      }
      
      // Gunakan nilai dari minimumStandards jika tidak ada qualityScore
      if (validQualityScore === undefined && minimumStandards?.qualityScore !== undefined) {
        validQualityScore = parseFloat(minimumStandards.qualityScore);
        if (isNaN(validQualityScore) || validQualityScore < 0 || validQualityScore > 100) {
          return res.status(400).json({
            success: false,
            message: "qualityScore in minimumStandards must be a number between 0 and 100"
          });
        }
      }
      
      // Pastikan ada qualityScore yang valid untuk verifikasi
      if (validQualityScore === undefined) {
        return res.status(400).json({
          success: false,
          message: "qualityScore is required for product verification"
        });
      }
      
      // Setelah semua validasi, kita coba masukkan verifikasi ke blockchain
      // Get BlockchainIntegration instance from res.locals or create a new one
      const blockchainIntegration = res.locals.blockchainIntegration || BlockchainIntegration.getInstance();
      
      // SIMULASI: Dalam aplikasi nyata, private key harus diberikan oleh user secara aman
      const simulatedPrivateKey = "5e4d387c55f6c2b1ef1c6082057a0e6d0d44833239e6d9d921c3c2050690a482"; // EXAMPLE ONLY!
      
      // Buat details untuk verifikasi
      const verificationDetails = {
        qualityScore: validQualityScore,
        checks: qualityChecks || {},
        requiredAttributes: requiredAttributes || {},
        minimumStandards: minimumStandards || {},
        additionalDetails: details || {},
        timestamp: Date.now()
      };
      
      // Verifikasi dianggap berhasil jika score >= 60
      const verificationPassed = validQualityScore >= 60;
      
      // Catat verifikasi ke blockchain
      let blockchainRegistered = false;
      let blockchainTransactionId = undefined;
      
      try {
        console.log(`Attempting to record product verification to blockchain for product ${productId}`);
        const blockchainResult = await blockchainIntegration.recordProductVerification(
          productId,
          userId,
          userRole,
          simulatedPrivateKey,
          verificationPassed,
          verificationDetails
        );
        
        if (blockchainResult.success) {
          blockchainRegistered = true;
          blockchainTransactionId = blockchainResult.transactionHash;
          console.log(`Product verification recorded in blockchain with hash: ${blockchainTransactionId}`);
        } else {
          console.warn(`Product verification not recorded in blockchain. Will use fallback method.`);
        }
      } catch (blockchainError) {
        console.error("Error recording verification to blockchain:", blockchainError);
        // Continue with traditional verification process
      }
      
      // Check if product exists in blockchain
      const registry = ContractRegistry.getInstance();
      const blockchainProductResult = await registry.queryContract(
        contractId,
        'getProduct',
        { productId }
      );
      
      console.log(`Product from blockchain: ${blockchainProductResult.success ? "Found" : "Not found"}`);
      
      // If product doesn't exist in blockchain but exists in database, register it
      if (!blockchainProductResult.success || !blockchainProductResult.product) {
        console.log("Product exists in database but not in blockchain. Attempting to register in blockchain...");
        
        // Check if product owner is a farmer to avoid role validation issues
        const ownerRole = await RoleService.getUserRole(currentProduct.ownerId);
        console.log(`Using direct RoleService instead of contract for user ${currentProduct.ownerId}, role: ${ownerRole}`);
        
        // Choose the appropriate approach based on owner role
        let registerResult;
        
        if (ownerRole === UserRole.FARMER) {
          // If the owner is a farmer, register directly using the owner as sender
          registerResult = await registry.executeContract(
            contractId,
            'createProduct',
            { 
              productId: productId, // Gunakan productId yang sudah ada
              farmerId: currentProduct.ownerId,
              name: currentProduct.name,
              productName: currentProduct.metadata?.productName || currentProduct.name,
              description: currentProduct.description || '',
              initialQuantity: currentProduct.quantity || 0,
              unit: currentProduct.metadata?.unit || 'unit',
              price: currentProduct.price || 0,
              productionDate: currentProduct.metadata?.productionDate || new Date().toISOString(),
              expiryDate: currentProduct.metadata?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              location: currentProduct.metadata?.location || 'Unknown',
              metadata: currentProduct.metadata || {}
            },
            currentProduct.ownerId
          );
        } else {
          // If the owner is not a farmer, find a farmer for registration or use ProductSynchronizationService
          try {
            // Get list of farmers from system (you might need to implement this)
            const farmers = await this.getFarmersForRegistration();
            if (farmers && farmers.length > 0) {
              // Use the first available farmer to register the product
              const farmerUserId = farmers[0];
              console.log(`Using farmer ${farmerUserId} to register product in blockchain`);
              
              registerResult = await registry.executeContract(
                contractId,
                'createProduct',
                { 
                  productId: productId, // Gunakan productId yang sudah ada
                  productName: currentProduct.metadata?.productName || currentProduct.name,
                  description: currentProduct.description || '',
                  initialQuantity: currentProduct.quantity || 0,
                  unit: currentProduct.metadata?.unit || 'unit',
                  price: currentProduct.price || 0,
                  productionDate: currentProduct.metadata?.productionDate || new Date().toISOString(),
                  expiryDate: currentProduct.metadata?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                  location: currentProduct.metadata?.location || 'Unknown',
                  metadata: {
                    ...currentProduct.metadata || {},
                    originalOwnerId: currentProduct.ownerId,  // Store original owner ID
                    registeredOnBehalfOf: true
                  }
                },
                farmerUserId
              );
              
              // If registration successful, use OwnershipTransfer to transfer it back to original owner
              if (registerResult.success) {
                console.log(`Product registered with farmer ${farmerUserId} - transferring back to original owner ${currentProduct.ownerId}`);
                // Transfer ownership to the original owner right after creation
                await registry.executeContract(
                  'ownership-transfer-v1',
                  'transferOwnership',
                  {
                    productId,
                    fromUserId: farmerUserId,
                    toUserId: currentProduct.ownerId,
                    details: {
                      reason: "Registration on behalf of non-farmer owner",
                      automaticTransfer: true
                    }
                  },
                  farmerUserId
                );
              }
            } else {
              console.log("No farmers found for registration, using ProductSynchronizationService");
              // Queue for synchronization later via ProductSynchronizationService
              registerResult = { 
                success: false, 
                message: "No farmers available for product registration. Product will be synchronized later." 
              };
            }
          } catch (error) {
            console.error("Error finding farmers for registration:", error);
            registerResult = { 
              success: false, 
              message: "Failed to find farmers for registration: " + (error as Error).message 
            };
          }
        }
        
        console.log("Product registration result:", JSON.stringify(registerResult));
      }
      
      // Dapatkan verifikasi yang ada untuk produk ini
      const verificationsResult = await registry.queryContract(
        contractId,
        'getProductVerifications',
        { productId }
      );
      
      // Definisikan interface untuk objek verifikasi
      interface ProductVerification {
        verifierId: string;
        verifierRole: UserRole;
        timestamp: number;
        details?: any;
        result: boolean;
      }
      
      // Cek apakah pengguna ini sudah memverifikasi produk sebelumnya
      const existingVerifications = verificationsResult.product?.verifications || [] as ProductVerification[];
      const userVerification = existingVerifications.find((v: ProductVerification) => v.verifierId === userId);
      
      if (userVerification) {
        return res.status(400).json({
          success: false,
          message: `User with ID ${userId} has already verified this product. Each role can only verify once.`
        });
      }
      
      // Cek apakah ada role yang sama yang sudah melakukan verifikasi
      const sameRoleVerification = existingVerifications.find((v: ProductVerification) => {
        // Dapatkan role dari verifier
        const verifierRole = v.verifierRole;
        return verifierRole === userRole;
      });
      
      if (sameRoleVerification) {
        return res.status(400).json({
          success: false,
          message: `User with role ${userRole} has already verified this product. Each role can only verify once.`
        });
      }
      
      // Hitung rata-rata qualityScore
      let newQualityScore = validQualityScore;
      
      // Jika sudah ada qualityScore sebelumnya, hitung rata-rata
      if (currentProduct.metadata?.qualityScore !== undefined) {
        const currentScore = parseFloat(currentProduct.metadata.qualityScore);
        if (!isNaN(currentScore)) {
          // Untuk verifikasi selanjutnya, hitung rata-rata terlepas dari jumlah peran yang sudah memverifikasi
          // Pendekatan ini menghitung rata-rata dari semua skor yang ada, termasuk verifikasi awal
          
          // Jika belum ada verifikasi di blockchain tetapi ada score awal (dari farmer saat membuat produk)
          // maka hitung skor awal sebagai 1 verifikasi
          const hasInitialScore = currentProduct.metadata?.qualityScore !== undefined;
          const initialVerificationCount = hasInitialScore ? 1 : 0;
          
          // Total verifikasi adalah jumlah verifikasi existing + verifikasi awal (jika ada)
          const totalPreviousVerifications = existingVerifications.length + initialVerificationCount;
          
          // Hitung rata-rata: (current_score * total_previous_verifications + new_score) / (total_previous_verifications + 1)
          newQualityScore = (currentScore * totalPreviousVerifications + validQualityScore) / (totalPreviousVerifications + 1);
          // Bulatkan menjadi 2 angka desimal
          newQualityScore = Math.round(newQualityScore * 100) / 100;
          
          console.log(`Calculating average: (${currentScore} * ${totalPreviousVerifications} + ${validQualityScore}) / (${totalPreviousVerifications + 1}) = ${newQualityScore}`);
        }
      }
      
      console.log(`Quality score calculation: Current=${currentProduct.metadata?.qualityScore}, New Input=${validQualityScore}, Calculated Average=${newQualityScore}`);
      
      // Update qualityScore di database lokal
      if (currentProduct.metadata) {
        currentProduct.metadata.qualityScore = newQualityScore;
        // Tambahkan array verifikasi skor untuk melacak semua skor dari berbagai peran
        if (!currentProduct.metadata.qualityScoreHistory) {
          currentProduct.metadata.qualityScoreHistory = [];
        }
        // Tambahkan verifikasi baru ke riwayat
        currentProduct.metadata.qualityScoreHistory.push({
          score: validQualityScore,
          role: userRole,
          userId: userId,
          timestamp: Date.now()
        });
      } else {
        currentProduct.metadata = { 
          qualityScore: newQualityScore,
          qualityScoreHistory: [{
            score: validQualityScore, 
            role: userRole,
            userId: userId,
            timestamp: Date.now()
          }]
        };
      }
      
      // Simpan perubahan ke database
      await txhashDB.put(`product:${productId}`, JSON.stringify(currentProduct));

      // Membuat kriteria verifikasi
      const criteria: any = {
        qualityChecks: qualityChecks || [],
        requiredAttributes: requiredAttributes || [],
        minimumStandards: minimumStandards || {}
      };

      // Tambahkan qualityScore baru ke minimumStandards
      criteria.minimumStandards.qualityScore = newQualityScore;
      
      // Update details dengan qualityScore baru
      const updatedDetails = {
        ...(details || {}),
        qualityScore: newQualityScore,
        verifierRole: userRole // Tambahkan role verifier untuk memudahkan pengecekan
      };

      // Try fallback to ProductManagement if direct contract execution fails
      try {
        // Panggil smart contract melalui ContractRegistry
        console.log("Executing verifyProduct contract with params:", { 
          productId, 
          criteria: JSON.stringify(criteria),
          details: JSON.stringify(updatedDetails)
        });
        
        const result = await registry.executeContract(
          contractId,
          'verifyProduct',
          { 
            productId, 
            criteria,
            details: updatedDetails
          },
          userId
        );

        console.log("Contract execution result:", JSON.stringify(result));

        // Ambil status konsensus untuk ditampilkan kepada user
        let consensusStatus = null;
        if (result.success && result.consensusResult) {
          const consensusResult = result.consensusResult;
          
          // Dapatkan lagi verifikasi yang ada setelah penambahan verifikasi baru
          const updatedVerificationsResult = await registry.queryContract(
            contractId,
            'getProductVerifications',
            { productId }
          );
          
          consensusStatus = {
            achieved: consensusResult.achieved,
            requiredRoles: consensusResult.requiredRoles,
            verifiedRoles: consensusResult.verifiedRoles,
            missingRoles: consensusResult.missingRoles,
            totalVerifications: consensusResult.totalVerifications,
            positiveVerifications: consensusResult.positiveVerifications,
            negativeVerifications: consensusResult.negativeVerifications,
            verifications: updatedVerificationsResult.product?.verifications || []
          };
        }

        // Format response menggunakan helper yang telah kita buat
        if (result.success) {
          const formattedResponse = formatVerificationResponse(productId, {
            ...result,
            consensusStatus,
            qualityScore: newQualityScore
          });
          
          return res.status(200).json(formattedResponse);
        } else {
          // If blockchain contract fails, continue with fallback approach
          console.log("Contract execution failed:", result.message);
          throw new Error(result.message || "Contract execution failed");
        }
      } catch (contractError) {
        console.error("Error executing contract, trying fallback method:", contractError);
        
        // Fallback to using ProductManagement directly
        container.register(PRODUCT_ID, { useValue: productId });
        container.register(USER_ID, { useValue: userId });
        const productManagement = container.resolve(ProductManagement);
        
        console.log("Using fallback with ProductManagement for verification");
        
        // Create the validation criteria in the expected format - Menghilangkan ketergantungan pada threshold
        const validationCriteria = {
          // Tidak menggunakan qualityThreshold lagi
          requiredCertifications: requiredAttributes || [],
          safetyStandards: qualityChecks || [],
          expirationDate: undefined
        };
        
        const verifyResult = await productManagement.verifyProduct(validationCriteria, updatedDetails);
        
        console.log("Fallback verification result:", JSON.stringify(verifyResult));
        
        if (verifyResult.success) {
          return res.status(200).json({
            success: true,
            message: verifyResult.message || "Product verified successfully using fallback method",
            transactionId: verifyResult.transactionId,
            qualityScore: newQualityScore
          });
        } else {
          return res.status(400).json({
            success: false,
            message: verifyResult.message || "Verification failed"
          });
        }
      }
    } catch (error) {
      console.error("Error in verifyProduct:", error);
      return res.status(500).json({
        success: false,
        message: `Error verifying product: ${(error as Error).message}`
      });
    }
  };

  /**
   * Get product verification status including consensus information
   */
  public getProductVerifications = async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId || req.query.productId as string;
      const userId = req.user?.id || 'system';

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: productId"
        });
      }

      // Panggil smart contract melalui ContractRegistry
      const registry = ContractRegistry.getInstance();
      
      // Get verifications
      const verificationsResult = await registry.queryContract(
        contractId,
        'getProductVerifications',
        { productId }
      );
      
      // Get consensus status
      const consensusResult = await registry.queryContract(
        contractId,
        'getVerificationConsensus',
        { productId }
      );
      
      return res.status(200).json({
        success: true,
        productId,
        verifications: verificationsResult.product?.verifications || [],
        consensus: consensusResult.consensusResult || {
          achieved: false,
          verifiedRoles: [],
          totalVerifications: 0,
          positiveVerifications: 0,
          negativeVerifications: 0,
          consensusRatio: 0,
          requiredRoles: [],
          missingRoles: []
        },
        product: verificationsResult.product
      });
    } catch (error) {
      console.error("Error in getProductVerifications:", error);
      return res.status(500).json({
        success: false,
        message: `Error getting product verifications: ${(error as Error).message}`
      });
    }
  };

  /**
   * Check verification consensus for a product
   */
  public checkVerificationConsensus = async (req: Request, res: Response) => {
    try {
      const productId = req.params.productId || req.body.productId;
      const userId = req.user?.id || 'system';

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: productId"
        });
      }

      // Panggil smart contract melalui ContractRegistry
      const registry = ContractRegistry.getInstance();
      const result = await registry.executeContract(
        contractId,
        'checkVerificationConsensus',
        { productId },
        userId
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in checkVerificationConsensus:", error);
      return res.status(500).json({
        success: false,
        message: `Error checking verification consensus: ${(error as Error).message}`
      });
    }
  };

  /**
   * Get all recalled products
   */
  public getRecalledProducts = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id || 'system';

      // Register runtime values for ProductManagement
      container.register(USER_ID, { useValue: userId });
      const productManagement = container.resolve(ProductManagement);

      // Panggil smart contract melalui ContractRegistry
      const registry = ContractRegistry.getInstance();
      const result = await registry.queryContract(
        contractId,
        'getRecalledProducts',
        {}
      );

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error in getRecalledProducts:", error);
      return res.status(500).json({
        success: false,
        message: `Error getting recalled products: ${(error as Error).message}`
      });
    }
  };

  /**
   * Get the latest status of a product
   */
  public getProductStatus = async (req: Request, res: Response) => {
    try {
      // Try to get productId from different possible sources
      const productId = req.params.productId || req.params.id || req.query.productId as string;
      const userId = req.user?.id || 'system';

      console.log("Request params:", req.params);
      console.log("Request query:", req.query);
      console.log("Looking for product status with ID:", productId);

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: productId"
        });
      }

      // Register runtime values for ProductManagement
      container.register(PRODUCT_ID, { useValue: productId });
      container.register(USER_ID, { useValue: userId });
      const productManagement = container.resolve(ProductManagement);

      // Panggil smart contract melalui ContractRegistry untuk mendapatkan produk
      const registry = ContractRegistry.getInstance();
      const result = await registry.queryContract(
        contractId,
        'getProduct',
        { productId }
      );

      console.log("Product query result:", JSON.stringify(result));

      if (result.success && result.product) {
        return res.status(200).json({
          success: true,
          data: {
            productId,
            status: result.product.status,
            lastUpdated: new Date(result.product.updatedAt),
            details: result.product.metadata
          }
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Product status not found"
        });
      }
    } catch (error) {
      console.error("Error in getProductStatus:", error);
      return res.status(500).json({
        success: false,
        message: `Error getting product status: ${(error as Error).message}`
      });
    }
  };

  /**
   * Find available farmers in the system to help with product registration
   * @returns Array of farmer user IDs
   */
  private async getFarmersForRegistration(): Promise<string[]> {
    try {
      // Get all users with FARMER role from the database
      // For now, this is a simplified approach just to make it work
      // In a production system, you might want to find specific farmers
      // based on proximity, trust level, or other criteria
      
      // Scan the database for users with FARMER role
      const userKeys = [];
      for await (const key of txhashDB.keys({ gte: 'user:', lte: 'user:~' })) {
        userKeys.push(key);
      }
      
      const farmers: string[] = [];
      
      // Process each user to check if they have FARMER role
      for (const key of userKeys) {
        try {
          const userData = JSON.parse(await txhashDB.get(key));
          if (userData.role === UserRole.FARMER) {
            // Extract user ID from the key (format: 'user:{userId}')
            const userId = key.substring(5); // Remove 'user:' prefix
            farmers.push(userId);
          }
        } catch (err) {
          console.error(`Error processing user at key ${key}:`, err);
          // Continue with next user
        }
      }
      
      console.log(`Found ${farmers.length} farmers for potential product registration`);
      return farmers;
    } catch (error) {
      console.error("Error finding farmers for registration:", error);
      return [];
    }
  }
}