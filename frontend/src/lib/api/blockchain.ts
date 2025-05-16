import { apiGet } from './client';
import { Block } from '@/lib/types';
import { PaginatedResponse } from '../../types/common';

export interface BlockListResponse extends PaginatedResponse<Block> {
  data: Block[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const normalizeResponse = (response: any): BlockListResponse => {
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
        total: response.data.pagination?.totalItems || response.data.blocks.length,
        page: response.data.pagination?.currentPage || 1,
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
 * Get list of blocks with pagination
 */
export const getBlocks = async (page = 1, limit = 10): Promise<BlockListResponse> => {
  try {
    const response = await apiGet('/blockchain/blocks', { page, limit });
    return normalizeResponse(response);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return normalizeResponse(null);
  }
};

/**
 * Get block by hash
 */
export const getBlockByHash = async (hash: string): Promise<Block | null> => {
  try {
    return await apiGet<Block>(`/blockchain/blocks/hash/${hash}`);
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
    return await apiGet<Block>(`/blockchain/blocks/height/${height}`);
  } catch (error) {
    console.error('Error fetching block by height:', error);
    return null;
  }
}; 