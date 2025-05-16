import { Router, Request, Response } from "express";
import { txhashDB } from "../../helper/level.db.client";

// Buat router baru
const router = Router();

/**
 * Endpoint statistik pengguna
 * Mengambil data asli dari database, bukan data dummy
 */
router.get("/statistics", async (req: Request, res: Response) => {
  try {
    console.log("Direct statistics endpoint called - using real data");
    
    // Ambil semua data user dari database
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    
    // Inisialisasi statistik
    const statistics = {
      totalUsers: 0,
      farmerCount: 0,
      collectorCount: 0,
      traderCount: 0,
      retailerCount: 0,
      consumerCount: 0,
      unknownCount: 0
    };
    
    // Hitung jumlah user berdasarkan role
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        const user = JSON.parse(userData);
        
        // Tambahkan ke total
        statistics.totalUsers++;
        
        // Tambahkan ke counter berdasarkan role
        switch(user.role) {
          case 'FARMER':
            statistics.farmerCount++;
            break;
          case 'COLLECTOR':
            statistics.collectorCount++;
            break;
          case 'TRADER':
            statistics.traderCount++;
            break;
          case 'RETAILER':
            statistics.retailerCount++;
            break;
          case 'CONSUMER':
            statistics.consumerCount++;
            break;
          default:
            statistics.unknownCount++;
            break;
        }
      } catch (error) {
        console.error(`Error loading user from key ${key}:`, error);
      }
    }
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error("Error getting user statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics"
    });
  }
});

/**
 * Endpoint trend pengguna
 * Mengambil data asli dari database, bukan data dummy
 */
router.get("/trend", async (req: Request, res: Response) => {
  try {
    console.log("Direct trend endpoint called - using real data");
    const period = req.query.period as string || 'monthly';
    
    // Ambil semua data user dari database
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    
    // Convert to timestamp map to count by date
    const userRegistrationMap = new Map();
    
    // Collect registration timestamps
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        const user = JSON.parse(userData);
        
        if (user.createdAt) {
          const timestamp = user.createdAt;
          const date = new Date(timestamp);
          
          let dateKey;
          if (period === 'weekly') {
            // Group by day
            dateKey = date.toISOString().split('T')[0];
          } else if (period === 'monthly') {
            // Group by month
            dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          } else {
            // Group by year
            dateKey = date.getFullYear().toString();
          }
          
          userRegistrationMap.set(dateKey, (userRegistrationMap.get(dateKey) || 0) + 1);
        }
      } catch (error) {
        console.error(`Error loading user data from key ${key}:`, error);
      }
    }
    
    // Convert map to array and sort by date
    let result = Array.from(userRegistrationMap.entries()).map(([date, count]) => ({ date, count }));
    result.sort((a, b) => a.date.localeCompare(b.date));
    
    // Limit to most recent entries
    if (period === 'weekly') {
      result = result.slice(-7); // Last 7 days
    } else if (period === 'monthly') {
      result = result.slice(-12); // Last 12 months
    } else {
      result = result.slice(-5); // Last 5 years
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error getting user registration trend:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user registration trend"
    });
  }
});

/**
 * Endpoint profil pengguna alternatif
 * Menggunakan autentikasi pada sesi jika tersedia
 */
router.get("/profile", async (req: Request, res: Response) => {
  try {
    console.log("Direct profile endpoint called - checking for user data");
    
    // Dapatkan user ID dari authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Jika tidak ada authorization, kembalikan error autentikasi
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    
    const token = authHeader.split(' ')[1];
    // Verifikasi token untuk mendapatkan user ID
    // Ini memerlukan implementasi JWT verification
    
    // Jika token valid, ambil data user dari database
    // Ini perlu diimplementasikan sesuai dengan sistem autentikasi Anda
    
    return res.status(401).json({
      success: false,
      message: "Authentication required to access user profile"
    });
  } catch (error) {
    console.error("Error in direct profile endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Ping endpoint untuk mengecek ketersediaan
router.get("/ping", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "DirectRoute is available",
    timestamp: Date.now()
  });
});

export default router; 