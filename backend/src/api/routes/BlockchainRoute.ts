import express from "express";
import { Request, Response } from "express";

import catcher from "../helper/handler"
import {
  // Operasi Blockchain Utama
  getLastBlock,
  getBlockchainState,
  getBlockchainStats,
  getBlockchainMiningStatus,
  triggerManualMining,
  
  // Operasi Blok
  getBlocks,
  getBlockById,
  getBlock,
  getBlockTransactions,
  
  // Operasi Transaksi
  getTransactionById,
  getTransactionByHash,
  getProductHistory,
  
  // Pencarian Blockchain
  searchBlockchain
} from "../controller/BlockchainController"

const router = express.Router();

/**
 * ===== BAGIAN 1: OPERASI BLOCKCHAIN UTAMA =====
 */

// Status blockchain
router.get("/status", catcher(getBlockchainState));

// Statistik blockchain lengkap
router.get("/stats", catcher(getBlockchainStats));

// Status mining dan transaksi tertunda
router.get("/mining/status", catcher(getBlockchainMiningStatus));

// Memicu mining manual
router.post("/mining/trigger", catcher(triggerManualMining));

// Blok terakhir (legacy endpoint)
router.get("/last-block", catcher(getLastBlock));

// Status blockchain (legacy endpoint)
router.get("/state", catcher(getBlockchainState));

/**
 * ===== BAGIAN 2: OPERASI BLOK =====
 */

// Daftar blok blockchain dengan paginasi
router.get("/blocks", catcher(getBlocks));

// Detail blok berdasarkan ID (height atau hash)
router.get("/blocks/:blockId", catcher(getBlockById));

// Mendapatkan blok dengan query parameter (dari legacy BlockRoute)
router.get("/block", catcher(getBlock));

// Mendapatkan transaksi dalam blok (dari legacy BlockRoute)
router.get("/block/transactions", catcher(getBlockTransactions));

/**
 * ===== BAGIAN 3: OPERASI TRANSAKSI =====
 */

// Detail transaksi berdasarkan ID
router.get("/transactions/:txId", catcher(getTransactionById));

// Detail transaksi berdasarkan hash (dari BlockchainExplorerRoute)
router.get("/transaction/:hash", catcher(getTransactionByHash));

// Riwayat transaksi produk
router.get("/product/:productId/history", catcher(getProductHistory));

/**
 * ===== BAGIAN 4: PENCARIAN BLOCKCHAIN =====
 */

// Pencarian blockchain berdasarkan berbagai kriteria
router.get("/search", catcher(searchBlockchain));

export default router
