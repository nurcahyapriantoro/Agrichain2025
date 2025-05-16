import type { Request, Response } from "express";
import { txhashDB } from "../../helper/level.db.client";

/**
 * Get latest blockchain blocks
 */
export const getLatestBlocks = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Get all block keys
    const allKeys = await txhashDB.keys().all();
    const blockKeys = allKeys.filter(key => key.toString().startsWith('blockchain:block:'));
    
    // Sort by block height (newest first)
    const sortedKeys = blockKeys
      .map(key => {
        const blockHeight = parseInt(key.toString().split(':')[2]);
        return { key, blockHeight };
      })
      .sort((a, b) => b.blockHeight - a.blockHeight);
    
    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedKeys = sortedKeys.slice(start, end);
    
    // Get block data for each key
    const blocks = [];
    for (const { key } of paginatedKeys) {
      const blockData = await txhashDB.get(key.toString());
      if (blockData) {
        blocks.push(JSON.parse(blockData));
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        blocks,
        pagination: {
          total: sortedKeys.length,
          page,
          limit,
          totalPages: Math.ceil(sortedKeys.length / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getLatestBlocks:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching blockchain blocks"
    });
  }
};

/**
 * Get block details by height or hash
 */
export const getBlockDetails = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: identifier (block height or hash)"
      });
    }
    
    let blockData;
    
    // Check if identifier is a number (block height)
    if (/^\d+$/.test(identifier)) {
      const blockHeight = parseInt(identifier);
      blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null);
    } else {
      // Assume identifier is a hash
      blockData = await txhashDB.get(`blockchain:hash:${identifier}`).catch(() => null);
    }
    
    if (!blockData) {
      return res.status(404).json({
        success: false,
        message: `Block with identifier ${identifier} not found`
      });
    }
    
    const block = JSON.parse(blockData);
    
    // Get transactions in the block
    const transactions = [];
    for (const txId of block.transactions) {
      const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null);
      if (txData) {
        transactions.push(JSON.parse(txData));
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        block,
        transactions
      }
    });
  } catch (error) {
    console.error("Error in getBlockDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching block details"
    });
  }
};

/**
 * Get transaction details by hash
 */
export const getTransactionByHash = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: transaction hash"
      });
    }
    
    // Search for transaction with matching hash
    const allKeys = await txhashDB.keys().all();
    const transactionKeys = allKeys.filter(key => key.toString().startsWith('transaction:'));
    
    // For each key, check if the transaction has the matching hash
    let matchingTransaction = null;
    for (const key of transactionKeys) {
      const txData = await txhashDB.get(key.toString());
      if (txData) {
        try {
          const tx = JSON.parse(txData);
          if (tx.blockchain && tx.blockchain.transactionHash === hash) {
            matchingTransaction = tx;
            break;
          }
        } catch (e) {
          console.warn(`Failed to parse transaction data for ${key}:`, e);
        }
      }
    }
    
    if (!matchingTransaction) {
      return res.status(404).json({
        success: false,
        message: `Transaction with hash ${hash} not found`
      });
    }
    
    // Get block data
    const blockHeight = matchingTransaction.blockchain.blockHeight;
    const blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null);
    const blockInfo = blockData ? JSON.parse(blockData) : null;
    
    return res.status(200).json({
      success: true,
      data: {
        transaction: matchingTransaction,
        block: blockInfo
      }
    });
  } catch (error) {
    console.error("Error in getTransactionByHash:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching transaction details"
    });
  }
};

/**
 * Get blockchain statistics
 */
export const getBlockchainStats = async (req: Request, res: Response) => {
  try {
    // Get latest block
    const latestBlockData = await txhashDB.get('blockchain:latest').catch(() => null);
    const latestBlock = latestBlockData ? JSON.parse(latestBlockData) : null;
    
    // Count total transactions
    const allKeys = await txhashDB.keys().all();
    const transactionKeys = allKeys.filter(
      key => key.toString().startsWith('transaction:') && !key.toString().includes(':transaction:')
    );
    
    // Count total blocks
    const blockKeys = allKeys.filter(
      key => key.toString().startsWith('blockchain:block:')
    );
    
    return res.status(200).json({
      success: true,
      data: {
        latestBlock,
        stats: {
          blockHeight: latestBlock ? latestBlock.height : 0,
          totalBlocks: blockKeys.length,
          totalTransactions: transactionKeys.length,
          lastBlockTime: latestBlock ? new Date(latestBlock.timestamp).toISOString() : null
        }
      }
    });
  } catch (error) {
    console.error("Error in getBlockchainStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching blockchain statistics"
    });
  }
};

/**
 * Search the blockchain by different criteria
 */
export const searchBlockchain = async (req: Request, res: Response) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameter: search term"
      });
    }
    
    const searchTerm = term.toString();
    
    // Check if search term is a block height
    if (/^\d+$/.test(searchTerm)) {
      const blockHeight = parseInt(searchTerm);
      const blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null);
      
      if (blockData) {
        return res.status(200).json({
          success: true,
          data: {
            type: 'block',
            result: JSON.parse(blockData)
          }
        });
      }
    }
    
    // Check for block hash match
    const blockByHashData = await txhashDB.get(`blockchain:hash:${searchTerm}`).catch(() => null);
    if (blockByHashData) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'block',
          result: JSON.parse(blockByHashData)
        }
      });
    }
    
    // Check for transaction ID match
    const txData = await txhashDB.get(`transaction:${searchTerm}`).catch(() => null);
    if (txData) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'transaction',
          result: JSON.parse(txData)
        }
      });
    }
    
    // Check for transaction hash match
    // This is more expensive as we need to scan all transactions
    const allKeys = await txhashDB.keys().all();
    const allTxKeys = allKeys.filter(
      key => key.toString().startsWith('transaction:') && !key.toString().includes(':transaction:')
    );
    
    for (const key of allTxKeys) {
      const txData = await txhashDB.get(key.toString());
      if (txData) {
        try {
          const tx = JSON.parse(txData);
          if (tx.blockchain && tx.blockchain.transactionHash === searchTerm) {
            return res.status(200).json({
              success: true,
              data: {
                type: 'transaction',
                result: tx
              }
            });
          }
        } catch (e) {
          console.warn(`Failed to parse transaction data for ${key}:`, e);
        }
      }
    }
    
    // Check for product ID
    if (searchTerm.startsWith('prod-')) {
      const allKeys = await txhashDB.keys().all();
      const productTxKeys = allKeys.filter(
        key => key.toString().startsWith(`product:${searchTerm}:transaction:`)
      );
      
      if (productTxKeys.length > 0) {
        const transactions = [];
        for (const key of productTxKeys) {
          const txId = key.toString().split(':')[3];
          const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null);
          if (txData) {
            transactions.push(JSON.parse(txData));
          }
        }
        
        return res.status(200).json({
          success: true,
          data: {
            type: 'product',
            productId: searchTerm,
            transactions
          }
        });
      }
    }
    
    // Check for user ID
    const allUserKeys = await txhashDB.keys().all();
    const userTxKeys = allUserKeys.filter(
      key => key.toString().startsWith(`user:${searchTerm}:transaction:`)
    );
    
    if (userTxKeys.length > 0) {
      const transactions = [];
      for (const key of userTxKeys) {
        const txId = key.toString().split(':')[3];
        const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null);
        if (txData) {
          transactions.push(JSON.parse(txData));
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          type: 'user',
          userId: searchTerm,
          transactions
        }
      });
    }
    
    return res.status(404).json({
      success: false,
      message: `No results found for search term: ${searchTerm}`
    });
  } catch (error) {
    console.error("Error in searchBlockchain:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while searching the blockchain"
    });
  }
}; 