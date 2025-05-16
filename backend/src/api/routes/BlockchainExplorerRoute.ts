import express from 'express';
import { 
  getLatestBlocks, 
  getBlockDetails, 
  getTransactionByHash, 
  getBlockchainStats,
  searchBlockchain
} from '../controller/BlockchainExplorerController';

const router = express.Router();

// Get latest blocks
router.get('/blocks', getLatestBlocks);

// Get block details by height or hash
router.get('/block/:identifier', getBlockDetails);

// Get transaction details by hash
router.get('/transaction/:hash', getTransactionByHash);

// Get blockchain statistics
router.get('/stats', getBlockchainStats);

// Search blockchain
router.get('/search', searchBlockchain);

export default router; 