export interface Block {
  hash: string;
  timestamp: number | string; // Allow both timestamp formats
  lastHash?: string; // Make optional to support both formats
  previousHash?: string; // Alternative field name in the API
  data?: any[]; // Make optional to support both formats
  transactions?: any[]; // Alternative field name in the API
  nonce?: number; // Make optional to support both formats
  difficulty?: number; // Make optional to support both formats
  miner?: string;
  height?: number; // Block height/number
  transactionCount?: number; // Number of transactions
  size?: number; // Size of the block in bytes
  createdBy?: string; // Node that created the block
}

export interface BlockchainInfo {
  chain: Block[];
  currentDifficulty: number;
  networkNodes: number;
  pendingTransactions: number;
  totalBlocks: number;
} 