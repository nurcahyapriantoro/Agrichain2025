import { UserRole, TransactionActionType, ProductStatus, RecallReason, StockChangeReason } from "../enum";
import { txhashDB } from "../helper/level.db.client";
import { BlockchainData, TransactionHistory as TransactionHistoryType } from "../types";
import crypto from "crypto";

/**
 * Interface for a transaction history record
 */
export interface TransactionRecord {
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
  blockchain?: BlockchainData; // Blockchain details including block height, hash, etc.
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  return `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Class for recording and tracking product transaction history
 */
export class TransactionHistory {
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
export class TransactionHistoryService {
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
  ): Promise<{ success: boolean; transactionId?: string; message?: string; blockchainData?: BlockchainData }> {
    const history = new TransactionHistory(
      productId,
      farmerId, // from is the farmer
      farmerId, // to is also the farmer (initial owner)
      TransactionActionType.CREATE,
      ProductStatus.CREATED,
      details
    );

    const result = await history.recordTransaction(UserRole.FARMER, UserRole.FARMER);
    
    // Add blockchain details
    if (result.success && result.transactionId) {
      // Generate blockchain data
      const blockHeight = await TransactionHistoryService.getCurrentBlockHeight() + 1;
      const blockHash = TransactionHistoryService.generateBlockHash(blockHeight, { 
        id: result.transactionId,
        productId,
        fromUserId: farmerId,
        toUserId: farmerId,
        timestamp: Date.now() 
      });
      const transactionHash = TransactionHistoryService.generateTransactionHash({ 
        id: result.transactionId,
        productId,
        fromUserId: farmerId,
        toUserId: farmerId,
        timestamp: Date.now() 
      });
      
      // Update the transaction with blockchain details
      await TransactionHistory.setBlockchainDetails(
        result.transactionId,
        blockHash,
        transactionHash
      );
      
      // Return blockchain details with the result
      return {
        ...result,
        blockchainData: {
          blockHeight,
          blockHash,
          transactionHash,
          timestamp: Date.now(),
          validator: 'agrichain-node-1'
        }
      };
    }
    
    return result;
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
  ): Promise<{ success: boolean; transactionId?: string; message?: string; blockchainData?: BlockchainData }> {
    const history = new TransactionHistory(
      productId,
      fromUserId,
      toUserId,
      TransactionActionType.TRANSFER,
      ProductStatus.TRANSFERRED,
      details
    );

    const result = await history.recordTransaction(fromRole, toRole);
    
    // Add blockchain details
    if (result.success && result.transactionId) {
      // Generate blockchain data
      const blockHeight = await TransactionHistoryService.getCurrentBlockHeight() + 1;
      const blockHash = TransactionHistoryService.generateBlockHash(blockHeight, { 
        id: result.transactionId,
        productId,
        fromUserId,
        toUserId,
        timestamp: Date.now() 
      });
      const transactionHash = TransactionHistoryService.generateTransactionHash({ 
        id: result.transactionId,
        productId,
        fromUserId,
        toUserId,
        timestamp: Date.now() 
      });
      
      // Update the transaction with blockchain details
      await TransactionHistory.setBlockchainDetails(
        result.transactionId,
        blockHash,
        transactionHash
      );
      
      // Return blockchain details with the result
      return {
        ...result,
        blockchainData: {
          blockHeight,
          blockHash,
          transactionHash,
          timestamp: Date.now(),
          validator: 'agrichain-node-1'
        }
      };
    }
    
    return result;
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
   * Get current blockchain height
   * @returns Current block height
   */
  static async getCurrentBlockHeight(): Promise<number> {
    try {
      const latestBlockData = await txhashDB.get('blockchain:latest').catch(() => null);
      
      if (latestBlockData) {
        try {
          const blockData = JSON.parse(latestBlockData);
          return blockData.height || 0;
        } catch {
          return 0;
        }
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting blockchain height:', error);
      return 0;
    }
  }
  
  /**
   * Generate a block hash based on block height and transaction data
   * @param blockHeight Block height
   * @param transaction Transaction data
   * @returns Block hash
   */
  static generateBlockHash(blockHeight: number, transaction: any): string {
    const timestamp = Date.now();
    const data = JSON.stringify({
      height: blockHeight,
      timestamp,
      transactions: [transaction.id],
      previousHash: blockHeight > 1 ? `block-${blockHeight-1}` : '0000000000000000000000000000000000000000000000000000000000000000'
    });
    
    // In a real blockchain, this would be a cryptographic hash
    // For this example, we'll use a simplified hash method
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash;
  }
  
  /**
   * Generate a transaction hash based on transaction data
   * @param transaction Transaction data
   * @returns Transaction hash
   */
  static generateTransactionHash(transaction: any): string {
    const data = JSON.stringify({
      id: transaction.id,
      timestamp: transaction.timestamp,
      productId: transaction.productId,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      actionType: transaction.actionType,
      details: transaction.details
    });
    
    // In a real blockchain, this would be a cryptographic hash
    // For this example, we'll use a simplified hash method
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return hash;
  }
  
  /**
   * Update the latest block record
   * @param blockHeight Block height
   * @param blockHash Block hash
   * @param transactionId Transaction ID included in the block
   */
  static async updateLatestBlock(blockHeight: number, blockHash: string, transactionId: string): Promise<void> {
    const blockData = {
      height: blockHeight,
      hash: blockHash,
      timestamp: Date.now(),
      transactions: [transactionId]
    };
    
    // Save the latest block data
    await txhashDB.put('blockchain:latest', JSON.stringify(blockData));
    
    // Save the block by height
    await txhashDB.put(`blockchain:block:${blockHeight}`, JSON.stringify(blockData));
    
    // Save the block by hash
    await txhashDB.put(`blockchain:hash:${blockHash}`, JSON.stringify(blockData));
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
}