import type { Request, Response } from "express"
import { blockDB, txhashDB, bhashDB } from "../../helper/level.db.client"
import Block from "../../block"

/**
 * ===== BAGIAN 1: OPERASI BLOCKCHAIN UTAMA =====
 */

/**
 * Mendapatkan blok terakhir dari blockchain
 */
const getLastBlock = async (_req: Request, res: Response) => {
  try {
    // Coba dapatkan blok terakhir dari blockDB
    const blockKeys = await blockDB.keys().all()
    
    if (blockKeys.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada data blockchain tersedia"
      })
    }
    
    const lastStoredBlockKey = Math.max(...blockKeys.map((key) => parseInt(key.toString())))
    const lastblock = await blockDB
      .get(lastStoredBlockKey.toString())
      .then((data) => JSON.parse(data))

    return res.json({
      success: true,
      data: {
        block: lastblock,
      },
    })
  } catch (err) {
    console.error("Error in getLastBlock:", err)
    return res.status(500).json({
      success: false,
      message: "Gagal mendapatkan blok terakhir, silakan coba lagi nanti.",
    })
  }
}

/**
 * Mendapatkan status blockchain termasuk total blok dan transaksi
 */
const getBlockchainState = async (_req: Request, res: Response) => {
  try {
    const blockKeys = await blockDB.keys().all()
    const txKeys = await txhashDB.keys().all()
    
    // Dapatkan kunci transaksi yang merupakan transaksi aktual (bukan metadata)
    const transactionKeys = txKeys.filter(
      key => key.toString().startsWith('transaction:') && !key.toString().includes(':transaction:')
    )

    return res.json({
      success: true,
      data: {
        totalBlocks: blockKeys.length,
        totalTransactions: transactionKeys.length,
      },
    })
  } catch (error) {
    console.error("Error in getBlockchainState:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil status blockchain"
    })
  }
}

/**
 * Mendapatkan statistik blockchain lengkap (dari BlockchainExplorerController)
 */
const getBlockchainStats = async (req: Request, res: Response) => {
  try {
    // Dapatkan blok terakhir
    const latestBlockData = await txhashDB.get('blockchain:latest').catch(() => null)
    const latestBlock = latestBlockData ? JSON.parse(latestBlockData) : null
    
    // Hitung total transaksi
    const allKeys = await txhashDB.keys().all()
    const transactionKeys = allKeys.filter(
      key => key.toString().startsWith('transaction:') && !key.toString().includes(':transaction:')
    )
    
    // Hitung total blok
    const blockKeys = allKeys.filter(
      key => key.toString().startsWith('blockchain:block:')
    )
    
    return res.status(200).json({
      success: true,
      data: {
        latestBlock,
        stats: {
          blockHeight: latestBlock ? latestBlock.height : 0,
          totalBlocks: blockKeys.length,
          totalTransactions: transactionKeys.length,
          lastBlockTime: latestBlock ? new Date(latestBlock.timestamp).toISOString() : null
        }
      }
    })
  } catch (error) {
    console.error("Error in getBlockchainStats:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil statistik blockchain"
    })
  }
}

/**
 * Mendapatkan status mining blockchain termasuk transaksi tertunda
 */
const getBlockchainMiningStatus = async (req: Request, res: Response) => {
  try {
    // Dapatkan informasi blockchain integration dari locals
    const blockchainIntegration = res.locals.blockchainIntegration;
    
    if (!blockchainIntegration) {
      return res.status(500).json({
        success: false,
        message: "Integrasi blockchain tidak tersedia"
      });
    }
    
    // Dapatkan jumlah transaksi tertunda
    const pendingTransactions = blockchainIntegration.getPendingTransactionsCount();
    
    return res.status(200).json({
      success: true,
      data: {
        pendingTransactions,
        miningEnabled: true, // Assume mining is enabled
        lastMiningTime: new Date().toISOString() // Idealnya ini didapatkan dari mining service
      }
    });
  } catch (error) {
    console.error("Error in getBlockchainMiningStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil status mining blockchain"
    });
  }
};

/**
 * Memicu mining manual
 */
const triggerManualMining = async (req: Request, res: Response) => {
  try {
    // Dapatkan informasi blockchain integration dari locals
    const blockchainIntegration = res.locals.blockchainIntegration;
    
    if (!blockchainIntegration) {
      return res.status(500).json({
        success: false,
        message: "Integrasi blockchain tidak tersedia"
      });
    }
    
    // Panggil triggerManualMining
    const result = await blockchainIntegration.triggerManualMining();
    
    return res.status(200).json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error("Error in triggerManualMining:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat memicu mining manual"
    });
  }
};

/**
 * ===== BAGIAN 2: OPERASI BLOK =====
 */

/**
 * Mendapatkan daftar blok blockchain dengan paginasi
 */
const getBlocks = async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10
    
    // Dapatkan semua kunci blok
    const blockKeys = await blockDB.keys().all()
    
    if (blockKeys.length <= 0) {
      return res.json({
        success: true,
        data: {
          blocks: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0
          }
        }
      })
    }
    
    // Urutkan berdasarkan tinggi blok (terbaru dulu)
    const sortedKeys = blockKeys
      .map(key => {
        const blockId = parseInt(key.toString())
        return { key, blockId }
      })
      .sort((a, b) => b.blockId - a.blockId)
    
    // Terapkan paginasi
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedKeys = sortedKeys.slice(start, end)
    
    // Dapatkan data blok untuk setiap kunci
    const blocks = []
    for (const { key } of paginatedKeys) {
      const blockData = await blockDB.get(key.toString())
      if (blockData) {
        blocks.push(JSON.parse(blockData))
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        blocks,
        pagination: {
          total: sortedKeys.length,
          page,
          limit,
          totalPages: Math.ceil(sortedKeys.length / limit)
        }
      }
    })
  } catch (error) {
    console.error("Error in getBlocks:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil daftar blok blockchain"
    })
  }
}

/**
 * Mendapatkan detail blok berdasarkan ID (bisa berupa tinggi atau hash)
 * Menggabungkan getBlockById dan getBlockDetails
 */
const getBlockById = async (req: Request, res: Response) => {
  try {
    const blockId = req.params.blockId || req.params.identifier
    
    if (!blockId) {
      return res.status(400).json({
        success: false,
        message: "Parameter blockId diperlukan"
      })
    }
    
    let blockData
    
    // Periksa apakah blockId adalah angka (ketinggian blok)
    if (/^\d+$/.test(blockId)) {
      const blockHeight = parseInt(blockId)
      // Pertama coba dari blockDB
      blockData = await blockDB.get(`${blockHeight}`).catch(() => null)
      // Jika tidak ditemukan, coba dari txhashDB
      if (!blockData) {
        blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null)
      }
    } else {
      // Asumsikan blockId adalah hash, coba dari txhashDB
      blockData = await txhashDB.get(`blockchain:hash:${blockId}`).catch(() => null)
      // Jika tidak ditemukan, coba dari bhashDB
      if (!blockData) {
        try {
          const blockNumber = await bhashDB.get(blockId)
          blockData = await blockDB.get(blockNumber).catch(() => null)
        } catch (err) {
          // Tidak ditemukan di bhashDB
        }
      }
    }
    
    if (!blockData) {
      return res.status(404).json({
        success: false,
        message: `Blok dengan ID ${blockId} tidak ditemukan`
      })
    }
    
    const block = JSON.parse(blockData)
    
    // Dapatkan transaksi dalam blok
    const transactions = []
    if (block.transactions && Array.isArray(block.transactions)) {
      for (const txId of block.transactions) {
        const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null)
        if (txData) {
          transactions.push(JSON.parse(txData))
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        block,
        transactions
      }
    })
  } catch (error) {
    console.error("Error in getBlockById:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil detail blok"
    })
  }
}

/**
 * Mendapatkan blok dengan query parameter (dari BlockController)
 */
const getBlock = async (req: Request, res: Response) => {
  const { hash = "", number = "" } = req.query

  if (!hash && !number) {
    return res.status(400).json({
      success: false,
      message: "Query string harus berisi 'hash' atau 'number'.",
    })
  }

  try {
    const blockData = await getBlockData(String(number), String(hash))
    return res.json({
      success: true,
      data: {
        block: blockData,
      },
    })
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: `Blok tidak ditemukan.`,
    })
  }
}

/**
 * Mendapatkan transaksi dalam blok (dari BlockController)
 */
const getBlockTransactions = async (req: Request, res: Response) => {
  const { hash, number } = req.query

  if (!hash && !number) {
    return res.status(400).json({
      success: false,
      message: "Query string harus berisi 'hash' atau 'number'.",
    })
  }

  try {
    const blockData = await getBlockData(String(number), String(hash))
    return res.json({
      success: true,
      data: {
        block: blockData.data,
      },
    })
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: `Blok tidak ditemukan.`,
    })
  }
}

/**
 * Fungsi helper untuk mendapatkan data blok (dari BlockController)
 */
const getBlockData = async (number?: string, hash?: string): Promise<Block> => {
  return new Promise<Block>(async (resolve, reject) => {
    let blockNumber: string | undefined

    if (number) blockNumber = number
    else if (hash) {
      try {
        blockNumber = await bhashDB.get(hash)
      } catch (err) {
        return reject(err)
      }
    }

    if (blockNumber) {
      try {
        const block = await blockDB
          .get(blockNumber)
          .then((data) => JSON.parse(data))
        return resolve(block)
      } catch (err) {
        return reject(err)
      }
    } else {
      reject(new Error("Invalid parameters"))
    }
  })
}

/**
 * ===== BAGIAN 3: OPERASI TRANSAKSI =====
 */

/**
 * Mendapatkan detail transaksi berdasarkan ID
 */
const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { txId } = req.params
    
    if (!txId) {
      return res.status(400).json({
        success: false,
        message: "Parameter ID transaksi diperlukan"
      })
    }
    
    // Validasi format transaction ID: harus berformat "txn-timestamp-string"
    const txIdRegex = /^txn-\d+-[a-z0-9]+$/
    if (!txIdRegex.test(txId)) {
      return res.status(400).json({
        success: false,
        message: "Format ID transaksi tidak valid. Format yang benar: txn-timestamp-string"
      })
    }
    
    // Pertama coba pencarian langsung berdasarkan ID
    let txData = await txhashDB.get(`transaction:${txId}`).catch(() => null)
    
    // Jika tidak ditemukan, coba pencarian berdasarkan hash
    if (!txData) {
      const allKeys = await txhashDB.keys().all()
      const transactionKeys = allKeys.filter(key => 
        key.toString().startsWith('transaction:') && 
        !key.toString().includes(':transaction:')
      )
      
      for (const key of transactionKeys) {
        const data = await txhashDB.get(key.toString())
        if (data) {
          try {
            const tx = JSON.parse(data)
            if (tx.blockchain && tx.blockchain.transactionHash === txId) {
              txData = data
              break
            }
          } catch (e) {
            console.warn(`Gagal memparsing data transaksi untuk ${key}:`, e)
          }
        }
      }
    }
    
    if (!txData) {
      return res.status(404).json({
        success: false,
        message: `Transaksi dengan ID ${txId} tidak ditemukan`
      })
    }
    
    const transaction = JSON.parse(txData)
    
    // Dapatkan data blok jika tersedia
    let blockInfo = null
    if (transaction.blockchain && transaction.blockchain.blockHeight) {
      const blockHeight = transaction.blockchain.blockHeight
      // Coba dari blockDB
      const blockData = await blockDB.get(`${blockHeight}`).catch(() => null)
      if (blockData) {
        blockInfo = JSON.parse(blockData)
      } else {
        // Coba dari txhashDB jika tidak ditemukan di blockDB
        const txhashBlockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null)
        if (txhashBlockData) {
          blockInfo = JSON.parse(txhashBlockData)
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        transaction,
        block: blockInfo
      }
    })
  } catch (error) {
    console.error("Error in getTransactionById:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil detail transaksi"
    })
  }
}

/**
 * Mendapatkan transaksi berdasarkan hash (dari BlockchainExplorerController)
 */
const getTransactionByHash = async (req: Request, res: Response) => {
  try {
    const { hash } = req.params
    
    if (!hash) {
      return res.status(400).json({
        success: false,
        message: "Parameter hash transaksi diperlukan"
      })
    }
    
    // Validasi format transaction hash: harus berformat "txn-timestamp-string"
    const txHashRegex = /^txn-\d+-[a-z0-9]+$/
    if (!txHashRegex.test(hash)) {
      return res.status(400).json({
        success: false,
        message: "Format hash transaksi tidak valid. Format yang benar: txn-timestamp-string"
      })
    }
    
    // Pencarian transaksi dengan hash yang sesuai
    const allKeys = await txhashDB.keys().all()
    const transactionKeys = allKeys.filter(key => key.toString().startsWith('transaction:'))
    
    // Untuk setiap kunci, periksa apakah transaksi memiliki hash yang cocok
    let matchingTransaction = null
    for (const key of transactionKeys) {
      const txData = await txhashDB.get(key.toString())
      if (txData) {
        try {
          const tx = JSON.parse(txData)
          if (tx.blockchain && tx.blockchain.transactionHash === hash) {
            matchingTransaction = tx
            break
          }
        } catch (e) {
          console.warn(`Gagal memparsing data transaksi untuk ${key}:`, e)
        }
      }
    }
    
    if (!matchingTransaction) {
      return res.status(404).json({
        success: false,
        message: `Transaksi dengan hash ${hash} tidak ditemukan`
      })
    }
    
    // Dapatkan data blok
    const blockHeight = matchingTransaction.blockchain.blockHeight
    const blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null)
    const blockInfo = blockData ? JSON.parse(blockData) : null
    
    return res.status(200).json({
      success: true,
      data: {
        transaction: matchingTransaction,
        block: blockInfo
      }
    })
  } catch (error) {
    console.error("Error in getTransactionByHash:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil detail transaksi"
    })
  }
}

/**
 * Mendapatkan riwayat transaksi produk
 */
const getProductHistory = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Parameter productId diperlukan"
      })
    }
    
    // Dapatkan semua kunci transaksi produk
    const allKeys = await txhashDB.keys().all()
    const productTxKeys = allKeys.filter(
      key => key.toString().startsWith(`product:${productId}:transaction:`)
    )
    
    if (productTxKeys.length <= 0) {
      return res.status(404).json({
        success: false,
        message: `Tidak ada transaksi ditemukan untuk produk ${productId}`
      })
    }
    
    // Dapatkan semua transaksi untuk produk ini
    const transactions = []
    for (const key of productTxKeys) {
      const txId = key.toString().split(':')[3]
      const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null)
      if (txData) {
        transactions.push(JSON.parse(txData))
      }
    }
    
    return res.status(200).json({
      success: true,
      data: {
        productId,
        transactions
      }
    })
  } catch (error) {
    console.error("Error in getProductHistory:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mengambil riwayat produk"
    })
  }
}

/**
 * ===== BAGIAN 4: PENCARIAN BLOCKCHAIN =====
 */

/**
 * Pencarian blockchain berdasarkan berbagai kriteria
 */
const searchBlockchain = async (req: Request, res: Response) => {
  try {
    const { term } = req.query
    
    if (!term) {
      return res.status(400).json({
        success: false,
        message: "Parameter pencarian diperlukan"
      })
    }
    
    const searchTerm = term.toString()
    
    // Periksa apakah istilah pencarian adalah ketinggian blok
    if (/^\d+$/.test(searchTerm)) {
      const blockHeight = parseInt(searchTerm)
      // Coba di blockDB dulu
      let blockData = await blockDB.get(`${blockHeight}`).catch(() => null)
      
      // Jika tidak ditemukan di blockDB, coba di txhashDB
      if (!blockData) {
        blockData = await txhashDB.get(`blockchain:block:${blockHeight}`).catch(() => null)
      }
      
      if (blockData) {
        return res.status(200).json({
          success: true,
          data: {
            type: 'block',
            result: JSON.parse(blockData)
          }
        })
      }
    }
    
    // Periksa kecocokan hash blok
    const blockByHashData = await txhashDB.get(`blockchain:hash:${searchTerm}`).catch(() => null)
    if (blockByHashData) {
      return res.status(200).json({
        success: true,
        data: {
          type: 'block',
          result: JSON.parse(blockByHashData)
        }
      })
    }
    
    // Coba cari melalui bhashDB
    try {
      const blockNumber = await bhashDB.get(searchTerm)
      const blockData = await blockDB.get(blockNumber).catch(() => null)
      if (blockData) {
        return res.status(200).json({
          success: true,
          data: {
            type: 'block',
            result: JSON.parse(blockData)
          }
        })
      }
    } catch (err) {
      // Hash blok tidak ditemukan di bhashDB
    }
    
    // Validasi format transaction ID: harus berformat "txn-timestamp-string"
    const txIdRegex = /^txn-\d+-[a-z0-9]+$/
    
    // Periksa kecocokan ID transaksi (hanya jika format sesuai)
    if (txIdRegex.test(searchTerm)) {
      // Pertama coba pencarian langsung berdasarkan ID
      const txData = await txhashDB.get(`transaction:${searchTerm}`).catch(() => null)
      if (txData) {
        return res.status(200).json({
          success: true,
          data: {
            type: 'transaction',
            result: JSON.parse(txData)
          }
        })
      }
      
      // Jika tidak ditemukan, coba pencarian berdasarkan hash
      const allKeys = await txhashDB.keys().all()
      const allTxKeys = allKeys.filter(
        key => key.toString().startsWith('transaction:') && !key.toString().includes(':transaction:')
      )
      
      for (const key of allTxKeys) {
        const data = await txhashDB.get(key.toString())
        if (data) {
          try {
            const tx = JSON.parse(data)
            if (tx.blockchain && tx.blockchain.transactionHash === searchTerm) {
              return res.status(200).json({
                success: true,
                data: {
                  type: 'transaction',
                  result: tx
                }
              })
            }
          } catch (e) {
            console.warn(`Gagal memparsing data transaksi untuk ${key}:`, e)
          }
        }
      }
    }
    
    // Periksa ID produk
    if (searchTerm.startsWith('prod-')) {
      const allKeys = await txhashDB.keys().all()
      const productTxKeys = allKeys.filter(
        key => key.toString().startsWith(`product:${searchTerm}:transaction:`)
      )
      
      if (productTxKeys.length > 0) {
        const transactions = []
        for (const key of productTxKeys) {
          const txId = key.toString().split(':')[3]
          const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null)
          if (txData) {
            transactions.push(JSON.parse(txData))
          }
        }
        
        return res.status(200).json({
          success: true,
          data: {
            type: 'product',
            productId: searchTerm,
            transactions
          }
        })
      }
    }
    
    // Periksa ID pengguna
    const allUserKeys = await txhashDB.keys().all()
    const userTxKeys = allUserKeys.filter(
      key => key.toString().startsWith(`user:${searchTerm}:transaction:`)
    )
    
    if (userTxKeys.length > 0) {
      const transactions = []
      for (const key of userTxKeys) {
        const txId = key.toString().split(':')[3]
        const txData = await txhashDB.get(`transaction:${txId}`).catch(() => null)
        if (txData) {
          transactions.push(JSON.parse(txData))
        }
      }
      
      return res.status(200).json({
        success: true,
        data: {
          type: 'user',
          userId: searchTerm,
          transactions
        }
      })
    }
    
    return res.status(404).json({
      success: false,
      message: `Tidak ditemukan hasil untuk istilah pencarian: ${searchTerm}`
    })
  } catch (error) {
    console.error("Error in searchBlockchain:", error)
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat mencari blockchain"
    })
  }
}

/**
 * Ekspor semua fungsi
 */
export { 
  // Bagian 1: Operasi Blockchain Utama
  getLastBlock, 
  getBlockchainState,
  getBlockchainStats,
  getBlockchainMiningStatus,
  triggerManualMining,

  // Bagian 2: Operasi Blok
  getBlocks,
  getBlockById,
  getBlock,
  getBlockTransactions,

  // Bagian 3: Operasi Transaksi
  getTransactionById,
  getTransactionByHash,
  getProductHistory,

  // Bagian 4: Pencarian Blockchain
  searchBlockchain
}
