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
export const transferProduct = async (productId: string, toUserId: string): Promise<Product> => {
  return apiPost<Product>(`/product/transfer`, { 
    productId,
    toUserId,
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
  return apiGet<ProductListResponse>(`/product/owner/${ownerId}`, { page, limit });
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