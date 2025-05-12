import { apiGet, apiPost } from './client';
import { Transaction } from '../../types/transaction';
import { PaginatedResponse } from '../../types/common';

export interface TransactionListResponse extends PaginatedResponse<Transaction> {
  data: Transaction[];
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
        total: response.data.pagination?.totalItems || response.data.transactions.length,
        page: response.data.pagination?.currentPage || 1,
        limit: response.data.pagination?.limit || 10,
        totalPages: response.data.pagination?.totalPages || Math.ceil(response.data.transactions.length / 10)
      };
    }
  }

  // If response has transactions property directly
  if (response.transactions) {
    return {
      data: response.transactions,
      total: response.totalItems || response.transactions.length,
      page: response.currentPage || 1,
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
 * Get list of transactions with pagination
 */
export const getTransactions = async (page = 1, limit = 10, filters = {}): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet('/transactions', { page, limit, ...filters });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get transaction by ID
 */
export const getTransactionById = async (id: string): Promise<Transaction> => {
  return apiGet<Transaction>(`/transactions/${id}`);
};

/**
 * Get transactions for a specific product
 */
export const getProductTransactions = async (productId: string, page = 1, limit = 10): Promise<TransactionListResponse> => {
  try {
    const response = await apiGet(`/transactions/product/${productId}`, { page, limit });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching product transactions:', error);
    return normalizeResponse(null);
  }
};

/**
 * Create a new transaction
 */
export const createTransaction = async (data: {
  productId: string;
  toUserId: string;
}): Promise<Transaction> => {
  return apiPost<Transaction>('/transactions', data);
};

/**
 * Get my transactions (as seller or buyer)
 */
export const getMyTransactions = async (page = 1, limit = 10, role = 'all'): Promise<TransactionListResponse> => {
  try {
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
  return apiGet<{ verified: boolean; blockchainData?: any }>(`/transactions/${id}/verify`);
}; 