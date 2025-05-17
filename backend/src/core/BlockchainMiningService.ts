import Block from "../block";
import Transaction from "../transaction";
import { cryptoHashV2 } from "../crypto-hash";
import { MINT_KEY_PAIR, MINT_PUBLIC_ADDRESS } from "../config";
import { txhashDB, blockDB, bhashDB } from "../helper/level.db.client";

/**
 * Layanan untuk melakukan mining transaksi dan mengelola blockchain
 */
class BlockchainMiningService {
  private static instance: BlockchainMiningService;
  private isRunning: boolean = false;
  private pendingTransactions: Transaction[] = [];
  private miningInterval: NodeJS.Timeout | null = null;
  private readonly MINING_INTERVAL = 60 * 1000; // 1 menit
  private readonly MIN_TRANSACTIONS_TO_MINE = 1; // Minimal jumlah transaksi untuk mining
  private readonly MAX_TRANSACTIONS_PER_BLOCK = 10; // Maksimal transaksi per blok

  private constructor() {
    // Private constructor untuk singleton
  }

  /**
   * Mendapatkan instance singleton dari kelas BlockchainMiningService
   */
  public static getInstance(): BlockchainMiningService {
    if (!BlockchainMiningService.instance) {
      BlockchainMiningService.instance = new BlockchainMiningService();
    }
    return BlockchainMiningService.instance;
  }

  /**
   * Memulai layanan mining secara otomatis
   * @param intervalSeconds Interval waktu dalam detik antara proses mining
   */
  public startMiningService(intervalSeconds: number = 60): void {
    if (this.isRunning) {
      console.log("Layanan mining blockchain sudah berjalan");
      return;
    }

    console.log(`Memulai layanan mining blockchain dengan interval ${intervalSeconds} detik`);
    this.isRunning = true;

    // Jalankan mining pertama kali secara langsung
    this.mineTransactions().catch(error => {
      console.error("Error saat melakukan mining awal:", error);
    });

    // Set interval untuk mining berkala
    this.miningInterval = setInterval(() => {
      this.mineTransactions().catch(error => {
        console.error("Error saat melakukan mining berkala:", error);
      });
    }, intervalSeconds * 1000);
  }

  /**
   * Menghentikan layanan mining otomatis
   */
  public stopMiningService(): void {
    if (!this.isRunning) {
      console.log("Layanan mining blockchain tidak berjalan");
      return;
    }

    console.log("Menghentikan layanan mining blockchain");
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Menambahkan transaksi ke daftar transaksi yang menunggu
   * @param transaction Transaksi untuk ditambahkan
   */
  public addPendingTransaction(transaction: Transaction): void {
    if (transaction.isValid()) {
      this.pendingTransactions.push(transaction);
      console.log(`Transaksi ditambahkan ke daftar menunggu. Total: ${this.pendingTransactions.length}`);

      // Mining otomatis jika jumlah transaksi mencapai threshold
      if (this.pendingTransactions.length >= this.MAX_TRANSACTIONS_PER_BLOCK) {
        console.log("Jumlah transaksi mencapai maksimum per blok, melakukan mining otomatis");
        this.mineTransactions().catch(error => {
          console.error("Error saat melakukan mining otomatis:", error);
        });
      }
    } else {
      console.error("Transaksi tidak valid dan ditolak");
    }
  }

  /**
   * Mining transaksi tertunda menjadi blok baru
   */
  public async mineTransactions(): Promise<boolean> {
    try {
      // Cek apakah ada cukup transaksi untuk mining
      if (this.pendingTransactions.length < this.MIN_TRANSACTIONS_TO_MINE) {
        console.log(`Tidak cukup transaksi untuk mining. Saat ini: ${this.pendingTransactions.length}, minimal: ${this.MIN_TRANSACTIONS_TO_MINE}`);
        return false;
      }

      console.log(`Memulai proses mining dengan ${this.pendingTransactions.length} transaksi tertunda`);

      // Batasi jumlah transaksi per blok
      const transactionsToMine = this.pendingTransactions.splice(0, this.MAX_TRANSACTIONS_PER_BLOCK);

      // Dapatkan blok terakhir
      const lastBlock = await this.getLastBlock();
      if (!lastBlock) {
        console.error("Tidak dapat mendapatkan blok terakhir");
        return false;
      }

      // Buat transaksi reward
      const rewardTransaction = new Transaction({
        from: MINT_PUBLIC_ADDRESS,
        to: MINT_PUBLIC_ADDRESS, // Bisa diganti dengan miner address
        data: {
          type: "REWARD",
          amount: transactionsToMine.length,
          timestamp: Date.now()
        },
      });
      rewardTransaction.sign(MINT_KEY_PAIR);

      // Tambahkan reward transaction ke awal array
      const allTransactions = [rewardTransaction, ...transactionsToMine];

      // Buat blok baru dengan transaksi
      const newBlock = Block.mineBlock({
        lastBlock,
        data: allTransactions,
      });

      // Simpan blok ke database
      await this.saveBlock(newBlock);

      // Simpan transaksi ke database
      await this.saveTransactions(allTransactions, newBlock);

      console.log(`Blok #${newBlock.number} berhasil ditambahkan ke blockchain dengan ${allTransactions.length} transaksi`);
      return true;
    } catch (error) {
      console.error("Error saat mining transaksi:", error);
      return false;
    }
  }

  /**
   * Menyimpan blok baru ke database
   * @param block Blok yang akan disimpan
   */
  private async saveBlock(block: Block): Promise<void> {
    try {
      // Simpan blok ke blockDB dengan nomor blok sebagai key
      await blockDB.put(block.number.toString(), JSON.stringify(block));

      // Simpan hash blok ke bhashDB untuk pencarian cepat
      await bhashDB.put(block.hash, block.number.toString());

      // Simpan blok ke txhashDB untuk explorer dengan format blockchain:block:{blockNumber}
      await txhashDB.put(`blockchain:block:${block.number}`, JSON.stringify(block));

      // Simpan hash blok ke txhashDB untuk explorer dengan format blockchain:hash:{blockHash}
      await txhashDB.put(`blockchain:hash:${block.hash}`, JSON.stringify(block));

      // Perbarui pointer ke blok terakhir
      await txhashDB.put('blockchain:latest', JSON.stringify(block));

      console.log(`Blok #${block.number} disimpan ke database`);
    } catch (error) {
      console.error(`Error saat menyimpan blok #${block.number}:`, error);
      throw error;
    }
  }

  /**
   * Menyimpan transaksi ke database
   * @param transactions Daftar transaksi untuk disimpan
   * @param block Blok yang berisi transaksi
   */
  private async saveTransactions(transactions: Transaction[], block: Block): Promise<void> {
    try {
      for (const transaction of transactions) {
        const txHash = transaction.getHash();
        
        // Tambahkan data blockchain ke transaksi sebelum disimpan
        const txWithBlockchainInfo = {
          ...transaction,
          blockchain: {
            blockHeight: block.number,
            blockHash: block.hash,
            timestamp: block.timestamp,
            transactionHash: txHash
          }
        };

        // Simpan transaksi ke txhashDB
        await txhashDB.put(`transaction:${txHash}`, JSON.stringify(txWithBlockchainInfo));

        // Simpan referensi transaksi untuk produk jika ada di data
        if (transaction.data && transaction.data.productId) {
          await txhashDB.put(`product:${transaction.data.productId}:transaction:${txHash}`, txHash);
        }

        // Simpan referensi transaksi untuk pengguna
        await txhashDB.put(`user:${transaction.from}:transaction:${txHash}`, txHash);
        if (transaction.from !== transaction.to) {
          await txhashDB.put(`user:${transaction.to}:transaction:${txHash}`, txHash);
        }
      }

      console.log(`${transactions.length} transaksi disimpan ke database`);
    } catch (error) {
      console.error("Error saat menyimpan transaksi:", error);
      throw error;
    }
  }

  /**
   * Mendapatkan blok terakhir dari blockchain
   */
  private async getLastBlock(): Promise<Block | null> {
    try {
      // Coba dapatkan pointer ke blok terakhir dari txhashDB
      try {
        const latestBlockData = await txhashDB.get('blockchain:latest').catch(() => null);
        if (latestBlockData) {
          return JSON.parse(latestBlockData);
        }
      } catch (e) {
        console.log("Tidak dapat menemukan data blockchain:latest, mencoba metode alternatif");
      }

      // Jika tidak ada pointer, coba dapatkan dari blockDB
      const blockKeys = await blockDB.keys().all();
      if (blockKeys.length > 0) {
        const lastBlockKey = Math.max(...blockKeys.map(key => parseInt(key.toString())));
        const blockData = await blockDB.get(lastBlockKey.toString());
        return JSON.parse(blockData);
      }

      // Jika masih tidak ada, gunakan blok genesis
      console.log("Tidak ada blok yang ditemukan, menggunakan blok genesis");
      return Block.genesis();
    } catch (error) {
      console.error("Error saat mendapatkan blok terakhir:", error);
      return null;
    }
  }

  /**
   * Mendapatkan jumlah transaksi tertunda
   */
  public getPendingTransactionsCount(): number {
    return this.pendingTransactions.length;
  }
}

export default BlockchainMiningService; 