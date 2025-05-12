import { UserRole, TransactionActionType, ProductStatus, RecallReason, StockChangeReason } from "../enum";
import { txhashDB } from "../helper/level.db.client";

/**
 * Interface for a transaction history record
 */
interface TransactionRecord {
  id: string;
  productId: string;
  fromUserId: string; 
  fromRole: UserRole;
  toUserId: string;
  toRole: UserRole;
  actionType: TransactionActionType;
  productStatus: ProductStatus;
  timestamp: number;
  details?: Record<string, any>;
  blockHash?: string; // Hash of the block containing this transaction
  transactionHash?: string; // Hash of the transaction
}

/**
 * Class for recording and tracking product transaction history
 */
class TransactionHistory {
  private productId: string;
  private fromUserId: string;
  private toUserId: string;
  private actionType: TransactionActionType;
  private productStatus: ProductStatus;
  private details?: Record<string, any>;

  constructor(
    productId: string,
    fromUserId: string,
    toUserId: string,
    actionType: TransactionActionType,
    productStatus: ProductStatus,
    details?: Record<string, any>
  ) {
    this.productId = productId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.actionType = actionType;
    this.productStatus = productStatus;
    this.details = details;
  }

  /**
   * Record the transaction in the blockchain/database
   * @param fromRole Role of the sender
   * @param toRole Role of the receiver
   * @returns Result of the recording operation
   */
  async recordTransaction(
    fromRole: UserRole,
    toRole: UserRole
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    try {
      // Generate a unique transaction ID
      const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Create the transaction record
      const record: TransactionRecord = {
        id: transactionId,
        productId: this.productId,
        fromUserId: this.fromUserId,
        fromRole,
        toUserId: this.toUserId,
        toRole,
        actionType: this.actionType,
        productStatus: this.productStatus,
        timestamp: Date.now(),
        details: this.details
      };

      // Store the transaction in the blockchain database
      await txhashDB.put(`transaction:${transactionId}`, JSON.stringify(record));
      
      // Also store a reference by user IDs for faster querying
      if (this.fromUserId) {
        await txhashDB.put(`user:${this.fromUserId}:${transactionId}`, JSON.stringify({ transactionId }));
      }
      
      if (this.toUserId && this.toUserId !== this.fromUserId) {
        await txhashDB.put(`user:${this.toUserId}:${transactionId}`, JSON.stringify({ transactionId }));
      }
      
      // Also store a reference by product ID for faster querying
      await txhashDB.put(`product:${this.productId}:transaction:${transactionId}`, JSON.stringify({ transactionId }));
      
      console.log("Transaction recorded:", record);

      return {
        success: true,
        transactionId,
        message: `Transaction recorded successfully with ID: ${transactionId}`
      };
    } catch (error) {
      console.error("Error recording transaction:", error);
      return {
        success: false,
        message: "Failed to record transaction due to an error."
      };
    }
  }

  /**
   * Set blockchain transaction details after the transaction is confirmed
   * @param transactionId ID of the previously recorded transaction
   * @param blockHash Hash of the block containing the transaction
   * @param transactionHash Hash of the transaction itself
   * @returns Result of the update operation
   */
  static async setBlockchainDetails(
    transactionId: string,
    blockHash: string,
    transactionHash: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // 1. Fetch the existing record
      const recordKey = `transaction:${transactionId}`;
      const recordJson = await txhashDB.get(recordKey);
      
      if (!recordJson) {
        return {
          success: false,
          message: `Transaction with ID ${transactionId} not found`
        };
      }
      
      // 2. Update it with blockchain details
      const record = JSON.parse(recordJson);
      record.blockHash = blockHash;
      record.transactionHash = transactionHash;
      
      // 3. Save it back
      await txhashDB.put(recordKey, JSON.stringify(record));
      
      // 4. Add a cross-reference by transaction hash for future lookups
      if (transactionHash) {
        await txhashDB.put(`txhash:${transactionHash}`, transactionId);
      }
      
      console.log(`Updated transaction ${transactionId} with block hash ${blockHash} and tx hash ${transactionHash}`);
      
      return {
        success: true,
        message: "Blockchain details updated successfully"
      };
    } catch (error) {
      console.error("Error updating blockchain details:", error);
      return {
        success: false,
        message: "Failed to update blockchain details"
      };
    }
  }
}

/**
 * Service for managing transaction history
 */
class TransactionHistoryService {
  /**
   * Create a new transaction history record for product creation
   * @param productId ID of the created product
   * @param farmerId ID of the farmer who created the product
   * @param details Additional details about the creation
   * @returns Result of the recording operation
   */
  static async recordProductCreation(
    productId: string,
    farmerId: string,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    const history = new TransactionHistory(
      productId,
      farmerId, // from is the farmer
      farmerId, // to is also the farmer (initial owner)
      TransactionActionType.CREATE,
      ProductStatus.CREATED,
      details
    );

    return history.recordTransaction(UserRole.FARMER, UserRole.FARMER);
  }

  /**
   * Record a product ownership transfer transaction
   * @param productId ID of the product being transferred
   * @param fromUserId ID of the current owner
   * @param fromRole Role of the current owner
   * @param toUserId ID of the new owner
   * @param toRole Role of the new owner
   * @param details Additional details about the transfer
   * @returns Result of the recording operation
   */
  static async recordProductTransfer(
    productId: string,
    fromUserId: string,
    fromRole: UserRole,
    toUserId: string,
    toRole: UserRole,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    const history = new TransactionHistory(
      productId,
      fromUserId,
      toUserId,
      TransactionActionType.TRANSFER,
      ProductStatus.TRANSFERRED,
      details
    );

    return history.recordTransaction(fromRole, toRole);
  }

  /**
   * Record a product status update transaction
   * @param productId ID of the product being updated
   * @param userId ID of the user updating the status
   * @param userRole Role of the user updating the status
   * @param newStatus New status of the product
   * @param details Additional details about the update
   * @returns Result of the recording operation
   */
  static async recordProductStatusUpdate(
    productId: string,
    userId: string,
    userRole: UserRole,
    newStatus: ProductStatus,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    const history = new TransactionHistory(
      productId,
      userId, // from is the updater
      userId, // to is also the updater (same user)
      TransactionActionType.UPDATE,
      newStatus,
      details
    );

    return history.recordTransaction(userRole, userRole);
  }

  /**
   * Record a product recall transaction
   * @param productId ID of the product being recalled
   * @param userId ID of the user initiating the recall
   * @param userRole Role of the user initiating the recall
   * @param reason Reason for the recall
   * @param details Additional details about the recall
   * @returns Result of the recording operation
   */
  static async recordProductRecall(
    productId: string,
    userId: string,
    userRole: UserRole,
    reason: RecallReason,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    const history = new TransactionHistory(
      productId,
      userId, // from is the initiator of recall
      userId, // to is also the initiator (same user)
      TransactionActionType.RECALL,
      ProductStatus.RECALLED,
      {
        recallReason: reason,
        ...details
      }
    );

    return history.recordTransaction(userRole, userRole);
  }

  /**
   * Record a product verification transaction
   * @param productId ID of the product being verified
   * @param userId ID of the user performing the verification
   * @param userRole Role of the user performing the verification
   * @param passed Whether the verification passed or failed
   * @param details Additional details about the verification
   * @returns Result of the recording operation
   */
  static async recordProductVerification(
    productId: string,
    userId: string,
    userRole: UserRole,
    passed: boolean,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    const status = passed ? ProductStatus.VERIFIED : ProductStatus.DEFECTIVE;
    
    const history = new TransactionHistory(
      productId,
      userId, // from is the verifier
      userId, // to is also the verifier (same user)
      TransactionActionType.VERIFY,
      status,
      {
        verificationResult: passed ? "PASSED" : "FAILED",
        ...details
      }
    );

    return history.recordTransaction(userRole, userRole);
  }

  /**
   * Record a stock update transaction
   * @param productId ID of the product
   * @param userId ID of the user updating the stock
   * @param userRole Role of the user updating the stock
   * @param quantity New quantity or change in quantity
   * @param actionType Type of stock action (STOCK_IN, STOCK_OUT, STOCK_ADJUST)
   * @param reason Reason for the stock change
   * @param details Additional details about the stock update
   * @returns Result of the recording operation
   */
  static async recordStockChange(
    productId: string,
    userId: string,
    userRole: UserRole,
    quantity: number,
    actionType: TransactionActionType,
    reason: StockChangeReason,
    details?: Record<string, any>
  ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
    // Determine the appropriate product status based on stock level
    let productStatus: ProductStatus;
    if (quantity <= 0) {
      productStatus = ProductStatus.OUT_OF_STOCK;
    } else if (quantity < 10) { // Assuming 10 is the low stock threshold
      productStatus = ProductStatus.LOW_STOCK;
    } else {
      productStatus = ProductStatus.IN_STOCK;
    }

    const stockDetails = {
      quantity,
      reason,
      updatedBy: userId,
      updaterRole: userRole,
      ...details
    };

    const history = new TransactionHistory(
      productId,
      userId, // from is the stock updater
      userId, // to is also the stock updater (same user)
      actionType,
      productStatus,
      stockDetails
    );

    return history.recordTransaction(userRole, userRole);
  }

  /**
   * Get stock transaction history for a specific product
   * @param productId ID of the product
   * @returns Array of stock-related transaction records for the product
   */
  static async getProductStockHistory(
    productId: string
  ): Promise<TransactionRecord[]> {
    try {
      // Get all transaction history for the product
      const allHistory = await this.getProductTransactionHistory(productId);
      
      // Filter for stock-related transactions
      const stockHistory = allHistory.filter(
        record => 
          record.actionType === TransactionActionType.STOCK_IN ||
          record.actionType === TransactionActionType.STOCK_OUT ||
          record.actionType === TransactionActionType.STOCK_ADJUST
      );
      
      return stockHistory;
    } catch (error) {
      console.error("Error fetching product stock history:", error);
      return [];
    }
  }

  /**
   * Get the current stock level of a product
   * @param productId ID of the product
   * @returns Current stock quantity or null if not found
   */
  static async getCurrentStockLevel(
    productId: string
  ): Promise<number | null> {
    try {
      // Get all stock-related transactions for the product
      const stockHistory = await this.getProductStockHistory(productId);
      
      if (stockHistory.length === 0) {
        return null;
      }
      
      // Sort by timestamp to process in chronological order
      stockHistory.sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate the current stock level
      let currentStock = 0;
      
      for (const record of stockHistory) {
        const quantity = record.details?.quantity || 0;
        
        switch (record.actionType) {
          case TransactionActionType.STOCK_IN:
            currentStock += quantity;
            break;
          case TransactionActionType.STOCK_OUT:
            currentStock -= quantity;
            break;
          case TransactionActionType.STOCK_ADJUST:
            // For adjustments, we assume the quantity is the absolute new value
            currentStock = quantity;
            break;
        }
      }
      
      // Ensure stock never goes below zero
      return Math.max(0, currentStock);
    } catch (error) {
      console.error("Error calculating current stock level:", error);
      return null;
    }
  }

  /**
   * Get all transactions for a specific product
   * @param productId ID of the product
   * @returns Array of transaction records for the product
   */
  static async getProductTransactionHistory(
    productId: string
  ): Promise<TransactionRecord[]> {
    try {
      if (!productId) {
        console.warn("getProductTransactionHistory called with empty productId");
        return [];
      }

      console.log(`Looking up transaction history for product: ${productId}`);
      
      // Use prefix scanning to find relevant transactions
      const productPrefix = `product:${productId}:transaction:`;
      const transactionIds: string[] = [];
      
      // Get all keys and filter those with our prefix
      try {
        const allKeys = await txhashDB.keys().all();
        // Filter keys with the product prefix
        const productKeys = allKeys.filter(key => key.startsWith(productPrefix));
        
        // Extract transaction IDs from the keys
        for (const key of productKeys) {
          const parts = key.split(':');
          if (parts.length >= 4) {
            transactionIds.push(parts[3]);
          }
        }
        
        console.log(`Found ${transactionIds.length} transaction IDs for product ${productId}`);
      } catch (error) {
        console.error(`Error scanning keys for product ${productId}:`, error);
        return [];
      }
      
      // Now get the actual transaction records
      const transactionRecords: TransactionRecord[] = [];
      
      for (const transactionId of transactionIds) {
        try {
          const recordKey = `transaction:${transactionId}`;
          const recordJson = await txhashDB.get(recordKey);
          
          if (recordJson) {
            const record = JSON.parse(recordJson);
            transactionRecords.push(record);
          }
        } catch (error) {
          console.error(`Error fetching transaction ${transactionId}:`, error);
        }
      }
      
      // Additional check for transactions that might be related to this product but not indexed properly
      try {
        const allKeys = await txhashDB.keys().all();
        const transactionKeys = allKeys.filter(key => key.startsWith('transaction:'));
        
        for (const key of transactionKeys) {
          // Skip transactions we've already processed
          const txId = key.split(':')[1];
          if (transactionIds.includes(txId)) continue;
          
          try {
            const recordJson = await txhashDB.get(key);
            if (!recordJson) continue;
            
            const record = JSON.parse(recordJson);
            
            // Check if this transaction is related to our product
            if (record && record.productId === productId && 
                !transactionRecords.some(tr => tr.id === record.id)) {
              transactionRecords.push(record);
            }
          } catch (e) {
            // Skip records that can't be parsed
            continue;
          }
        }
      } catch (error) {
        console.error('Error during additional transaction lookup:', error);
      }
      
      // Sort by timestamp, newest first
      const sortedRecords = transactionRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`Found ${sortedRecords.length} transactions for product ${productId}`);
      return sortedRecords;
      
    } catch (error) {
      console.error(`Error in getProductTransactionHistory for product ${productId}:`, error);
      return [];
    }
  }

  /**
   * Retrieve transaction history for a specific user
   * @param userId ID of the user
   * @param limit Maximum number of transactions to return (optional)
   */
  static async getUserTransactionHistory(
    userId: string,
    limit?: number
  ): Promise<TransactionRecord[]> {
    try {
      if (!userId) {
        console.warn("getUserTransactionHistory called with empty userId");
        return [];
      }

      console.log(`Looking up transaction history for user: ${userId}`);
      
      // Use level-db's iterators to find keys starting with the user prefix
      const userPrefix = `user:${userId}:`;
      
      // Use alternative approach with prefix scanning that works with level-db
      const transactionIds: string[] = [];
      
      // Get all keys and filter those with our prefix
      try {
        const allKeys = await txhashDB.keys().all();
        // Filter keys with the user prefix
        const userKeys = allKeys.filter(key => key.startsWith(userPrefix));
        
        // Extract transaction IDs from the keys
        for (const key of userKeys) {
          const parts = key.split(':');
          if (parts.length >= 3) {
            transactionIds.push(parts[2]);
          }
        }
        
        console.log(`Found ${transactionIds.length} transaction IDs for user ${userId}`);
      } catch (error) {
        console.error(`Error scanning keys for user ${userId}:`, error);
        return [];
      }
      
      // Now get the actual transaction records
      const transactionRecords: TransactionRecord[] = [];
      
      for (const transactionId of transactionIds) {
        try {
          const recordKey = `transaction:${transactionId}`;
          const recordJson = await txhashDB.get(recordKey);
          
          if (recordJson) {
            const record = JSON.parse(recordJson);
            transactionRecords.push(record);
          }
        } catch (error) {
          console.error(`Error fetching transaction ${transactionId}:`, error);
        }
      }
      
      // Sort by timestamp, newest first
      const sortedRecords = transactionRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply limit if provided
      const limitedRecords = limit ? sortedRecords.slice(0, limit) : sortedRecords;
      
      console.log(`Found ${limitedRecords.length} transactions for user ${userId}`);
      return limitedRecords;
      
    } catch (error) {
      console.error(`Error in getUserTransactionHistory for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get all recalled products
   * @returns Array of transaction records for recalled products
   */
  static async getRecalledProducts(): Promise<TransactionRecord[]> {
    try {
      // Dapatkan semua kunci dari database blockchain
      const allKeys = await txhashDB.keys().all();
      
      // Filter kunci yang terkait dengan transaksi
      const transactionKeys = allKeys.filter(key => key.startsWith('transaction:'));
      
      // Ambil semua data transaksi
      const transactions: TransactionRecord[] = [];
      
      for (const key of transactionKeys) {
        try {
          const data = await txhashDB.get(key);
          const record = JSON.parse(data);
          
          // Pastikan data memiliki struktur yang benar
          if (record && 
              record.actionType === TransactionActionType.RECALL && 
              record.productStatus === ProductStatus.RECALLED) {
            transactions.push(record);
          }
        } catch (err) {
          console.error(`Error parsing transaction from key ${key}:`, err);
          // Lanjutkan ke transaksi berikutnya jika ada error dengan satu transaksi
        }
      }
      
      // Urutkan berdasarkan timestamp terbaru
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error fetching recalled products:", error);
      return [];
    }
  }

  /**
   * Get the latest status of a product
   * @param productId ID of the product
   * @returns The latest status record or null if not found
   */
  static async getLatestProductStatus(
    productId: string
  ): Promise<TransactionRecord | null> {
    try {
      // Get all transaction history for the product
      const history = await this.getProductTransactionHistory(productId);
      
      // Sort by timestamp in descending order to get the most recent first
      history.sort((a, b) => b.timestamp - a.timestamp);
      
      // Return the latest status or null if no history
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error("Error fetching latest product status:", error);
      return null;
    }
  }

  /**
   * Get a specific transaction by ID
   * @param transactionId ID of the transaction
   * @returns Transaction record or null if not found
   */
  static async getTransaction(
    transactionId: string
  ): Promise<TransactionRecord | null> {
    try {
      // Validate transaction ID parameter
      if (!transactionId) {
        console.error("Invalid transactionId parameter");
        return null;
      }

      try {
        // Try to get the transaction directly using its ID
        const transactionData = await txhashDB.get(`transaction:${transactionId}`);
        
        if (transactionData) {
          const record = JSON.parse(transactionData);
          return record as TransactionRecord;
        }
      } catch (err) {
        // If direct lookup fails, try searching through all transactions
        console.log(`Transaction not found directly with ID: ${transactionId}, performing search...`);
      }

      // If direct lookup fails, search through all transaction keys
      const allKeys = await txhashDB.keys().all();
      
      // Filter keys related to transactions
      const transactionKeys = allKeys.filter(key => 
        key.startsWith('transaction:')
      );
      
      for (const key of transactionKeys) {
        try {
          const data = await txhashDB.get(key);
          if (!data) continue;
          
          const record = JSON.parse(data);
          
          // Check if this is the transaction we're looking for
          if (record && record.id === transactionId) {
            return record as TransactionRecord;
          }
        } catch (err) {
          // Skip this record if there's an error
          continue;
        }
      }
      
      // If we get here, the transaction was not found
      console.log(`Transaction with ID ${transactionId} not found`);
      return null;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return null;
    }
  }

  /**
   * Get all transaction keys from the database
   * @returns Array of transaction keys
   */
  static async getAllTransactionKeys(): Promise<string[]> {
    try {
      const allKeys = await txhashDB.keys().all();
      return allKeys.filter(key => key.startsWith('transaction:'));
    } catch (error) {
      console.error("Error fetching transaction keys:", error);
      return [];
    }
  }
  
  /**
   * Get transactions from an array of keys
   * @param keys Array of transaction keys
   * @param limit Optional limit on number of results
   * @returns Array of transaction records
   */
  static async getTransactionsFromKeys(keys: string[], limit?: number): Promise<TransactionRecord[]> {
    try {
      const transactions: TransactionRecord[] = [];
      const processedIds = new Set<string>();
      
      for (const key of keys) {
        if (transactions.length >= (limit || Infinity)) {
          break;
        }
        
        try {
          if (!key.startsWith('transaction:')) continue;
          
          const data = await txhashDB.get(key);
          if (!data) continue;
          
          let record: any;
          try {
            // Cek apakah data sudah berbentuk objek atau masih string JSON
            record = typeof data === 'object' ? data : JSON.parse(data);
          } catch (parseErr) {
            console.error(`Error parsing JSON from key ${key}:`, parseErr);
            // Jika data bukan JSON valid, lewati record ini
            continue;
          }
          
          if (!record || !record.id || processedIds.has(record.id)) continue;
          
          processedIds.add(record.id);
          transactions.push(record as TransactionRecord);
        } catch (err) {
          console.error(`Error processing transaction key ${key}:`, err);
          continue;
        }
      }
      
      // Sort by timestamp, newest first
      return transactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error getting transactions from keys:", error);
      return [];
    }
  }
}

export { TransactionHistory, TransactionHistoryService, TransactionRecord };