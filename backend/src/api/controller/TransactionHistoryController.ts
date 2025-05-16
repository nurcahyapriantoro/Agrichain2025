import type { Request, Response } from "express";
import { TransactionHistoryService, TransactionRecord } from "../../core/TransactionHistory";
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
    const formattedTransactions = paginatedTransactions.map((tx: TransactionRecord) => ({
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
    const formattedTransactions = paginatedTransactions.map((tx: TransactionRecord) => ({
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
    const formattedTransactions = paginatedTransactions.map((tx: TransactionRecord) => ({
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
    const formattedTransactions = transactions.map((tx: TransactionRecord) => ({
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
      details: tx.details || {},
      blockchainData: tx.blockchain || {
        blockHeight: 0,
        blockHash: tx.blockHash || "",
        transactionHash: tx.transactionHash || "",
        timestamp: tx.timestamp,
        validator: "agrichain-node-1"
      }
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
      productDetails,
      blockchain: transaction.blockchain || { 
        blockHeight: 0,
        blockHash: transaction.blockHash || "",
        transactionHash: transaction.transactionHash || "",
        timestamp: transaction.timestamp,
        validator: "unknown"
      }
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