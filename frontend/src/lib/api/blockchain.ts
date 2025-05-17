import { apiGet, apiPost } from './client';
import { PaginatedResponse } from '../../types/common';
import axios from 'axios';

// Types
export interface Block {
  hash: string;
  lastHash?: string;
  previousHash?: string;
  height?: number;
  number?: number;
  timestamp: number | string;
  nonce?: number;
  difficulty?: number;
  data?: any[];
  transactions?: any[];
  miner?: string;
  createdBy?: string;
  transactionCount?: number;
  size?: number;
}

export interface Transaction {
  id?: string;
  hash?: string;
  transactionHash?: string;
  from: string;
  to: string;
  timestamp: number | string;
  data?: any;
  signature?: string;
  blockHeight?: number;
  blockHash?: string;
  blockchain?: {
    blockHeight: number;
    blockHash: string;
    timestamp: number | string;
    transactionHash: string;
  };
}

export interface BlockchainState {
  totalBlocks: number;
  totalTransactions: number;
}

export interface BlockchainStats {
  latestBlock: Block;
  stats: {
    blockHeight: number;
    totalBlocks: number;
    totalTransactions: number;
    lastBlockTime: string;
  };
}

export interface MiningStatus {
  pendingTransactions: number;
  miningEnabled: boolean;
  lastMiningTime: string;
}

export interface BlockListResponse extends PaginatedResponse<Block> {
  data: Block[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionListResponse extends PaginatedResponse<Transaction> {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BlockDetailResponse {
  block: Block;
  transactions: Transaction[];
}

export interface TransactionDetailResponse {
  transaction: Transaction;
  block?: Block;
}

export interface ProductHistoryResponse {
  productId: string;
  transactions: Transaction[];
}

export interface SearchResponse {
  type: 'block' | 'transaction' | 'product' | 'user';
  result: Block | Transaction;
  productId?: string;
  userId?: string;
  transactions?: Transaction[];
}

const normalizeBlockListResponse = (response: any): BlockListResponse => {
  // Handle different response formats and normalize them
  if (!response) {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    };
  }

  // If response is an array, wrap it in our standard format
  if (Array.isArray(response)) {
    return {
      data: response,
      total: response.length,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(response.length / 10)
    };
  }

  // If response has data property, extract it
  if (response.data) {
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.total || response.data.length,
        page: response.page || 1,
        limit: response.limit || 10,
        totalPages: response.totalPages || Math.ceil(response.data.length / (response.limit || 10))
      };
    }
    if (response.data.blocks) {
      return {
        data: response.data.blocks,
        total: response.data.pagination?.total || response.data.blocks.length,
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        totalPages: response.data.pagination?.totalPages || Math.ceil(response.data.blocks.length / 10)
      };
    }
  }

  // If response has blocks property directly
  if (response.blocks) {
    return {
      data: response.blocks,
      total: response.totalItems || response.blocks.length,
      page: response.currentPage || 1,
      limit: response.limit || 10,
      totalPages: response.totalPages || Math.ceil(response.blocks.length / 10)
    };
  }

  // Return empty response if no valid format is found
  return {
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  };
};

/**
 * ===== BAGIAN 1: OPERASI BLOCKCHAIN UTAMA =====
 */

/**
 * Get blockchain status including total blocks and transactions
 */
export const getBlockchainStatus = async (): Promise<BlockchainState | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: BlockchainState }>('/blockchain/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching blockchain status:', error);
    return null;
  }
};

/**
 * Get detailed blockchain statistics
 */
export const getBlockchainStats = async (): Promise<BlockchainStats | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: BlockchainStats }>('/blockchain/stats');
    
    // Debug logging to see the exact response structure
    console.log('Blockchain stats API response:', JSON.stringify(response));
    
    // Check if the latestBlock has transaction data in different formats
    if (response?.data?.latestBlock) {
      const block = response.data.latestBlock;
      console.log('Latest block transaction info:', {
        hasTransactions: !!block.transactions,
        transactionCount: block.transactionCount,
        dataFieldHasTransactions: Array.isArray(block.data) && block.data.length > 0
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    return null;
  }
};

/**
 * Get mining status and pending transactions
 */
export const getMiningStatus = async (): Promise<MiningStatus | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: MiningStatus }>('/blockchain/mining/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching mining status:', error);
    return null;
  }
};

/**
 * Trigger manual mining process
 */
export const triggerManualMining = async (): Promise<{ success: boolean; message: string } | null> => {
  try {
    const response = await apiPost<{ success: boolean; message: string }>('/blockchain/mining/trigger', {});
    return response;
  } catch (error) {
    console.error('Error triggering manual mining:', error);
    return null;
  }
};

/**
 * Get the last block in the blockchain
 */
export const getLastBlock = async (): Promise<Block | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: { block: Block } }>('/blockchain/last-block');
    return response.data.block;
  } catch (error) {
    console.error('Error fetching last block:', error);
    return null;
  }
};

/**
 * ===== BAGIAN 2: OPERASI BLOK =====
 */

/**
 * Get list of blocks with pagination
 */
export const getBlocks = async (page = 1, limit = 10): Promise<BlockListResponse> => {
  try {
    const response = await apiGet('/blockchain/blocks', { page, limit });
    return normalizeBlockListResponse(response);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return normalizeBlockListResponse(null);
  }
};

/**
 * Get block details by ID (hash or height)
 */
export const getBlockById = async (blockId: string | number): Promise<BlockDetailResponse | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: BlockDetailResponse }>(`/blockchain/blocks/${blockId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching block details:', error);
    return null;
  }
};

/**
 * Get block by hash
 */
export const getBlockByHash = async (hash: string): Promise<Block | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: BlockDetailResponse }>(`/blockchain/blocks/${hash}`);
    return response.data?.block || null;
  } catch (error) {
    console.error('Error fetching block by hash:', error);
    return null;
  }
};

/**
 * Get block by height
 */
export const getBlockByHeight = async (height: number): Promise<Block | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: BlockDetailResponse }>(`/blockchain/blocks/${height}`);
    return response.data?.block || null;
  } catch (error) {
    console.error('Error fetching block by height:', error);
    return null;
  }
};

/**
 * Get block with query parameters (legacy)
 */
export const getBlockByQuery = async (params: { hash?: string; number?: string }): Promise<Block | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: { block: Block } }>('/blockchain/block', params);
    return response.data.block;
  } catch (error) {
    console.error('Error fetching block by query:', error);
    return null;
  }
};

/**
 * Get transactions in a block (legacy)
 */
export const getBlockTransactions = async (params: { hash?: string; number?: string }): Promise<any[] | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: { block: { data: any[] } } }>('/blockchain/block/transactions', params);
    return response.data.block.data;
  } catch (error) {
    console.error('Error fetching block transactions:', error);
    return null;
  }
};

/**
 * ===== BAGIAN 3: OPERASI TRANSAKSI =====
 */

/**
 * Get transaction details by ID
 */
export const getTransactionById = async (txId: string): Promise<TransactionDetailResponse | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: TransactionDetailResponse }>(`/blockchain/transactions/${txId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction by ID:', error);
    return null;
  }
};

/**
 * Get transaction details by hash
 */
export const getTransactionByHash = async (hash: string): Promise<TransactionDetailResponse | null> => {
  try {
    // Validate the hash format before making the request
    const txHashRegex = /^txn-\d+-[a-z0-9]+$/;
    if (!txHashRegex.test(hash)) {
      console.error('Invalid transaction hash format:', hash);
      console.error('Expected format: txn-timestamp-string (e.g., txn-1234567890-abc123)');
      return null;
    }

    console.log(`Making request to /blockchain/transaction/${hash}`);
    const response = await apiGet<{ success: boolean; data: TransactionDetailResponse }>(`/blockchain/transaction/${hash}`);
    console.log('Response received:', response);
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction by hash:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // If it's a 400 error, it's likely due to invalid format
      if (error.response.status === 400) {
        console.error('This is likely due to an invalid transaction hash format');
        console.error('Hash should match pattern: txn-timestamp-string');
      }
    }
    return null;
  }
};

/**
 * Get product transaction history
 */
export const getProductHistory = async (productId: string): Promise<ProductHistoryResponse | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: ProductHistoryResponse }>(`/blockchain/product/${productId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product history:', error);
    return null;
  }
};

/**
 * ===== BAGIAN 4: PENCARIAN BLOCKCHAIN =====
 */

/**
 * Search blockchain by various criteria
 */
export const searchBlockchain = async (term: string): Promise<SearchResponse | null> => {
  try {
    const response = await apiGet<{ success: boolean; data: SearchResponse }>('/blockchain/search', { term });
    return response.data;
  } catch (error) {
    console.error('Error searching blockchain:', error);
    return null;
  }
};

// Export a consolidated API for easy access
export const blockchainAPI = {
  // Blockchain main operations
  getBlockchainStatus,
  getBlockchainStats,
  getMiningStatus,
  triggerManualMining,
  getLastBlock,
  
  // Block operations
  getBlocks,
  getBlockById,
  getBlockByHash,
  getBlockByHeight,
  getBlockByQuery,
  getBlockTransactions,
  
  // Transaction operations
  getTransactionById,
  getTransactionByHash,
  getProductHistory,
  
  // Search operations
  searchBlockchain
}; 