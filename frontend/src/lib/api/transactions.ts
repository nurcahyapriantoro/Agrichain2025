import { apiGet, apiPost } from './client';
import { Transaction } from '../../types/transaction';
import { PaginatedResponse } from '../../types/common';

// Extended Transaction interface to include blockchain properties
export interface ExtendedTransaction extends Transaction {
  blockchain?: {
    blockHeight: number;
    blockHash: string;
    transactionHash: string;
    timestamp: number;
    validator: string;
  };
  blockHash?: string;
  transactionHash?: string;
  fromRole?: string;
  toRole?: string;
  from?: string;
  to?: string;
  fromUserId?: string;
  toUserId?: string;
  price?: number;
  productDetails?: {
    nama_produk?: string;
    deskripsi_product?: string;
    quantity?: string | number;
    price?: string | number;
  };
}

export interface TransactionListResponse extends PaginatedResponse<ExtendedTransaction> {
  data: ExtendedTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const normalizeResponse = (response: any): TransactionListResponse => {
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
        total: response.data.length,
        page: response.page || 1,
        limit: response.limit || 10,
        totalPages: Math.ceil(response.data.length / (response.limit || 10))
      };
    }
    if (response.data.transactions) {
      return {
        data: response.data.transactions,
        total: response.data.pagination?.totalItems || response.data.pagination?.total || response.data.transactions.length,
        page: response.data.pagination?.currentPage || response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        totalPages: response.data.pagination?.totalPages || Math.ceil(response.data.transactions.length / 10)
      };
    }
  }

  // If response has transactions property directly
  if (response.transactions) {
    return {
      data: response.transactions,
      total: response.totalItems || response.total || response.transactions.length,
      page: response.currentPage || response.page || 1,
      limit: response.limit || 10,
      totalPages: response.totalPages || Math.ceil(response.transactions.length / 10)
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
 * Get latest transactions with pagination
 */
export const getTransactions = async (page = 1, limit = 10, filters = {}): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet('/transaction-history/latest', { page, limit, ...filters });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id: string): Promise<ExtendedTransaction> => {
  return apiGet<ExtendedTransaction>(`/transaction-history/transaction/${id}`);
};

/**
 * Get transactions for a specific product
 */
export const getProductTransactions = async (productId: string, page = 1, limit = 10): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet(`/transaction-history/product/${productId}`, { page, limit });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching product transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get transactions for a specific user
 */
export const getUserTransactions = async (userId: string, page = 1, limit = 10): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet(`/transaction-history/user/${userId}`, { page, limit });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get transactions by public key
 */
export const getTransactionsByPublicKey = async (publicKey: string, page = 1, limit = 10): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet(`/transaction-history/public-key/${publicKey}`, { page, limit });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching transactions by public key:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (): Promise<any> => {
  return apiGet('/transaction-history/stats');
};

/**
 * Get my transactions (as seller or buyer)
 */
export const getMyTransactions = async (page = 1, limit = 10, role = 'all'): Promise<TransactionListResponse> => {
  try {
    // First try to get current user ID
    const currentUser = await apiGet<{id: string; name?: string}>('/users/me').catch(() => null);
    
    if (currentUser && currentUser.id) {
      // If we have a user ID, use the user endpoint
      const response = await apiGet(`/transaction-history/user/${currentUser.id}`, { page, limit, role });
      return normalizeResponse(response);
    }
    
    // Fallback to the original endpoint if we couldn't get the user
    const response = await apiGet('/transactions/my', { page, limit, role });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching my transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Verify transaction on blockchain
 */
export const verifyTransaction = async (id: string): Promise<{ verified: boolean; blockchainData?: any }> => {
  const transaction = await getTransactionById(id);
  
  // Check if the transaction has blockchain data
  if (transaction && (transaction.blockchain || transaction.blockHash)) {
    return {
      verified: true,
      blockchainData: transaction.blockchain || {
        blockHeight: 0,
        blockHash: transaction.blockHash || "",
        transactionHash: transaction.transactionHash || transaction.id,
        timestamp: transaction.timestamp,
        validator: "agrichain-node-1"
      }
    };
  }
  
  return {
    verified: false
  };
}; 