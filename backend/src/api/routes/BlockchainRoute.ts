import express from "express";
import { Request, Response } from "express";

import catcher from "../helper/handler"
import {
  getLastBlock,
  getBlockchainState,
} from "../controller/BlockchainController"

const router = express.Router();

router.get("/status", async (req: Request, res: Response) => {
  try {
    // Mock data - in a real implementation this would be obtained from the blockchain service
    const blockchainStatus = {
      networkName: "AgriChain Mainnet",
      currentHeight: 12458,
      totalTransactions: 53240,
      lastBlockTime: new Date().toISOString(),
      averageBlockTime: 5.2,
      nodesOnline: 8,
      isHealthy: true
    };

    res.status(200).json({
      success: true,
      data: blockchainStatus
    });
  } catch (error) {
    console.error("Error getting blockchain status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain status"
    });
  }
});

router.get("/blocks", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Mock data - in a real implementation this would be obtained from the blockchain service
    const mockBlocks = [];
    const startHeight = 12458 - ((page - 1) * limit);
    
    for (let i = 0; i < limit && startHeight - i > 0; i++) {
      const blockHeight = startHeight - i;
      mockBlocks.push({
        hash: `block-hash-${blockHeight}`,
        previousHash: `block-hash-${blockHeight - 1}`,
        height: blockHeight,
        timestamp: new Date(Date.now() - (i * 5000)).toISOString(),
        transactions: [],
        transactionCount: Math.floor(Math.random() * 10),
        size: Math.floor(Math.random() * 1000) + 500,
        createdBy: `node-${Math.floor(Math.random() * 8) + 1}`
      });
    }

    res.status(200).json({
      success: true,
      data: mockBlocks,
      pagination: {
        page,
        limit,
        totalBlocks: 12458,
        totalPages: Math.ceil(12458 / limit)
      }
    });
  } catch (error) {
    console.error("Error getting blockchain blocks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get blockchain blocks"
    });
  }
});

router.get("/blocks/:blockId", async (req: Request, res: Response) => {
  try {
    const { blockId } = req.params;
    const isNumeric = /^\d+$/.test(blockId);
    
    // Mock data - in a real implementation this would be obtained from the blockchain service
    const mockBlock = {
      hash: isNumeric ? `block-hash-${blockId}` : blockId,
      previousHash: isNumeric ? `block-hash-${parseInt(blockId) - 1}` : `prev-${blockId}`,
      height: isNumeric ? parseInt(blockId) : 12345,
      timestamp: new Date().toISOString(),
      transactions: [],
      transactionCount: 5,
      size: 723,
      createdBy: "node-3"
    };

    res.status(200).json({
      success: true,
      data: mockBlock
    });
  } catch (error) {
    console.error("Error getting block details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get block details"
    });
  }
});

router.get("/transactions/:txId", async (req: Request, res: Response) => {
  try {
    const { txId } = req.params;
    
    // Mock data - in a real implementation this would be obtained from the blockchain service
    const mockTransaction = {
      txId: txId,
      blockHash: "block-hash-12345",
      blockHeight: 12345,
      timestamp: new Date().toISOString(),
      type: "TRANSFER",
      sender: "user-abc-123",
      receiver: "user-xyz-789",
      productId: "product-123",
      data: {
        quantity: 100,
        price: 25000
      },
      status: "CONFIRMED"
    };

    res.status(200).json({
      success: true,
      data: mockTransaction
    });
  } catch (error) {
    console.error("Error getting transaction details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction details"
    });
  }
});

router.get("/product/:productId/history", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    
    // Mock data - in a real implementation this would be obtained from the blockchain service
    const mockHistory = [
      {
        txId: `tx-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 5000000).toISOString(),
        action: "CREATED",
        performedBy: "farmer-123",
        roleType: "FARMER",
        details: {
          name: "Beras Organik Premium",
          quantity: 100
        },
        blockHeight: 12300
      },
      {
        txId: `tx-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        action: "VERIFIED",
        performedBy: "inspector-456",
        roleType: "INSPECTOR",
        details: {
          quality: "Premium",
          passedTests: ["visual", "chemical", "weight"]
        },
        blockHeight: 12350
      },
      {
        txId: `tx-${Date.now()}-3`,
        timestamp: new Date(Date.now() - 1000000).toISOString(),
        action: "TRANSFERRED",
        performedBy: "distributor-789",
        roleType: "DISTRIBUTOR",
        details: {
          fromUser: "farmer-123",
          toUser: "distributor-789",
          quantity: 50
        },
        blockHeight: 12400
      }
    ];

    res.status(200).json({
      success: true,
      data: mockHistory
    });
  } catch (error) {
    console.error("Error getting product history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product history"
    });
  }
});

router.get("/last-block", catcher(getLastBlock))
router.get("/state", catcher(getBlockchainState))

export default router
