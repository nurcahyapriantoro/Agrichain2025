enum MessageTypeEnum {
  HANDSHAKE = "TYPE_HANDSHAKE",
  CREATE_TRANSACTION = "TYPE_CREATE_TRANSACTION",
  PUBLISH_BLOCK = "TYPE_PUBLISH_BLOCK",
  REQUEST_BLOCK = "REQUEST_BLOCK",
  SEND_BLOCK = "SEND_BLOCK",
  START_MINING = "START_MINING",
  REQUEST_POOL = "REQUEST_POOL",
  SEND_POOL = "SEND_POOL",

  // DEPRECATED
  REQUEST_CHAIN = "TYPE_REQUEST_CHAIN",
  SEND_CHAIN = "TYPE_SEND_CHAIN",
}

enum TransactionTypeEnum {
  COIN_PURCHASE = "COIN_PURCHASE",
  MINING_REWARD = "MINING_REWARD",
  STAKE = "STAKE",
}

enum UserRole {
  FARMER = "FARMER",
  COLLECTOR = "COLLECTOR",
  TRADER = "TRADER",
  RETAILER = "RETAILER",
  CONSUMER = "CONSUMER",
  UNKNOWN = "UNKNOWN"
}

enum TransactionAction {
  ADD_PRODUCT = "ADD_PRODUCT",
  BUY_PRODUCT = "BUY_PRODUCT",
  SELL_PRODUCT = "SELL_PRODUCT",
  VIEW_HISTORY = "VIEW_HISTORY"
}

enum TransactionActionType {
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

enum ProductStatus {
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

enum RecallReason {
  QUALITY_ISSUE = "QUALITY_ISSUE",
  SAFETY_CONCERN = "SAFETY_CONCERN",
  CONTAMINATION = "CONTAMINATION",
  MISLABELING = "MISLABELING",
  PACKAGING_DEFECT = "PACKAGING_DEFECT",
  EXPIRED = "EXPIRED",
  REGULATORY_COMPLIANCE = "REGULATORY_COMPLIANCE",
  OTHER = "OTHER"
}

enum StockChangeReason {
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

const blockchainTransactions = Object.values(TransactionTypeEnum)

export { 
  MessageTypeEnum, 
  TransactionTypeEnum, 
  UserRole,
  TransactionAction,
  TransactionActionType,
  ProductStatus,
  RecallReason,
  StockChangeReason,
  blockchainTransactions 
}
