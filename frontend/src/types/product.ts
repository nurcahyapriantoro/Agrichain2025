export enum ProductStatus {
  CREATED = "CREATED",
  TRANSFERRED = "TRANSFERRED",
  PACKAGED = "PACKAGED",
  SHIPPED = "SHIPPED",
  RECEIVED = "RECEIVED",
  SOLD = "SOLD",
  DISCARDED = "DISCARDED",
  RECALLED = "RECALLED",
  EXPIRED = "EXPIRED",
  DEFECTIVE = "DEFECTIVE",
  VERIFIED = "VERIFIED",
  VERIFICATION_FAILED = "VERIFICATION_FAILED",
  IN_STOCK = "IN_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  LOW_STOCK = "LOW_STOCK"
}

export interface Product {
  id: string;
  name: string;
  description: string;
  owner: string;
  ownerId?: string;
  farmerId?: string;
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
  status: string; // Made this required to match backend
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  blockchain?: {
    blockHash?: string;
    transactionHash?: string;
    timestamp?: number;
  };
}

export enum StockChangeReason {
  INITIAL_STOCK = "INITIAL_STOCK",
  PURCHASE = "PURCHASE",
  SALE = "SALE",
  TRANSFER_IN = "TRANSFER_IN",
  TRANSFER_OUT = "TRANSFER_OUT",
  DAMAGE = "DAMAGE",
  LOSS = "LOSS",
  RETURN = "RETURN",
  ADJUSTMENT = "ADJUSTMENT",
  EXPIRED = "EXPIRED",
  RECALL = "RECALL"
} 