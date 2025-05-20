import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Product } from '../../types/product';
import { PaginatedResponse } from '../../types/common';

export interface ProductListResponse extends PaginatedResponse<Product> {
  products: Product[];
}

/**
 * Get list of products with pagination
 */
export const getProducts = async (page = 1, limit = 10, filters = {}): Promise<ProductListResponse> => {
  return apiGet<ProductListResponse>('/product', { page, limit, ...filters });
};

/**
 * Get product by ID
 */
export const getProductById = async (id: string): Promise<Product> => {
  return apiGet<Product>(`/product/${id}`);
};

/**
 * Create new product
 */
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
  return apiPost<Product>('/product', productData);
};

/**
 * Update existing product
 */
export const updateProduct = async (id: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
  return apiPut<Product>(`/product/${id}`, productData);
};

/**
 * Delete product
 */
export const deleteProduct = async (id: string): Promise<{ success: boolean }> => {
  return apiDelete<{ success: boolean }>(`/product/${id}`);
};

/**
 * Track product
 */
export const trackProduct = async (id: string): Promise<{ history: any[] }> => {
  return apiGet<{ history: any[] }>(`/product/${id}/track`);
};

/**
 * Transfer product ownership
 */
export const transferProduct = async (productId: string, toUserId: string, fromUserId: string, role: string): Promise<Product> => {
  return apiPost<Product>(`/product/transfer`, { 
    productId,
    fromUserId,
    toUserId,
    role,
    details: {
      location: "Product Transfer Location",
      transferMethod: "Direct transfer",
      notes: "Product transfer",
      transferDate: new Date().toISOString().split('T')[0]
    },
    quantity: 1,
    actionType: "TRANSFER"
  });
};

/**
 * Get products owned by current user
 */
export const getMyProducts = async (page = 1, limit = 10): Promise<ProductListResponse> => {
  return apiGet<ProductListResponse>('/product/my', { page, limit });
};

/**
 * Get products by owner ID
 */
export const getProductsByOwner = async (ownerId: string, page = 1, limit = 100): Promise<ProductListResponse> => {
  try {
    const response = await apiGet<any>(`/product/owner/${ownerId}`, { page, limit });
    
    // Debug the response
    console.log('Raw API response from getProductsByOwner:', response);
    
    // Check different response formats and normalize
    if (response?.data?.products) {
      // Response has nested data structure
      return {
        products: response.data.products,
        count: response.data.count || response.data.products.length,
        page,
        limit,
        totalPages: Math.ceil((response.data.count || response.data.products.length) / limit)
      };
    } else if (response?.products) {
      // Response has products directly
      return response;
    } else {
      // Default empty response
      console.warn('Unexpected response format:', response);
      return {
        products: [],
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  } catch (error) {
    console.error('Error in getProductsByOwner:', error);
    // Return empty result on error
    return {
      products: [],
      count: 0,
      page,
      limit,
      totalPages: 0
    };
  }
};

/**
 * Verify product quality (accessible by all roles)
 */
export const verifyProductQuality = async (
  productId: string, 
  verificationData: {
    qualityScore: number;
    comments?: string;
    certifications?: string[];
  }
): Promise<any> => {
  return apiPost<any>(`/product/verify`, {
    productId,
    ...verificationData
  });
}; 