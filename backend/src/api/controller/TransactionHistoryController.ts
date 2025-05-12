import type { Request, Response } from "express";
import { TransactionHistoryService } from "../../core/TransactionHistory";
import { TransactionActionType, UserRole, ProductStatus, RecallReason, StockChangeReason } from "../../enum";
import ProductService from "../../core/ProductService";
import { txhashDB } from "../../helper/level.db.client";

/**
 * Get transaction history for a specific product
 */
export const getProductTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    console.log(`Fetching transaction history for product: ${productId}`);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: productId",
        data: {
          transactions: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        }
      });
    }

    const transactions = await TransactionHistoryService.getProductTransactionHistory(productId);
    console.log(`Found ${transactions.length} transactions for product ${productId}`);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Format transactions consistently with the latest transactions endpoint
    const formattedTransactions = paginatedTransactions.map(tx => ({
      id: tx.id,
      productId: tx.productId,
      from: tx.fromUserId,
      to: tx.toUserId,
      fromRole: tx.fromRole,
      toRole: tx.toRole,
      timestamp: tx.timestamp,
      formattedTime: formatTimeAgo(tx.timestamp),
      type: tx.actionType,
      status: tx.productStatus,
      details: tx.details || {}
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: transactions.length,
          page,
          limit,
          totalPages: Math.ceil(transactions.length / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getProductTransactionHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product transaction history",
      data: {
        transactions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    });
  }
};

/**
 * Get transaction history for a specific user
 */
export const getUserTransactionHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    console.log(`Fetching transaction history for user: ${userId}`);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: userId",
        data: {
          transactions: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        }
      });
    }

    const transactions = await TransactionHistoryService.getUserTransactionHistory(userId);
    console.log(`Found ${transactions.length} transactions for user ${userId}`);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Format transactions consistently with other endpoints
    const formattedTransactions = paginatedTransactions.map(tx => ({
      id: tx.id,
      productId: tx.productId,
      from: tx.fromUserId,
      to: tx.toUserId,
      fromRole: tx.fromRole,
      toRole: tx.toRole,
      timestamp: tx.timestamp,
      formattedTime: formatTimeAgo(tx.timestamp),
      type: tx.actionType,
      status: tx.productStatus,
      details: tx.details || {}
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: transactions.length,
          page,
          limit,
          totalPages: Math.ceil(transactions.length / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getUserTransactionHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching user transaction history",
      data: {
        transactions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    });
  }
};

/**
 * Get transaction history by public key
 * This searches for transactions where fromUserId or toUserId equals the provided public key
 */
export const getTransactionHistoryByPublicKey = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    console.log(`Searching transactions for public key: ${publicKey}`);

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: publicKey",
        data: {
          transactions: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        }
      });
    }

    // Use the public key directly as userId to search transactions
    const transactions = await TransactionHistoryService.getUserTransactionHistory(publicKey);
    console.log(`Found ${transactions.length} transactions for public key ${publicKey}`);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    // Format transactions consistently with other endpoints
    const formattedTransactions = paginatedTransactions.map(tx => ({
      id: tx.id,
      productId: tx.productId,
      from: tx.fromUserId,
      to: tx.toUserId,
      fromRole: tx.fromRole,
      toRole: tx.toRole,
      timestamp: tx.timestamp,
      formattedTime: formatTimeAgo(tx.timestamp),
      type: tx.actionType,
      status: tx.productStatus,
      details: tx.details || {}
    }));

    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: transactions.length,
          page,
          limit,
          totalPages: Math.ceil(transactions.length / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getTransactionHistoryByPublicKey:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching transaction history",
      data: {
        transactions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    });
  }
};

/**
 * Get latest transactions for all users
 */
export const getLatestTransactions = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const skip = (page - 1) * limit;

    console.log(`Fetching latest transactions with page=${page}, limit=${limit}`);
    
    // Get latest transactions from the database
    const allKeys = await TransactionHistoryService.getAllTransactionKeys();
    console.log(`Found ${allKeys.length} total transaction keys`);
    
    // Sort keys to get newest first
    const sortedKeys = allKeys.sort().reverse();
    
    // Apply pagination
    const paginatedKeys = sortedKeys.slice(skip, skip + limit);
    console.log(`Selected ${paginatedKeys.length} keys for current page`);
    
    // Get transactions from keys
    const transactions = await TransactionHistoryService.getTransactionsFromKeys(paginatedKeys);
    console.log(`Retrieved ${transactions.length} transactions`);

    // Format transactions for frontend
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      productId: tx.productId,
      from: tx.fromUserId,
      to: tx.toUserId,
      fromRole: tx.fromRole,
      toRole: tx.toRole,
      timestamp: tx.timestamp,
      formattedTime: formatTimeAgo(tx.timestamp),
      type: tx.actionType,
      status: tx.productStatus,
      details: tx.details || {}
    }));

    // Send response in the structure frontend expects
    return res.status(200).json({
      success: true,
      data: {
        transactions: formattedTransactions,
        pagination: {
          total: allKeys.length,
          page,
          limit,
          totalPages: Math.ceil(allKeys.length / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getLatestTransactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching latest transactions",
      data: {
        transactions: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0
        }
      }
    });
  }
};

/**
 * Get details of a specific transaction
 */
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: transactionId"
      });
    }

    const transaction = await TransactionHistoryService.getTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction with ID ${transactionId} not found`
      });
    }

    console.log("Transaction details:", transaction);

    // Default product details
    let productDetails = {
      nama_produk: "Tidak diketahui",
      deskripsi_product: "Tidak ada deskripsi",
      quantity: "0",
      price: "0"
    };

    // First try to get the original product details from ProductService
    // This ensures we always show the correct product name
    if (transaction.productId) {
      try {
        if (typeof ProductService !== 'undefined' && ProductService.getProduct) {
          const product = await ProductService.getProduct(transaction.productId);
          if (product) {
            productDetails = {
              nama_produk: product.name || "Tidak diketahui",
              deskripsi_product: product.description || "Tidak ada deskripsi",
              quantity: product.quantity?.toString() || "0",
              price: product.price?.toString() || "0"
            };
          }
        }
      } catch (err) {
        console.log("Error fetching product details:", err);
      }
    }

    // If we couldn't get product details directly, fallback to transaction details
    if (productDetails.nama_produk === "Tidak diketahui" && transaction.details) {
      console.log("Transaction.details:", transaction.details);
      
      // Ekstrak informasi produk berdasarkan jenis transaksi
      if (transaction.actionType === TransactionActionType.VERIFY) {
        productDetails = {
          nama_produk: transaction.details.name || transaction.details.productName || "Tidak diketahui",
          deskripsi_product: transaction.details.description || transaction.details.productDescription || "Tidak ada deskripsi",
          quantity: transaction.details.quantity?.toString() || "0", 
          price: transaction.details.price?.toString() || "0"
        };
      } else if (transaction.actionType === TransactionActionType.STOCK_IN || 
                transaction.actionType === TransactionActionType.STOCK_OUT || 
                transaction.actionType === TransactionActionType.STOCK_ADJUST) {
        // Untuk transaksi stok
        productDetails = {
          nama_produk: transaction.details.productName || "Stok Produk", 
          deskripsi_product: transaction.details.productDescription || `${transaction.actionType} operation`,
          quantity: transaction.details.quantity?.toString() || "0",
          price: transaction.details.price?.toString() || "0"
        };
      } else if (transaction.actionType === TransactionActionType.TRANSFER) {
        // Untuk transaksi transfer
        productDetails = {
          nama_produk: transaction.details.productName || transaction.details.name || "Transfer Produk",
          deskripsi_product: transaction.details.productDescription || transaction.details.description || "Transfer kepemilikan produk", 
          quantity: transaction.details.quantity?.toString() || "1",
          price: transaction.details.price?.toString() || "0"
        };
      } else {
        // Untuk transaksi lainnya
        productDetails = {
          nama_produk: transaction.details.productName || transaction.details.name || "Transaksi Produk", 
          deskripsi_product: transaction.details.productDescription || transaction.details.description || "Detail transaksi tidak tersedia",
          quantity: transaction.details.quantity?.toString() || "0",
          price: transaction.details.price?.toString() || "0"
        };
      }
    }

    // Format response
    const formattedResponse = {
      transactionHash: transaction.id || transaction.transactionHash,
      status: "Success", // Assuming success if transaction exists
      timestamp: transaction.timestamp,
      from: transaction.fromUserId,
      to: transaction.toUserId,
      method: transaction.actionType,
      productDetails
    };

    return res.status(200).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    console.error("Error in getTransactionDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching transaction details"
    });
  }
};

/**
 * Helper function to format time as "X minutes/seconds ago"
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const secondsAgo = Math.floor((now - timestamp) / 1000);
  
  // Less than a minute
  if (secondsAgo < 60) {
    return `${secondsAgo} seconds ago`;
  }
  
  // Less than an hour
  const minutesAgo = Math.floor(secondsAgo / 60);
  if (minutesAgo < 60) {
    return `${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`;
  }
  
  // Less than a day
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) {
    return `${hoursAgo} hour${hoursAgo === 1 ? '' : 's'} ago`;
  }
  
  // Days ago
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`;
}

/**
 * Create a test transaction for demonstration purposes
 */
export const createTestTransaction = async (req: Request, res: Response) => {
  try {
    const { productId, fromUserId, toUserId, type } = req.body;
    
    if (!productId || !fromUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: productId and fromUserId are required"
      });
    }
    
    // Default values
    const fromRole = req.body.fromRole || UserRole.FARMER;
    const toRole = req.body.toRole || UserRole.TRADER;
    const actionType = type || TransactionActionType.TRANSFER;
    const status = req.body.status || ProductStatus.TRANSFERRED;
    const details = req.body.details || {
      name: "Test Product",
      description: "This is a test product created for demonstration",
      price: Math.floor(Math.random() * 100000) + 10000,
      quantity: Math.floor(Math.random() * 10) + 1
    };
    
    // Create a transaction history record
    const result = await TransactionHistoryService.recordProductTransfer(
      productId,
      fromUserId,
      fromRole,
      toUserId || fromUserId, // If toUserId not provided, use fromUserId
      toRole,
      details
    );
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        message: "Test transaction created successfully",
        data: {
          transactionId: result.transactionId,
          details: {
            productId,
            fromUserId,
            toUserId: toUserId || fromUserId,
            actionType,
            status,
            timestamp: Date.now()
          }
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to create test transaction: " + result.message
      });
    }
  } catch (error) {
    console.error("Error creating test transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating test transaction"
    });
  }
};

/**
 * Create multiple test transactions for demonstration purposes
 */
export const createBulkTestTransactions = async (req: Request, res: Response) => {
  try {
    const { count = 5, productId, fromUserId } = req.body;
    
    if (!productId || !fromUserId) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: productId and fromUserId are required"
      });
    }
    
    // Limit count to a reasonable number
    const transactionCount = Math.min(Math.max(1, count), 20);
    
    // Available action types and roles for variety
    const actionTypes = [
      TransactionActionType.CREATE,
      TransactionActionType.TRANSFER,
      TransactionActionType.UPDATE,
      TransactionActionType.VERIFY,
      TransactionActionType.STOCK_IN,
      TransactionActionType.STOCK_OUT
    ];
    
    const userRoles = [
      UserRole.FARMER,
      UserRole.COLLECTOR,
      UserRole.TRADER,
      UserRole.RETAILER,
      UserRole.CONSUMER
    ];
    
    const results = [];
    
    for (let i = 0; i < transactionCount; i++) {
      // Create some randomness in the transactions
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
      const fromRole = userRoles[Math.floor(Math.random() * userRoles.length)];
      const toRole = userRoles[Math.floor(Math.random() * userRoles.length)];
      const timestamp = Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time within last 30 days
      
      // Generate a unique ID for this test transaction
      const testId = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Create details with some randomness
      const details = {
        name: `Test Product ${i + 1}`,
        description: `This is test transaction #${i + 1} created for demonstration`,
        price: Math.floor(Math.random() * 100000) + 10000,
        quantity: Math.floor(Math.random() * 10) + 1,
        testId
      };
      
      // Create different transaction types based on action
      let result;
      if (actionType === TransactionActionType.CREATE) {
        result = await TransactionHistoryService.recordProductCreation(
          productId,
          fromUserId,
          details
        );
      } else if (actionType === TransactionActionType.VERIFY) {
        result = await TransactionHistoryService.recordProductVerification(
          productId,
          fromUserId,
          fromRole,
          Math.random() > 0.2, // 80% pass rate
          details
        );
      } else if (actionType === TransactionActionType.STOCK_IN || actionType === TransactionActionType.STOCK_OUT) {
        const quantity = actionType === TransactionActionType.STOCK_IN ? 
          Math.floor(Math.random() * 20) + 1 : 
          -Math.floor(Math.random() * 10) - 1;
        
        result = await TransactionHistoryService.recordStockChange(
          productId,
          fromUserId,
          fromRole,
          quantity,
          actionType,
          StockChangeReason.ADJUSTMENT,
          details
        );
      } else {
        // For other types, use transfer as the default
        result = await TransactionHistoryService.recordProductTransfer(
          productId,
          fromUserId,
          fromRole,
          req.body.toUserId || fromUserId, // If toUserId not provided, use fromUserId
          toRole,
          details
        );
      }
      
      if (result.success) {
        results.push({
          transactionId: result.transactionId,
          actionType,
          fromRole,
          toRole,
          timestamp
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      message: `Created ${results.length} test transactions successfully`,
      data: {
        transactions: results
      }
    });
  } catch (error) {
    console.error("Error creating bulk test transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error creating bulk test transactions"
    });
  }
};

/**
 * Get diagnostic statistics about the transaction database
 */
export const getTransactionStats = async (req: Request, res: Response) => {
  try {
    // Get all keys from the database to analyze
    const allKeys = await txhashDB.keys().all();
    
    // Group keys by type
    const stats = {
      totalKeys: allKeys.length,
      transactionKeys: allKeys.filter(key => key.startsWith('transaction:')).length,
      userKeys: allKeys.filter(key => key.startsWith('user:')).length,
      productKeys: allKeys.filter(key => key.startsWith('product:')).length,
      otherKeys: 0,
      sample: {
        transactions: [] as Array<{ key: string; id: string; productId: string; timestamp: number; type: string }>,
        users: [] as string[],
        products: [] as string[]
      }
    };
    
    // Calculate other keys
    stats.otherKeys = stats.totalKeys - stats.transactionKeys - stats.userKeys - stats.productKeys;
    
    // Get sample keys (up to 5 of each type)
    const transactionKeys = allKeys.filter(key => key.startsWith('transaction:')).slice(0, 5);
    const userKeys = allKeys.filter(key => key.startsWith('user:')).slice(0, 5);
    const productKeys = allKeys.filter(key => key.startsWith('product:')).slice(0, 5);
    
    // Add sample data
    for (const key of transactionKeys) {
      try {
        const data = await txhashDB.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          stats.sample.transactions.push({
            key,
            id: parsed.id,
            productId: parsed.productId,
            timestamp: parsed.timestamp,
            type: parsed.actionType
          });
        }
      } catch (error) {
        console.error(`Error fetching sample transaction ${key}:`, error);
      }
    }
    
    // Attempt to get recently added transaction information
    let recentTransactions = [];
    try {
      const sortedTransactions = allKeys
        .filter(key => key.startsWith('transaction:'))
        .sort()
        .reverse()
        .slice(0, 3);
        
      for (const key of sortedTransactions) {
        const data = await txhashDB.get(key);
        if (data) {
          recentTransactions.push(JSON.parse(data));
        }
      }
    } catch (error) {
      console.error('Error getting recent transactions:', error);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        stats,
        recentTransactions
      }
    });
  } catch (error) {
    console.error("Error in getTransactionStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching transaction stats"
    });
  }
};