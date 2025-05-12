export enum TransactionAction {
  CREATE = "CREATE",
  TRANSFER = "TRANSFER",
  UPDATE = "UPDATE",
  VIEW = "VIEW"
}

export enum TransactionActionType {
  CREATE = "CREATE",
  TRANSFER = "TRANSFER",
  UPDATE = "UPDATE",
  UPDATE_STATUS = "UPDATE_STATUS",
  INSPECT = "INSPECT",
  PACKAGE = "PACKAGE",
  SHIP = "SHIP",
  RECEIVE = "RECEIVE",
  SELL = "SELL",
  DISCARD = "DISCARD",
  RECALL = "RECALL",
  VERIFY = "VERIFY",
  STOCK_IN = "STOCK_IN",
  STOCK_OUT = "STOCK_OUT",
  STOCK_ADJUST = "STOCK_ADJUST",
  STOCK_ADD = "STOCK_ADD",
  STOCK_REMOVE = "STOCK_REMOVE",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT"
}

export enum ActionReason {
  QUALITY_ISSUE = "QUALITY_ISSUE",
  SAFETY_CONCERN = "SAFETY_CONCERN",
  CONTAMINATION = "CONTAMINATION",
  MISLABELING = "MISLABELING",
  PACKAGING_DEFECT = "PACKAGING_DEFECT",
  EXPIRED = "EXPIRED",
  REGULATORY_COMPLIANCE = "REGULATORY_COMPLIANCE",
  TRANSFER_OWNERSHIP = "TRANSFER_OWNERSHIP",
  STOCK_UPDATE = "STOCK_UPDATE",
  RETURN = "RETURN", 
  OTHER = "OTHER"
}

export interface Transaction {
  id?: string;
  transactionId?: string;
  productId: string;
  productName?: string;
  product?: {
    name?: string;
    id?: string;
    unit?: string;
    price?: number;
  };
  fromUser?: string;
  fromUserName?: string;
  toUser?: string;
  toUserName?: string;
  sender?: string;
  recipient?: string;
  senderId?: string;
  recipientId?: string;
  quantity?: number;
  amount?: number;
  price?: number;
  total?: number;
  timestamp: number;
  createdAt?: number;
  updatedAt?: number;
  createdBy?: string;
  type?: string;
  status?: string;
  actionType?: string;
  actionReason?: string; 
  unit?: string;
  metadata?: Record<string, any>;
  blockchain?: {
    blockHash?: string;
    transactionHash?: string;
    timestamp?: number;
    validator?: string;
  };
} 