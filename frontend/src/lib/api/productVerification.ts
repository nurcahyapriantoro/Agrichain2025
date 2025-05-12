import { apiGet, apiPost } from './client';

/**
 * Types for product verification
 */
export interface VerificationRequest {
  productId: string;
  qualityScore: number;
  comments?: string;
  evidence?: string[];
  certifications?: string[];
  verifierRole?: string;
}

export interface VerificationResponse {
  success: boolean;
  data: {
    verificationId: string;
    productId: string;
    qualityScore: number;
    timestamp: number;
    verifiedBy: string;
    status: string;
  };
  message?: string;
}

/**
 * Verify product quality
 * This endpoint is accessible by all user roles (except farmer)
 */
export const verifyProductQuality = async (
  productId: string, 
  verificationData: {
    qualityScore: number;
    comments?: string;
    certifications?: string[];
  }
): Promise<any> => {
  return apiPost(`/product/verify`, {
    productId,
    ...verificationData
  });
};

/**
 * Get verification history for a product
 */
export const getProductVerificationHistory = async (productId: string): Promise<any> => {
  return apiGet(`/product/${productId}/verifications`);
};

/**
 * Get verification details
 */
export const getVerificationDetails = async (verificationId: string): Promise<any> => {
  return apiGet(`/product/verification/${verificationId}`);
};

export default {
  verifyProductQuality,
  getProductVerificationHistory,
  getVerificationDetails
}; 