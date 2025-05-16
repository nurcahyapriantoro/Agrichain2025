import WebSocket from "ws"
import Block from "../block"
import SyncQueue from "../core/queue"
import Transaction from "../transaction"
import ProofOfStake from "../consensus/pos"

import { Level } from "level"
import { MessageTypeEnum } from "../enum"

interface BlockInterface {
  timestamp: number
  lastHash: string
  hash: string
  data: any
  difficulty: number
  nonce: number
  number: number
}

interface BlockchainInterface {
  chain: Array<Block>
  transaction: Array<any>
}

type TransactionInterface<T = any> = {
  from: string
  to: string
  lastTransactionHash?: string
  data: T
}

type MessageInterface<T> = {
  type: MessageTypeEnum
  data: T
}

interface ConnectedNode extends Peer {
  socket: WebSocket
}

interface ChainInfo<T = ProofOfStake> {
  syncQueue: SyncQueue
  latestBlock: Block
  latestSyncBlock: null | Block
  transactionPool: Array<Transaction>
  checkedBlock: Record<string, boolean>
  consensus: T
}

interface StateInterface {
  name: string
  publicKey: string
}

type DBType = Level<string, string>

interface Peer {
  wsAddress: string
  publicKey: string
}

export interface BlockchainData {
  blockHeight: number;
  blockHash: string;
  transactionHash: string;
  timestamp: number;
  validator: string;
}

export interface TransactionHistory {
  id: string;
  transactionId?: string;
  productId?: string;
  fromUserId?: string;
  fromRole?: string;
  toUserId?: string;
  toRole?: string;
  timestamp: number;
  actionType: string;
  productStatus?: string;
  details?: Record<string, any>;
  blockchain?: BlockchainData;
}

export type {
  BlockInterface,
  BlockchainInterface,
  TransactionInterface,
  MessageInterface,
  StateInterface,
  ConnectedNode,
  ChainInfo,
  DBType,
  Peer,
}
