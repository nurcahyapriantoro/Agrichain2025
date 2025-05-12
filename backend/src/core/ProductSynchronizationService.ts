import { ProductStatus, UserRole } from "../enum";
import { txhashDB } from "../helper/level.db.client";
import ProductService from "./ProductService";
import { ContractRegistry } from "../contracts/ContractRegistry";
import RoleService from "./RoleService";

// ID kontrak untuk pengelolaan produk
const contractId = 'product-management-v1';

interface SyncResult {
  success: boolean;
  totalProducts?: number;
  syncedProducts?: number;
  failedProducts?: number;
  productId?: string;
  message?: string;
  details?: Array<{
    productId: string;
    status: 'success' | 'failed';
    message?: string;
    transactionId?: string;
  }>;
}

/**
 * Service untuk menyinkronkan produk antara database dan blockchain
 */
class ProductSynchronizationService {
  private static registry = ContractRegistry.getInstance();

  /**
   * Menyinkronkan satu produk dari database ke blockchain dengan ID yang konsisten
   * @param productId ID produk yang akan disinkronkan
   * @returns Hasil sinkronisasi
   */
  static async synchronizeProduct(productId: string): Promise<SyncResult> {
    console.log(`Starting synchronization for product: ${productId}`);
    
    try {
      // 1. Ambil produk dari database lokal
      const product = await ProductService.getProduct(productId);
      
      if (!product) {
        console.error(`Product ${productId} not found in local database`);
        return {
          success: false,
          productId,
          message: `Product not found in local database`
        };
      }
      
      // 2. Periksa apakah produk sudah ada di blockchain
      const blockchainCheck = await this.registry.queryContract(
        contractId,
        'getProduct',
        { productId }
      );
      
      // 3. Jika produk sudah ada di blockchain, tidak perlu mendaftarkan ulang
      if (blockchainCheck.success && blockchainCheck.product) {
        console.log(`Product ${productId} already exists in blockchain`);
        
        // Update metadata di database lokal jika belum ditandai sebagai terdaftar
        if (!product.metadata?.blockchainRegistered) {
          product.metadata = {
            ...product.metadata || {},
            blockchainRegistered: true,
            blockchainSyncedAt: Date.now()
          };
          await txhashDB.put(`product:${productId}`, JSON.stringify(product));
        }
        
        return {
          success: true,
          productId,
          message: `Product already synchronized`
        };
      }
      
      // 4. Jika belum ada di blockchain, daftarkan dengan ID yang sama
      console.log(`Product ${productId} not found in blockchain, registering...`);
      
      // 5. Verifikasi pemilik adalah petani atau temukan petani untuk pendaftaran
      const ownerRole = await RoleService.getUserRole(product.ownerId);
      let farmerId = product.ownerId;
      let needsOwnershipTransfer = false;
      
      // Jika pemilik bukan petani, cari petani untuk mendaftarkan produk
      if (ownerRole !== UserRole.FARMER) {
        console.log(`Owner ${product.ownerId} is not a farmer (${ownerRole}), finding a farmer...`);
        const farmers = await this.getFarmersForRegistration();
        
        if (!farmers || farmers.length === 0) {
          return {
            success: false,
            productId,
            message: `No farmers available for registration and owner is not a farmer`
          };
        }
        
        farmerId = farmers[0];
        needsOwnershipTransfer = true;
        console.log(`Using farmer ${farmerId} to register product`);
      }
      
      // 6. Daftarkan produk ke blockchain dengan ID yang sama
      const registerResult = await this.registry.executeContract(
        contractId,
        'createProduct',
        { 
          productId, // Penting: Kirim ID produk yang sama untuk digunakan di blockchain
          farmerId: farmerId,
          name: product.name || "",
          productName: product.metadata?.productName || product.name || "",
          description: product.description || 'No description available',
          initialQuantity: product.quantity && product.quantity > 0 ? product.quantity : 1,
          unit: product.metadata?.unit || 'unit',
          price: product.price || 0,
          productionDate: product.metadata?.productionDate || new Date().toISOString(),
          expiryDate: product.metadata?.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          location: product.metadata?.location || 'Unknown',
          metadata: {
            ...product.metadata || {},
            originalOwnerId: needsOwnershipTransfer ? product.ownerId : undefined,
            registeredOnBehalfOf: needsOwnershipTransfer
          }
        },
        farmerId
      );
      
      // 7. Jika pendaftaran berhasil dan perlu transfer kepemilikan
      if (registerResult.success && needsOwnershipTransfer) {
        console.log(`Product ${productId} registered successfully, transferring ownership to ${product.ownerId}`);
        
        // Transfer kepemilikan kembali ke pemilik asli
        const transferResult = await this.registry.executeContract(
          'ownership-transfer-v1',
          'transferOwnership',
          {
            productId,
            fromUserId: farmerId,
            toUserId: product.ownerId,
            details: {
              reason: "Registration on behalf of non-farmer owner",
              automaticTransfer: true
            }
          },
          farmerId
        );
        
        if (!transferResult.success) {
          console.error(`Failed to transfer ownership back to ${product.ownerId}: ${transferResult.message}`);
        }
      }
      
      // 8. Update metadata di database lokal
      if (registerResult.success) {
        console.log(`Product ${productId} successfully registered in blockchain`);
        
        product.metadata = {
          ...product.metadata || {},
          blockchainRegistered: true,
          blockchainTransactionId: registerResult.transactionId,
          blockchainRegisteredAt: Date.now()
        };
        
        await txhashDB.put(`product:${productId}`, JSON.stringify(product));
        
        return {
          success: true,
          productId,
          message: `Product successfully synchronized with blockchain`,
          details: [{
            productId,
            status: 'success',
            message: `Registered with transaction ID: ${registerResult.transactionId}`,
            transactionId: registerResult.transactionId
          }]
        };
      } else {
        console.error(`Failed to register product ${productId} in blockchain: ${registerResult.message}`);
        return {
          success: false,
          productId,
          message: registerResult.message || `Failed to register in blockchain`
        };
      }
    } catch (error) {
      console.error(`Error synchronizing product ${productId}:`, error);
      return {
        success: false,
        productId,
        message: `Synchronization error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Menyinkronkan produk dari database ke blockchain
   * @returns Hasil sinkronisasi
   */
  static async synchronizeProducts(): Promise<SyncResult> {
    console.log("Starting product synchronization process...");
    
    // 1. Ambil semua produk dari database konvensional
    const databaseProducts = await ProductService.getAllProducts();
    console.log(`Found ${databaseProducts.length} products in database`);
    
    const result: SyncResult = {
      success: true,
      totalProducts: databaseProducts.length,
      syncedProducts: 0,
      failedProducts: 0,
      details: []
    };
    
    // 2. Periksa dan sinkronkan setiap produk
    for (const product of databaseProducts) {
      try {
        // Pastikan produk memiliki ID yang valid
        if (!product.id) {
          console.error("Skipping product without valid ID");
          result.failedProducts!++;
          result.details?.push({
            productId: "unknown",
            status: 'failed',
            message: "Product ID is missing or invalid"
          });
          continue;
        }

        // Sinkronkan produk satu per satu menggunakan metode synchronizeProduct
        const syncResult = await this.synchronizeProduct(product.id);
        
        if (syncResult.success) {
          result.syncedProducts!++;
          // Tambahkan detail dari hasil sinkronisasi produk tunggal
          if (syncResult.details && syncResult.details.length > 0) {
            result.details!.push(...syncResult.details);
          } else {
            result.details!.push({
              productId: product.id,
              status: 'success',
              message: syncResult.message || 'Product synchronized successfully'
            });
          }
        } else {
          result.failedProducts!++;
          result.details!.push({
            productId: product.id,
            status: 'failed',
            message: syncResult.message || 'Failed to synchronize'
          });
        }
      } catch (error) {
        result.failedProducts!++;
        result.details?.push({
          productId: product.id || "unknown",
          status: 'failed',
          message: `Error during synchronization: ${(error as Error).message}`
        });
        console.error(`Error synchronizing product ${product.id || "unknown"}:`, error);
      }
    }
    
    console.log(`Synchronization completed. Total: ${result.totalProducts}, Synced: ${result.syncedProducts}, Failed: ${result.failedProducts}`);
    return result;
  }

  /**
   * Mendapatkan daftar petani yang tersedia untuk pendaftaran produk
   * @private
   * @returns Array berisi ID petani yang tersedia
   */
  private static async getFarmersForRegistration(): Promise<string[]> {
    try {
      // Implementasi sederhana: mengambil semua pengguna dengan peran FARMER
      // Di implementasi sebenarnya, Anda bisa menambahkan logika untuk memilih petani
      // berdasarkan ketersediaan, lokasi, jenis produk, dll.
      
      // Scan database untuk semua kunci pengguna dengan peran FARMER
      const allKeys = await txhashDB.keys().all();
      const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
      
      const farmerIds: string[] = [];
      
      for (const key of userKeys) {
        try {
          const data = await txhashDB.get(key);
          const userData = typeof data === 'string' ? JSON.parse(data) : data;
          
          if (userData && userData.role === UserRole.FARMER) {
            const userId = key.toString().replace('user:', '');
            farmerIds.push(userId);
          }
        } catch (error) {
          console.error(`Error processing user key ${key}:`, error);
        }
      }
      
      return farmerIds;
    } catch (error) {
      console.error("Error getting farmers for registration:", error);
      return [];
    }
  }

  /**
   * Menjadwalkan sinkronisasi berkala
   * @param intervalMinutes Interval dalam menit
   */
  static schedulePeriodicSync(intervalMinutes: number = 5): NodeJS.Timeout {
    console.log(`Scheduling periodic product synchronization every ${intervalMinutes} minutes`);
    
    return setInterval(async () => {
      console.log("Running scheduled product synchronization...");
      try {
        await this.synchronizeProducts();
      } catch (error) {
        console.error("Error during scheduled product synchronization:", error);
      }
    }, intervalMinutes * 60 * 1000);
  }
}

export default ProductSynchronizationService;