export enum ProductStatus {
  CREATED = "CREATED",
  TRANSFERRED = "TRANSFERRED",
  RECEIVED = "RECEIVED",
  VERIFIED = "VERIFIED",
}

export interface Product {
  id: string;
  name: string;
  description: string;
  ownerId?: string;
  ownerName?: string;
  price: number;
  quantity: number;
  images?: string[];
  category?: string;
  unit?: string;
  location?: string;
  productionDate?: string | number;
  expiryDate?: string | number;
  qualityScore?: number;
  status: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  blockchain?: {
    blockHash?: string;
    transactionHash?: string;
    timestamp?: number;
  };
}