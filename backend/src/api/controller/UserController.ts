import type { Request, Response } from "express"
import { generateKeyPair } from "../../../utils/keypair"
import { stateDB, txhashDB } from "../../helper/level.db.client"
import jwt from 'jsonwebtoken'
import { UserRole } from "../../enum"
import { encryptPrivateKey, decryptPrivateKey } from "../../utils/encryption"
import { v4 as uuidv4 } from 'uuid'
import { Profile } from 'passport-google-oauth20'
import bcrypt from 'bcrypt'
import { ec as EC } from "elliptic"
import { jwtConfig } from '../../config'
import { 
  sendEmail, 
  generateEmailVerificationToken, 
  generatePasswordResetToken,
  verifyToken as verifyEmailToken,
  createVerificationEmailTemplate,
  createPasswordResetEmailTemplate
} from '../../utils/emailService';

// Interface untuk data user
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  walletAddress?: string;
  encryptedPrivateKey: string;
  googleId?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
  createdAt: number;
  updatedAt: number;
  isEmailVerified?: boolean;  // Penanda untuk email yang sudah diverifikasi
  emailVerificationToken?: string; // Token untuk verifikasi email
  emailVerificationExpires?: number; // Waktu kedaluwarsa token
  passwordResetToken?: string; // Token untuk reset password
  passwordResetExpires?: number; // Waktu kedaluwarsa token reset password
  authMethods?: string[]; // Metode autentikasi yang tersedia (email, google, metamask)
}

// Interface untuk histori perubahan profil
interface ProfileChangeHistory {
  userId: string;
  timestamp: number;
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Temporary in-memory user database sebagai cache
// Di produksi, ini sepenuhnya menggunakan database
let usersCache: User[] = [];
let usersCacheInitialized = false;

// Helper function untuk menyimpan user ke database persisten
async function saveUserToDb(user: User): Promise<void> {
  try {
    // Ensure authMethods is initialized if not present
    if (!user.authMethods) {
      user.authMethods = [];
    }
    
    // Simpan user berdasarkan ID
    await txhashDB.put(`user:${user.id}`, JSON.stringify(user));
    
    // Simpan juga indeks berdasarkan email untuk pencarian
    if (user.email) {
      await txhashDB.put(`user-email:${user.email.toLowerCase()}`, user.id);
    }
    
    // Jika ada googleId, simpan indeks berdasarkan googleId
    if (user.googleId) {
      await txhashDB.put(`user-google:${user.googleId}`, user.id);
    }
    
    // Jika ada wallet address, simpan indeks berdasarkan alamat wallet
    if (user.walletAddress) {
      await txhashDB.put(`user-wallet:${user.walletAddress.toLowerCase()}`, user.id);
    }
    
    // Update cache
    const existingIndex = usersCache.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      usersCache[existingIndex] = user;
    } else {
      usersCache.push(user);
    }
  } catch (error) {
    console.error(`Error saving user ${user.id} to database:`, error);
    throw error;
  }
}

// Helper function untuk mendapatkan user dari database
async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log(`getUserById - Looking for user ID: ${userId}`);
    
    // Cek cache dulu jika sudah diinisialisasi
    if (usersCacheInitialized) {
      const cachedUser = usersCache.find(u => u.id === userId);
      console.log(`getUserById - Found in cache: ${cachedUser ? 'Yes' : 'No'}`);
      
      if (cachedUser) return cachedUser;
    }
    
    // Jika tidak ada di cache, cari di database
    console.log(`getUserById - Checking database for user:${userId}`);
    try {
      const userData = await txhashDB.get(`user:${userId}`);
      console.log(`getUserById - Database lookup successful`);
      
      // Parse data user
      const user = JSON.parse(userData) as User;
      
      // Update cache jika sudah diinisialisasi
      if (usersCacheInitialized) {
        const cacheIndex = usersCache.findIndex(u => u.id === user.id);
        if (cacheIndex >= 0) {
          usersCache[cacheIndex] = user;
        } else {
          usersCache.push(user);
        }
      }
      
      return user;
    } catch (dbError: any) {
      console.error(`getUserById - Database error:`, dbError);
      return null;
    }
  } catch (error) {
    console.error(`User dengan ID ${userId} tidak ditemukan:`, error);
    return null;
  }
}

// Helper function untuk mendapatkan user berdasarkan email
async function getUserByEmail(email: string): Promise<User | null> {
  try {
    if (!email) {
      console.error("getUserByEmail called with empty email");
      return null;
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    console.log(`Searching for user with email: ${normalizedEmail}`);
    
    // First check directly in the database without depending on cache
    try {
      // Try to get user ID from email index
      console.log(`Looking up user email index: user-email:${normalizedEmail}`);
      const userId = await txhashDB.get(`user-email:${normalizedEmail}`);
      console.log(`Found user ID from email index: ${userId}`);
      
      // Get full user data based on ID
      console.log(`Getting full user data for ID: ${userId}`);
      const userData = await txhashDB.get(`user:${userId}`);
      
      if (!userData) {
        console.log(`No user data found for ID: ${userId}`);
        return null;
      }
      
      const user = JSON.parse(userData) as User;
      console.log(`User found in database: ${user.id}`);
      
      // Update cache if it's initialized
      if (usersCacheInitialized) {
        const cacheIndex = usersCache.findIndex(u => u.id === user.id);
        if (cacheIndex >= 0) {
          usersCache[cacheIndex] = user;
        } else {
          usersCache.push(user);
        }
        console.log(`User ${user.id} added/updated in cache`);
      }
      
      return user;
    } catch (error: any) {
      // This section runs if the database lookup fails
      
      // If error is NOT_FOUND, we can still check the cache
      if (error.type === 'NotFoundError' || error.code === 'LEVEL_NOT_FOUND') {
        console.log(`User with email ${normalizedEmail} not found in database, checking cache`);
        
        // Only check the cache if it's initialized
        if (usersCacheInitialized) {
          console.log(`Checking cache (${usersCache.length} users in cache)`);
          const cachedUser = usersCache.find(u => u && u.email && u.email.toLowerCase() === normalizedEmail);
          
          if (cachedUser) {
            console.log(`User found in cache: ${cachedUser.id}`);
            
            // Double check: verify if this user actually exists in the database
            try {
              await txhashDB.get(`user:${cachedUser.id}`);
              return cachedUser;
            } catch (err) {
              console.log(`User found in cache but not in database. Removing from cache.`);
              usersCache = usersCache.filter(u => u.id !== cachedUser.id);
              return null;
            }
          }
        }
        
        return null;
      }
      
      // For other database errors
      console.warn(`Unexpected database error looking up email ${normalizedEmail}:`, error);
      
      // As a fallback, check the cache if initialized
      if (usersCacheInitialized) {
        const cachedUser = usersCache.find(u => u && u.email && u.email.toLowerCase() === normalizedEmail);
        if (cachedUser) {
          console.log(`User found in cache after DB error: ${cachedUser.id}`);
          return cachedUser;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Error in getUserByEmail for ${email}:`, error);
    return null;
  }
}

// Helper function untuk mendapatkan user berdasarkan GoogleId
async function getUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    // Cek cache dulu jika sudah diinisialisasi
    if (usersCacheInitialized) {
      const cachedUser = usersCache.find(u => u.googleId === googleId);
      if (cachedUser) return cachedUser;
    }
    
    // Jika tidak ada di cache, cari di database
    try {
      const userId = await txhashDB.get(`user-google:${googleId}`);
      return await getUserById(userId);
    } catch (error: any) {
      // Jika level DB memberikan error NOT_FOUND, ini berarti user tidak ada
      if (error.type === 'NotFoundError' || error.code === 'LEVEL_NOT_FOUND') {
        console.log(`User with Google ID ${googleId} not found in database`);
        return null;
      }
      
      console.error(`Error fetching user with Google ID ${googleId}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error in getUserByGoogleId for ${googleId}:`, error);
    return null;
  }
}

/**
 * Get user by wallet address
 */
async function getUserByWalletAddress(walletAddress: string): Promise<User | null> {
  try {
    if (!walletAddress) {
      console.error("getUserByWalletAddress called with empty wallet address");
      return null;
    }
    
    const normalizedAddress = walletAddress.toLowerCase().trim();
    console.log(`Searching for user with wallet address: ${normalizedAddress}`);
    
    // Try to find directly in the database
    try {
      // Get user ID from wallet address index
      const userId = await txhashDB.get(`user-wallet:${normalizedAddress}`);
      console.log(`Found user ID from wallet index: ${userId}`);
      
      // Get full user data based on ID
      const userData = await txhashDB.get(`user:${userId}`);
      
      if (!userData) {
        console.log(`No user data found for ID: ${userId}`);
        return null;
      }
      
      const user = JSON.parse(userData) as User;
      console.log(`User found in database: ${user.id}`);
      
      // Update cache if it's initialized
      if (usersCacheInitialized) {
        const cacheIndex = usersCache.findIndex(u => u.id === user.id);
        if (cacheIndex >= 0) {
          usersCache[cacheIndex] = user;
        } else {
          usersCache.push(user);
        }
        console.log(`User ${user.id} added/updated in cache`);
      }
      
      return user;
    } catch (error: any) {
      // If error is NOT_FOUND, we can check the cache
      if (error.type === 'NotFoundError' || error.code === 'LEVEL_NOT_FOUND') {
        console.log(`User with wallet ${normalizedAddress} not found in database, checking cache`);
        
        // Check the cache if it's initialized
        if (usersCacheInitialized) {
          console.log(`Checking cache (${usersCache.length} users in cache)`);
          const cachedUser = usersCache.find(u => u && u.walletAddress && u.walletAddress.toLowerCase() === normalizedAddress);
          
          if (cachedUser) {
            console.log(`User found in cache: ${cachedUser.id}`);
            return cachedUser;
          }
        }
        
        return null;
      }
      
      console.error('Error looking up user by wallet address:', error);
      return null;
    }
  } catch (error) {
    console.error(`Error finding user by wallet address ${walletAddress}:`, error);
    return null;
  }
}

// Helper untuk inisialisasi cache saat startup
async function initUserCache(): Promise<void> {
  try {
    console.log('Starting user cache initialization...');
    
    // Reset cache
    usersCache = [];
    usersCacheInitialized = false;
    
    // Check if database is ready before trying to access it
    let dbReady = false;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (!dbReady && retryCount < maxRetries) {
      try {
        // More robust database readiness check with retry
        await txhashDB.get('__test__').catch(err => {
          if (err.type === 'NotFoundError' || err.code === 'LEVEL_NOT_FOUND') {
            // This is expected for a non-existent key - database is working
            dbReady = true;
          } else {
            throw err;
          }
        });
        
        // If we get here without an error, database is accessible
        dbReady = true;
        console.log('Database connection verified, loading user data...');
      } catch (error) {
        retryCount++;
        console.log(`Database not ready (attempt ${retryCount}/${maxRetries}), waiting before retry...`);
        // Wait 2 seconds between retries
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!dbReady) {
      throw new Error('Database not accessible after multiple attempts');
    }
    
    // Get all keys with user: prefix
    let allKeys;
    try {
      allKeys = await txhashDB.keys().all();
    } catch (error) {
      console.error('Error retrieving keys from database:', error);
      throw new Error('Failed to retrieve user keys from database');
    }
    
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    console.log(`Found ${userKeys.length} user keys in database`);
    
    // Load all users into cache with proper error handling for each user
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        const user = JSON.parse(userData) as User;
        
        // Verify that the user has all required fields
        if (user && user.id && user.email) {
          usersCache.push(user);
          
          // Ensure email index exists
          await txhashDB.put(`user-email:${user.email.toLowerCase()}`, user.id)
            .catch(e => console.error(`Failed to ensure email index for user ${user.id}:`, e));
          
          // Ensure Google ID index exists if applicable
          if (user.googleId) {
            await txhashDB.put(`user-google:${user.googleId}`, user.id)
              .catch(e => console.error(`Failed to ensure Google ID index for user ${user.id}:`, e));
          }
        } else {
          console.error(`Invalid user data found for key ${key}:`, user);
        }
      } catch (error) {
        console.error(`Error loading user from key ${key}:`, error);
        // Continue to next user
      }
    }
    
    console.log(`Successfully loaded ${usersCache.length} users into cache`);
    
    // Set flag that cache is successfully initialized
    usersCacheInitialized = true;
    
    // Verify email indices
    console.log('Verifying email indices...');
    let fixedIndices = 0;
    
    for (const user of usersCache) {
      try {
        const storedId = await txhashDB.get(`user-email:${user.email.toLowerCase()}`).catch(() => null);
        
        if (!storedId || storedId !== user.id) {
          console.log(`Fixing email index for user ${user.id} (${user.email})`);
          await txhashDB.put(`user-email:${user.email.toLowerCase()}`, user.id);
          fixedIndices++;
        }
      } catch (error) {
        console.error(`Error verifying email index for user ${user.id}:`, error);
      }
    }
    
    if (fixedIndices > 0) {
      console.log(`Fixed ${fixedIndices} email indices`);
    } else {
      console.log('All email indices are valid');
    }
  } catch (error) {
    console.error('Error initializing user cache:', error);
    // Mark cache as not initialized
    usersCacheInitialized = false;
    // Clear any partial cache to prevent inconsistent state
    usersCache = [];
    throw error;
  }
}

// Fungsi untuk memastikan cache diinisialisasi
async function ensureCacheInitialized(): Promise<boolean> {
  try {
    // First verify database is ready before trying to initialize cache
    try {
      await txhashDB.get('__test__').catch(err => {
        if (err.type !== 'NotFoundError') throw err;
      });
      console.log('Database verified accessible during ensureCacheInitialized');
    } catch (error) {
      console.error('Database not ready during ensureCacheInitialized:', error);
      return false;
    }

    if (!usersCacheInitialized) {
      console.log('Cache not initialized, initializing now...');
      try {
        await initUserCache();
        if (usersCacheInitialized) {
          console.log('Cache initialization successful');
          return true;
        } else {
          console.error('Cache initialization failed to mark cache as initialized');
          return false;
        }
      } catch (error) {
        console.error('Error during cache initialization:', error);
        return false;
      }
    } else {
      // Cache is already initialized, but let's verify its contents
      console.log('Cache already initialized, verifying integrity');
      
      if (usersCache.length === 0) {
        console.log('Cache is empty, re-initializing to ensure correctness');
        try {
          await initUserCache();
          return usersCacheInitialized;
        } catch (err) {
          console.error('Failed to re-initialize empty cache:', err);
          return usersCacheInitialized; // Return current state even if re-init failed
        }
      }
      
      return true;
    }
  } catch (error) {
    console.error('Unexpected error in ensureCacheInitialized:', error);
    return usersCacheInitialized; // Return current state
  }
}

// Initialize user cache di startup aplikasi - dengan retry mechanism
(async function initializeCacheWithRetry() {
  let attemptCount = 0;
  const maxAttempts = 8; // Increased from 5
  const initialDelay = 2000; // Start with 2 seconds delay
  
  while (!usersCacheInitialized && attemptCount < maxAttempts) {
    try {
      attemptCount++;
      console.log(`Attempt ${attemptCount} to initialize user cache...`);
      await initUserCache();
      if (usersCacheInitialized) {
        console.log('User cache initialized successfully!');
      }
    } catch (error) {
      console.error(`Failed attempt ${attemptCount} to initialize cache:`, error);
      // Wait with exponential backoff (2s, 4s, 8s, etc.)
      const delay = initialDelay * Math.pow(1.5, attemptCount - 1);
      console.log(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  if (!usersCacheInitialized) {
    console.error(`Failed to initialize user cache after ${maxAttempts} attempts. Will continue but may cause issues.`);
    console.error('Users may still be able to log in through direct database access, but performance might be affected.');
  }
})();

// Fungsi helper untuk menyimpan histori perubahan profil
async function saveProfileChangeHistory(history: ProfileChangeHistory): Promise<void> {
  try {
    // Simpan histori di database dengan format key yang unik berdasarkan timestamp
    await txhashDB.put(`profile-history:${history.userId}:${history.timestamp}`, JSON.stringify(history));
    console.log(`Profile change history saved for user ${history.userId}`);
  } catch (error) {
    console.error(`Error saving profile change history for user ${history.userId}:`, error);
  }
}

// Fungsi helper untuk mendapatkan histori perubahan profil
async function fetchProfileChangeHistory(userId: string): Promise<ProfileChangeHistory[]> {
  try {
    // Dapatkan semua kunci histori untuk user tertentu
    const allKeys = await txhashDB.keys().all();
    const userHistoryKeys = allKeys.filter(key => key.toString().startsWith(`profile-history:${userId}:`));
    
    const historyList: ProfileChangeHistory[] = [];
    
    for (const key of userHistoryKeys) {
      try {
        const historyData = await txhashDB.get(key);
        historyList.push(JSON.parse(historyData) as ProfileChangeHistory);
      } catch (error) {
        console.error(`Error loading history from key ${key}:`, error);
      }
    }
    
    // Urutkan berdasarkan timestamp terbaru
    return historyList.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error(`Error retrieving profile change history for user ${userId}:`, error);
    return [];
  }
}

/**
 * Mendaftarkan user baru dengan role yang dipilih
 */
const register = async (req: Request, res: Response) => {
  try {
    // Pastikan cache telah diinisialisasi
    await ensureCacheInitialized();
    
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, dan role diperlukan'
      });
    }
    
    // Validasi role
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }
    
    // Cek apakah email sudah digunakan
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah digunakan'
      });
    }
    
    // Generate keypair
    const keyPair = generateKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic().encode('hex', false);
    
    // Encrypt private key with user password
    const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const userId = uuidv4();
    const verificationToken = generateEmailVerificationToken(userId);
    const verificationExpires = Date.now() + (24 * 60 * 60 * 1000); // 24 jam
    
    // Create user
    const walletAddress = publicKey;
    
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
      walletAddress,
      encryptedPrivateKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      authMethods: ['email']
    };
    
    // Save user to database
    await saveUserToDb(newUser);
    
    // Kirim email verifikasi
    try {
      // URL yang akan diakses pengguna untuk verifikasi
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${verificationToken}`;
      
      // Template email
      const htmlContent = createVerificationEmailTemplate(name, verificationUrl);
      
      // Kirim email
      await sendEmail({
        to: email,
        subject: 'Verifikasi Akun AgriChain Anda',
        html: htmlContent
      });
      
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Tidak mengembalikan error ke pengguna, tetapi mencatat ke log
    }
    
    // Return user tanpa password dan private key
    const { password: _password, encryptedPrivateKey: _encryptedKey, emailVerificationToken: _token, ...userResponse } = newUser;
    
    return res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      user: userResponse
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mendaftarkan user',
      error: error.message
    });
  }
};

/**
 * Login user dengan email dan password
 */
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log(`Login attempt for email: ${email}`);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Normalisasi email untuk konsistensi
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if database is ready - but a NOT_FOUND error is actually expected and means the DB is working!
    try {
      await txhashDB.get('__test__').catch(err => {
        // NOT_FOUND error is expected and indicates the database is working correctly
        if (err.type !== 'NotFoundError' && err.code !== 'LEVEL_NOT_FOUND') {
          throw err;
        }
        // If we get a NOT_FOUND error, the database is working fine
        console.log('Database is accessible (NOT_FOUND error is expected)');
      });
    } catch (error) {
      // Type check the error object before accessing its properties
      if (typeof error === 'object' && error !== null) {
        const levelError = error as { type?: string; code?: string };
        // Only return error if it's not a NOT_FOUND error
        if (levelError.type !== 'NotFoundError' && levelError.code !== 'LEVEL_NOT_FOUND') {
          console.error('Database truly not ready during login attempt:', error);
          return res.status(503).json({
            success: false,
            message: "Database service unavailable, please try again in a moment"
          });
        }
      } else {
        // Unknown error type
        console.error('Unknown database error during login attempt:', error);
        return res.status(503).json({
          success: false,
          message: "Database service unavailable, please try again in a moment"
        });
      }
    }

    // First, try to ensure cache is initialized if not already
    if (!usersCacheInitialized) {
      console.log('Cache not initialized during login attempt, trying to initialize...');
      try {
        await ensureCacheInitialized();
      } catch (error) {
        console.error('Failed to initialize cache during login, continuing with direct DB access');
        // We'll still continue with direct DB access
      }
    }

    // Cari user berdasarkan email (case insensitive) - getUserByEmail now prioritizes direct DB lookup
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      console.log(`Login failed: User with email ${normalizedEmail} not found`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log(`User found: ${user.id}, comparing passwords`);
    
    // Verify the user data is complete
    if (!user.password) {
      console.error(`User ${user.id} has no password hash stored`);
      return res.status(500).json({
        success: false,
        message: "User account data is incomplete, please contact support"
      });
    }
    
    // Verifikasi password dengan bcrypt
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.password);
      console.log(`Password match result: ${passwordMatch}`);
    } catch (error) {
      console.error(`Error comparing passwords for user ${user.id}:`, error);
      return res.status(500).json({
        success: false,
        message: "Authentication error, please try again"
      });
    }
    
    if (!passwordMatch) {
      console.log(`Login failed: Password mismatch for user ${user.id}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Cek apakah user sudah memiliki wallet
    let privateKey = '';
    let walletAddress = user.walletAddress;

    if (user.encryptedPrivateKey) {
      try {
        // Dekripsi private key untuk verifikasi password
        privateKey = decryptPrivateKey(user.encryptedPrivateKey, password);
      } catch (error) {
        console.error(`Error decrypting private key for user ${user.id}:`, error);
        return res.status(500).json({
          success: false,
          message: "Error retrieving wallet information"
        });
      }
    } else if (!walletAddress) {
      // Jika belum ada wallet, generate baru secara otomatis
      try {
        const keyPair = generateKeyPair();
        walletAddress = keyPair.getPublic("hex");
        privateKey = keyPair.getPrivate("hex");

        // Simpan di blockchain state
        await stateDB.put(
          walletAddress,
          JSON.stringify({
            address: walletAddress,
            balance: 0,
            userId: user.id
          })
        );

        // Update user
        user.walletAddress = walletAddress;
        user.encryptedPrivateKey = encryptPrivateKey(privateKey, password);
        user.updatedAt = Date.now();
        
        // Simpan perubahan ke database
        await saveUserToDb(user);
        console.log(`Generated new wallet for user ${user.id}`);
      } catch (error) {
        console.error(`Error generating wallet for user ${user.id}:`, error);
        return res.status(500).json({
          success: false,
          message: "Error generating wallet information"
        });
      }
    }

    // Generate JWT token using config secret
    const token = jwt.sign(
      { id: user.id, role: user.role, walletAddress },
      process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
      { expiresIn: '24h' }
    );

    // Update last login time
    user.updatedAt = Date.now();
    try {
      await saveUserToDb(user);
      console.log(`Updated last login time for user ${user.id}`);
    } catch (error) {
      // Not critical, just log
      console.error(`Failed to update last login time for user ${user.id}:`, error);
    }

    // Kirim respons
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          walletAddress
        },
        token,
        privateKey: privateKey || undefined // Hanya jika baru generate wallet
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during login"
    });
  }
};

/**
 * Mengambil private key (hanya dengan password)
 */
const getPrivateKey = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.user?.id;

    console.log(`getPrivateKey - Processing request for user ID: ${userId}`);

    if (!userId || !password) {
      console.log(`getPrivateKey - Missing userId or password: userId=${!!userId}, password=${!!password}`);
      return res.status(400).json({
        success: false,
        message: "Authentication and password required"
      });
    }

    // Cari user
    console.log(`getPrivateKey - Fetching user data for ${userId}`);
    const user = await getUserById(userId);
    
    if (!user) {
      console.log(`getPrivateKey - User not found: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (!user.encryptedPrivateKey) {
      console.log(`getPrivateKey - No encrypted private key found for user: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "Wallet not found or not properly initialized. Contact administrator."
      });
    }

    // Dekripsi private key
    try {
      console.log(`getPrivateKey - Attempting to decrypt private key for user: ${userId}`);
      const privateKey: string = decryptPrivateKey(user.encryptedPrivateKey, password);

      // VALIDASI FORMAT PRIVATE KEY ETHEREUM
      const isValidPrivateKey = typeof privateKey === 'string' && /^(0x)?[0-9a-fA-F]{64}$/.test(privateKey);
      if (!isValidPrivateKey) {
        console.log(`getPrivateKey - Decryption failed or invalid private key for user: ${userId}`);
        return res.status(401).json({
          success: false,
          message: "Invalid password"
        });
      }

      console.log(`getPrivateKey - Successfully decrypted private key for user: ${userId}`);
      res.status(200).json({  
        success: true,
        data: {
          privateKey,
          walletAddress: user.walletAddress
        }
      });
    } catch (error) {
      console.log(`getPrivateKey - Failed to decrypt private key for user: ${userId} - Likely invalid password`);
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }
  } catch (error) {
    console.error("Error retrieving private key:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve private key"
    });
  }
};

const getUserList = async (_req: Request, res: Response) => {
  try {
    // Ambil semua data user dari database
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    
    const userList = [];
    
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        const user = JSON.parse(userData) as User;
        
        // Untuk keamanan, jangan tampilkan data sensitif
        const { password, encryptedPrivateKey, ...safeUser } = user;
        userList.push(safeUser);
      } catch (error) {
        console.error(`Error loading user from key ${key}:`, error);
      }
    }
    
    res.json({
      success: true,
      data: userList
    });
  } catch (error) {
    console.error("Error retrieving user list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user list"
    });
  }
}

const getUser = async (req: Request, res: Response) => {
  const { address } = req.params

  try {
    // Coba ambil dari blockchain address
    const blockchainUser = await stateDB.get(address).then((data) => JSON.parse(data));
    
    // Cari user yang sesuai
    const user = await getUserById(blockchainUser.userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Jangan tampilkan data sensitif
    const { password, encryptedPrivateKey, ...userInfo } = user;

    res.json({
      success: true,
      data: {
        ...userInfo,
        balance: blockchainUser.balance
      }
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
}

/**
 * Link Google account dengan user yang sudah ada
 */
const linkGoogleAccount = async (req: Request, res: Response) => {
  const { email, password, googleId } = req.body;
  
  if (!email || !password || !googleId) {
    return res.status(400).json({
      success: false,
      message: "Email, password, and googleId are required"
    });
  }
  
  try {
    // Normalisasi email untuk konsistensi
    const normalizedEmail = email.toLowerCase().trim();
    
    // Cari user
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    
    // Verifikasi password dengan bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    
    // Update dengan googleId
    user.googleId = googleId;
    user.updatedAt = Date.now();
    
    // Simpan perubahan
    await saveUserToDb(user);
    
    res.status(200).json({
      success: true,
      message: "Google account linked successfully"
    });
  } catch (error) {
    console.error("Error linking Google account:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while linking Google account"
    });
  }
};

/**
 * Login dengan Google (OAuth login)
 */
const googleLogin = async (req: Request, res: Response) => {
  try {
    // Jika menggunakan passport, req.user sudah ada
    if (req.user) {
      // Karena req.user dari middleware hanya memiliki id dan role,
      // kita perlu mencari user lengkap dari database untuk mendapatkan semua info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Cari user lengkap dari database untuk mendapatkan semua info
      const fullUser = await getUserById(userId);
      if (!fullUser) {
        return res.status(404).json({
          success: false,
          message: "User not found in database"
        });
      }
      
      // Dekripsi private key untuk penggunaan satu kali
      let privateKey = '';
      try {
        // Karena login Google, kita perlu cara lain untuk mengakses privateKey
        // Dapatkan dari encryptedPrivateKey jika diperlukan (hanya untuk keperluan demo)
        // Di produksi, sebaiknya tidak mengembalikan privateKey kecuali diminta khusus
        const randomPassword = fullUser.id; // Menggunakan ID sebagai "password" untuk dekripsi
        if (fullUser.encryptedPrivateKey) {
          privateKey = decryptPrivateKey(fullUser.encryptedPrivateKey, randomPassword);
        }
      } catch (error) {
        // Gagal mendekripsi privateKey bukan error fatal
        console.error("Failed to decrypt private key during Google login:", error);
      }
      
      // Generate token using config secret
      const token = jwt.sign(
        { id: fullUser.id, role: fullUser.role, walletAddress: fullUser.walletAddress },
        process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
        { expiresIn: '24h' }
      );
      
      // Update last login time
      fullUser.updatedAt = Date.now();
      await saveUserToDb(fullUser);
      
      return res.status(200).json({
        success: true,
        message: "Google login successful",
        data: {
          user: {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.name,
            role: fullUser.role,
            walletAddress: fullUser.walletAddress
          },
          token,
          privateKey: privateKey || undefined // Hanya jika bisa didekripsi
        }
      });
    }
    
    // Fallback untuk metode lama
    const { googleId, token: idToken, email, name } = req.body;
    
    if (!googleId && !idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID or token is required"
      });
    }
    
    // Cari user dengan googleId
    let user = await getUserByGoogleId(googleId);
    
    // If user doesn't exist and we have email/name, try to create one
    if (!user && email) {
      // Create a temporary user with unknown role
      const userId = `USER-${uuidv4().substring(0, 8)}`;
      
      // Generate a wallet
      const keyPair = generateKeyPair();
      const walletAddress = keyPair.getPublic("hex");
      const privateKey = keyPair.getPrivate("hex");
      
      // Use a random password (user ID) for encrypting private key
      const tempPassword = userId;
      const encryptedKey = encryptPrivateKey(privateKey, tempPassword);
      
      // Create user with 'unknown' role - they'll need to select a role
      const timestamp = Date.now();
      const newUser: User = {
        id: userId,
        email: email.toLowerCase(),
        password: await bcrypt.hash(tempPassword, 10), // Store hashed temporary password
        name: name || 'Google User',
        role: 'UNKNOWN' as UserRole, // Use 'UNKNOWN' role to redirect to role selection
        walletAddress,
        encryptedPrivateKey: encryptedKey,
        googleId,
        createdAt: timestamp,
        updatedAt: timestamp,
        isEmailVerified: true  // Email already verified since it's from Google
      };
      
      // Save wallet in blockchain state
      await stateDB.put(
        walletAddress,
        JSON.stringify({
          address: walletAddress,
          balance: 0,
          userId: userId
        })
      );
      
      // Save the new user
      await saveUserToDb(newUser);
      user = newUser;
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account linked with this Google account"
      });
    }
    
    // Update last login time
    user.updatedAt = Date.now();
    await saveUserToDb(user);
    
    // Generate token using config secret
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, walletAddress: user.walletAddress },
      process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          walletAddress: user.walletAddress
        },
        token: jwtToken
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during Google login"
    });
  }
};

/**
 * Memperbarui profil pengguna yang sedang login
 * Hanya atribut tertentu yang boleh diubah (name, phone, address, profilePicture)
 * Atribut penting seperti email, role, password tidak boleh diubah melalui fungsi ini
 */
const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Cari user dari database
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Define current time for timestamps
    const currentTime = Date.now();

    // Ambil data yang akan diupdate
    const { name, phone, address, profilePicture, email, role, password } = req.body;

    // Cek jika ada upaya mengubah atribut terlarang
    if (email !== undefined || role !== undefined || password !== undefined) {
      return res.status(403).json({
        success: false,
        message: "Email, role, dan password tidak dapat diubah melalui update profile. Harap gunakan endpoint yang sesuai untuk perubahan data sensitif"
      });
    }

    // Validasi bahwa ada setidaknya satu field yang boleh diubah
    if (name === undefined && phone === undefined && address === undefined && profilePicture === undefined) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada data yang diperbarui. Tentukan setidaknya satu field yang ingin diubah (name, phone, address, atau profilePicture)."
      });
    }

    // Untuk menyimpan histori perubahan
    const changedFields: string[] = [];
    const oldValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    // Validasi nama jika disediakan
    if (name !== undefined) {
      if (!name || name.length < 3 || name.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Nama harus antara 3-50 karakter"
        });
      }
      
      // Validasi nama hanya boleh huruf dan spasi
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(name)) {
        return res.status(400).json({
          success: false,
          message: "Nama hanya boleh berisi huruf dan spasi"
        });
      }
      
      if (name !== user.name) {
        changedFields.push('name');
        oldValues['name'] = user.name;
        newValues['name'] = name;
        user.name = name;
      }
    }

    // Validasi nomor telepon jika disediakan
    if (phone !== undefined) {
      // Validasi format nomor telepon
      const phoneRegex = /^\+?[0-9]{10,15}$/;
      if (phone && !phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Format nomor telepon tidak valid (gunakan format +628xxx atau 08xxx)"
        });
      }
      
      if (phone !== user.phone) {
        changedFields.push('phone');
        oldValues['phone'] = user.phone;
        newValues['phone'] = phone;
        user.phone = phone;
      }
    }

    // Validasi alamat jika disediakan
    if (address !== undefined) {
      if (address && (address.length < 5 || address.length > 200)) {
        return res.status(400).json({
          success: false,
          message: "Alamat harus antara 5-200 karakter"
        });
      }
      
      if (address !== user.address) {
        changedFields.push('address');
        oldValues['address'] = user.address;
        newValues['address'] = address;
        user.address = address;
      }
    }

    // Validasi URL foto profil jika disediakan
    if (profilePicture !== undefined) {
      if (profilePicture) {
        try {
          new URL(profilePicture);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "URL foto profil tidak valid"
          });
        }
      }
      
      if (profilePicture !== user.profilePicture) {
        changedFields.push('profilePicture');
        oldValues['profilePicture'] = user.profilePicture;
        newValues['profilePicture'] = profilePicture;
        user.profilePicture = profilePicture;
      }
    }

    // Jika tidak ada perubahan, kembalikan respons
    if (changedFields.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Tidak ada perubahan yang dilakukan pada profil",
        data: { 
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          walletAddress: user.walletAddress,
          phone: user.phone,
          address: user.address,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }

    // Update timestamp
    user.updatedAt = currentTime;

    // Simpan perubahan ke database
    await saveUserToDb(user);

    // Simpan histori perubahan
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    await saveProfileChangeHistory({
      userId,
      timestamp: currentTime,
      changedFields,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });

    // Jangan tampilkan data sensitif dalam respons
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      walletAddress: user.walletAddress,
      phone: user.phone,
      address: user.address,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: userResponse
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile"
    });
  }
};

/**
 * Memperbarui role pengguna yang sedang login
 */
const updateUserRole = async (req: Request, res: Response) => {
  try {
    // Pastikan user sudah login & ambil ID dari request (set oleh middleware auth)
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Anda harus login untuk mengubah role"
      });
    }
    
    // Ambil role dari body request
    const { role } = req.body;
    
    // Validasi role yang dikirim
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid. Harap pilih role yang sesuai."
      });
    }
    
    // Ambil data user saat ini
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan"
      });
    }
    
    // Catat perubahan untuk history
    const oldValues = { role: user.role };
    const newValues = { role: role as UserRole };
    
    // Update role
    user.role = role as UserRole;
    user.updatedAt = Date.now();
    
    // Simpan perubahan
    await saveUserToDb(user);
    
    // Catat history perubahan
    await saveProfileChangeHistory({
      userId: user.id,
      timestamp: Date.now(),
      changedFields: ['role'],
      oldValues,
      newValues,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string
    });
    
    // Return response sukses
    return res.status(200).json({
      success: true,
      message: "Role pengguna berhasil diperbarui",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress
      }
    });
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan dalam memperbarui role: " + (error.message || "Unknown error")
    });
  }
};

/**
 * Mengubah password pengguna
 */
const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan baru diperlukan"
      });
    }

    // Validasi format password baru
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus minimal 8 karakter"
      });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus mengandung setidaknya satu huruf besar, satu huruf kecil, satu angka, dan satu karakter khusus"
      });
    }

    // Cari user dari database
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verifikasi password lama menggunakan bcrypt
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Password lama tidak valid"
      });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Re-encrypt private key dengan password baru jika ada
    if (user.encryptedPrivateKey) {
      try {
        // Dekripsi dengan password lama
        const privateKey = decryptPrivateKey(user.encryptedPrivateKey, oldPassword);
        // Enkripsi ulang dengan password baru
        user.encryptedPrivateKey = encryptPrivateKey(privateKey, newPassword);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Gagal mengenkripsi ulang private key"
        });
      }
    }

    // Update timestamp
    user.updatedAt = Date.now();

    // Simpan perubahan ke database
    await saveUserToDb(user);

    res.status(200).json({
      success: true,
      message: "Password berhasil diubah"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

/**
 * Find or create a user based on Google profile
 */
const findOrCreateGoogleUser = async (profile: Profile): Promise<User | null> => {
  try {
    // Check if user exists with this Google ID
    let user = await getUserByGoogleId(profile.id);
    
    // If user exists, return it
    if (user) {
      return user;
    }
    
    // If not, check if email exists
    const email = profile.emails?.[0]?.value;
    if (!email) {
      console.error("Cannot create user: no email provided in Google profile");
      return null;
    }
    
    // Check if user exists with this email
    user = await getUserByEmail(email);
    
    // If user exists, link Google ID to existing account
    if (user) {
      user.googleId = profile.id;
      user.updatedAt = Date.now();
      
      // Add 'google' to authMethods if not already present
      if (!user.authMethods) {
        user.authMethods = ['email', 'google'];
      } else if (!user.authMethods.includes('google')) {
        user.authMethods.push('google');
      }
      
      await saveUserToDb(user);
      return user;
    }
    
    // At this point, this is a new user - but we don't create an account yet
    // Just return null and let the registration process handle it
    return null;
  } catch (error) {
    console.error("Error in findOrCreateGoogleUser:", error);
    return null;
  }
};

/**
 * Register a new user with Google account (enhanced)
 */
const registerWithGoogle = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    const googleProfile = (req.session as any).googleProfile;
    
    if (!googleProfile) {
      return res.status(400).json({
        success: false,
        message: "No Google profile found. Please authenticate with Google first."
      });
    }
    
    // Get profile information
    const googleId = googleProfile.id;
    const email = googleProfile.emails?.[0]?.value;
    const name = googleProfile.displayName || `${googleProfile.name?.givenName || ''} ${googleProfile.name?.familyName || ''}`.trim();
    const profilePicture = googleProfile.photos?.[0]?.value;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required but not provided by Google."
      });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `Email ${email} is already registered. Please login instead.`
      });
    }
    
    // Create new user ID
    const userId = `${role.toUpperCase().substring(0, 4)}-${uuidv4().substring(0, 8)}`;
    
    // Generate a wallet
    const ec = new EC('secp256k1');
    const keyPair = ec.genKeyPair();
    const walletAddress = keyPair.getPublic('hex');
    const privateKey = keyPair.getPrivate('hex');
    
    // Generate a random password for the account (user can change later if needed)
    const temporaryPassword = uuidv4();
    const encryptedKey = encryptPrivateKey(privateKey, temporaryPassword);
    
    // Hash the temporary password before storing
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    
    // Save wallet in blockchain state
    await stateDB.put(
      walletAddress,
      JSON.stringify({
        address: walletAddress,
        balance: 0,
        userId: userId
      })
    );
    
    // Create and save the new user
    const timestamp = Date.now();
    const newUser: User = {
      id: userId,
      email: email.toLowerCase(),
      password: hashedPassword, // Store hashed temporary password
      name,
      role,
      walletAddress,
      encryptedPrivateKey: encryptedKey,
      googleId,
      profilePicture,
      createdAt: timestamp,
      updatedAt: timestamp,
      isEmailVerified: true,  // Email already verified since it's from Google
      authMethods: ['google']  // User registered with Google
    };
    
    await saveUserToDb(newUser);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
      { expiresIn: '24h' }
    );
    
    // Clear the session data
    delete (req.session as any).googleProfile;
    
    // Return user data and token
    return res.status(201).json({
      success: true,
      message: "User registered successfully with Google account",
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          walletAddress: newUser.walletAddress,
          profilePicture: newUser.profilePicture,
          isEmailVerified: true,
          authMethods: newUser.authMethods
        },
        token,
        privateKey // IMPORTANT: Only show this once!
      }
    });
  } catch (error) {
    console.error("Error in registerWithGoogle:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred during Google registration"
    });
  }
};

/**
 * Kirim email verifikasi ke user yang baru mendaftar
 */
const sendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Cari user dari database
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Cek apakah email sudah diverifikasi
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified"
      });
    }

    // Buat token verifikasi email
    const token = generateEmailVerificationToken(userId);
    
    // Simpan token dan tanggal kedaluwarsa ke user
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 jam
    user.updatedAt = Date.now();
    
    // Simpan perubahan ke database
    await saveUserToDb(user);

    // Buat URL verifikasi
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${token}`;
    
    // Buat template email
    const htmlTemplate = createVerificationEmailTemplate(user.name, verificationUrl);
    
    // Kirim email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Verifikasi Email - Agrichain',
      html: htmlTemplate
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email"
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully"
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending verification email"
    });
  }
};

/**
 * Verifikasi email user dengan token
 */
const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required"
      });
    }

    // Verifikasi token
    const decoded = verifyEmailToken(token);
    if (!decoded || decoded.purpose !== 'email-verification') {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Cari user berdasarkan ID dari token
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Cek apakah token di database sama dengan token yang diberikan
    if (user.emailVerificationToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Cek apakah token sudah kedaluwarsa
    if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token has expired"
      });
    }

    // Update user sebagai terverifikasi
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.updatedAt = Date.now();
    
    // Simpan perubahan ke database
    await saveUserToDb(user);

    // Kirim respons berhasil dengan halaman HTML sederhana
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified - Agrichain</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
          h1 { color: #4CAF50; }
          .success-icon { font-size: 80px; color: #4CAF50; margin: 20px 0; }
          .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Email Berhasil Diverifikasi!</h1>
        <div class="success-icon">✓</div>
        <p>Terima kasih, email Anda telah berhasil diverifikasi. Anda sekarang dapat menggunakan semua fitur Agrichain.</p>
        <a href="/login" class="button">Kembali ke Login</a>
      </body>
      </html>
    `;
    
    res.send(successHtml);
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while verifying email"
    });
  }
};

/**
 * Meminta reset password dengan mengirim email
 */
const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Normalisasi email
    const normalizedEmail = email.toLowerCase().trim();

    // Cari user berdasarkan email
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      // Untuk keamanan, tidak memberitahu apakah email terdaftar atau tidak
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent"
      });
    }

    // Buat token reset password
    const token = generatePasswordResetToken(user.id);
    
    // Simpan token dan tanggal kedaluwarsa ke user
    user.passwordResetToken = token;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 jam
    user.updatedAt = Date.now();
    
    // Simpan perubahan ke database
    await saveUserToDb(user);

    // Buat URL reset password
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;
    
    // Buat template email
    const htmlTemplate = createPasswordResetEmailTemplate(user.name, resetUrl);
    
    // Kirim email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Reset Password - Agrichain',
      html: htmlTemplate
    });

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send reset password email"
      });
    }

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent"
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while requesting password reset"
    });
  }
};

/**
 * Halaman form reset password
 */
const resetPasswordForm = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).send('Token tidak valid atau sudah kedaluwarsa');
    }

    // Verifikasi token tanpa memeriksa user (pemeriksaan terperinci dilakukan saat submit)
    const decoded = verifyEmailToken(token);
    if (!decoded || decoded.purpose !== 'password-reset') {
      return res.status(400).send('Token tidak valid atau sudah kedaluwarsa');
    }

    // Tampilkan form reset password
    const resetForm = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reset Password - Agrichain</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; text-align: center; }
          form { background: #f9f9f9; padding: 20px; border-radius: 5px; }
          .form-group { margin-bottom: 15px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ddd; border-radius: 4px; }
          .error { color: #e74c3c; margin-top: 5px; display: none; }
          .submit-btn { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 16px; }
          .submit-btn:hover { background: #45a049; }
          .requirements { font-size: 12px; color: #666; margin-top: 5px; }
        </style>
      </head>
      <body>
        <h1>Reset Password</h1>
        <form id="resetForm" action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="token" value="${token}">
          
          <div class="form-group">
            <label for="password">Password Baru</label>
            <input type="password" id="password" name="password" required>
            <div class="requirements">
              Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
            </div>
            <div class="error" id="passwordError">Password tidak memenuhi persyaratan</div>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Konfirmasi Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
            <div class="error" id="confirmError">Password tidak cocok</div>
          </div>
          
          <button type="submit" class="submit-btn">Reset Password</button>
        </form>
        
        <script>
          document.getElementById('resetForm').addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            let valid = true;
            
            // Validasi password
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
              document.getElementById('passwordError').style.display = 'block';
              valid = false;
            } else {
              document.getElementById('passwordError').style.display = 'none';
            }
            
            // Validasi konfirmasi password
            if (password !== confirmPassword) {
              document.getElementById('confirmError').style.display = 'block';
              valid = false;
            } else {
              document.getElementById('confirmError').style.display = 'none';
            }
            
            if (!valid) {
              e.preventDefault();
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.send(resetForm);
  } catch (error) {
    console.error("Error showing reset password form:", error);
    res.status(500).send('Terjadi kesalahan. Silakan coba lagi nanti.');
  }
};

/**
 * Proses reset password
 */
const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token and password are required"
      });
    }

    // Validasi format password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters"
      });
    }

    // Verifikasi token
    const decoded = verifyEmailToken(token);
    if (!decoded || decoded.purpose !== 'password-reset') {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    // Cari user berdasarkan ID dari token
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Cek apakah token di database sama dengan token yang diberikan
    if (user.passwordResetToken !== token) {
      return res.status(400).json({
        success: false,
        message: "Invalid token"
      });
    }

    // Cek apakah token sudah kedaluwarsa
    if (user.passwordResetExpires && user.passwordResetExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token has expired"
      });
    }

    // Generate kunci wallet baru jika ada
    let privateKey = '';
    if (user.encryptedPrivateKey) {
      try {
        // Dekripsi dengan password lama - gunakan ID sebagai fallback untuk kasus Google login
        const oldPassword = user.id;
        privateKey = decryptPrivateKey(user.encryptedPrivateKey, oldPassword);
        
        // Enkripsi ulang dengan password baru
        user.encryptedPrivateKey = encryptPrivateKey(privateKey, password);
      } catch (error) {
        console.error("Failed to re-encrypt private key:", error);
        // Tidak batalkan proses reset password meskipun enkripsi gagal
      }
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.updatedAt = Date.now();
    
    // Simpan perubahan ke database
    await saveUserToDb(user);

    // Kirim respons berhasil dengan halaman HTML sederhana
    const successHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Password Reset Successful - Agrichain</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
          h1 { color: #4CAF50; }
          .success-icon { font-size: 80px; color: #4CAF50; margin: 20px 0; }
          .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Password Berhasil Direset!</h1>
        <div class="success-icon">✓</div>
        <p>Password Anda telah berhasil diubah. Anda sekarang dapat login dengan password baru Anda.</p>
        <a href="/login" class="button">Kembali ke Login</a>
      </body>
      </html>
    `;
    
    res.send(successHtml);
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while resetting password"
    });
  }
};

/**
 * Mendapatkan histori perubahan profil pengguna
 */
const getProfileChangeHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Cari user dari database untuk verifikasi
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Dapatkan histori perubahan profil
    const history = await fetchProfileChangeHistory(userId);
    
    // Hilangkan data sensitif seperti IP address dan user agent dari respons
    const safeHistory = history.map(item => {
      const { ipAddress, userAgent, ...safeItem } = item;
      return safeItem;
    });

    res.status(200).json({
      success: true,
      data: safeHistory
    });
  } catch (error) {
    console.error("Error retrieving profile change history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile change history"
    });
  }
};

/**
 * Mendapatkan user berdasarkan ID dari user yang login
 */
const getCurrentUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Cari user dari database
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Dapatkan saldo dari blockchain state jika wallet address ada
    let balance = 0;
    if (user.walletAddress) {
      try {
        const walletData = await stateDB.get(user.walletAddress);
        const walletInfo = JSON.parse(walletData);
        balance = walletInfo.balance || 0;
      } catch (error) {
        console.error(`Error fetching wallet data for ${user.walletAddress}:`, error);
        // Lanjutkan meskipun ada error, dengan balance = 0
      }
    }

    // Jangan tampilkan data sensitif
    const { password, encryptedPrivateKey, ...userInfo } = user;

    res.status(200).json({
      success: true,
      data: {
        ...userInfo,
        balance
      }
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user information"
    });
  }
};

// Get user profile info from auth token
const getProfileInfo = async (req: Request, res: Response) => {
  try {
    console.log("getProfileInfo called");
    
    // Log auth header to debug jwt issues
    const authHeader = req.headers.authorization;
    console.log(`Auth header present: ${!!authHeader}`);
    
    // The user ID should come from the auth middleware
    const userId = req.user?.id;
    console.log(`User ID from request: ${userId || 'not found'}`);
    
    if (!userId) {
      console.log("No user ID found in request - auth middleware may not be working correctly");
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    console.log(`Looking up user with ID: ${userId}`);
    const user = await getUserById(userId);
    
    if (!user) {
      console.log(`User with ID ${userId} not found in database`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log(`User found: ${user.id}, ${user.name}, ${user.email}`);
    
    // Remove sensitive fields
    const { password, encryptedPrivateKey, emailVerificationToken, 
            passwordResetToken, passwordResetExpires, ...safeUserData } = user;

    // Derive a public key from the wallet address as a simple transformation
    // This is just a placeholder - in a real implementation this would use proper crypto
    const publicKey = user.walletAddress ? 
      `0x${user.walletAddress.slice(2).split('').reverse().join('')}` : null;

    // For balance, we would need access to the stateDB, but since we don't have it
    // in our imports, we'll just return 0 for now
    const balance = 0;

    const responseData = {
      ...safeUserData,
      publicKey,
      balance
    };
    
    console.log(`Successfully retrieving profile for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error in getProfileInfo:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user profile',
    });
  }
};

/**
 * Mendapatkan statistik jumlah pengguna berdasarkan peran/role
 * Endpoint publik yang tidak memerlukan autentikasi
 */
const getUserStatistics = async (_req: Request, res: Response) => {
  try {
    // Pastikan cache sudah diinisialisasi
    await ensureCacheInitialized();
    
    console.log("Getting user statistics...");
    
    // Ambil semua data user dari database
    const allKeys = await txhashDB.keys().all();
    console.log(`Found ${allKeys.length} total keys`);
    
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    console.log(`Found ${userKeys.length} user keys`);
    
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
        const user = JSON.parse(userData) as User;
        
        // Tambahkan ke total
        statistics.totalUsers++;
        
        // Tambahkan ke counter berdasarkan role
        switch(user.role) {
          case UserRole.FARMER:
            statistics.farmerCount++;
            break;
          case UserRole.COLLECTOR:
            statistics.collectorCount++;
            break;
          case UserRole.TRADER:
            statistics.traderCount++;
            break;
          case UserRole.RETAILER:
            statistics.retailerCount++;
            break;
          case UserRole.CONSUMER:
            statistics.consumerCount++;
            break;
          case UserRole.UNKNOWN:
          default:
            statistics.unknownCount++;
            break;
        }
      } catch (error) {
        console.error(`Error loading user from key ${key}:`, error);
      }
    }
    
    console.log("User statistics calculated:", statistics);
    
    // Kirim respons
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error("Error retrieving user statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics"
    });
  }
};

/**
 * Mendapatkan tren pendaftaran pengguna berdasarkan periode waktu
 */
const getUserSignupTrend = async (req: Request, res: Response) => {
  try {
    // Get period from query params (default to monthly)
    const period = (req.query.period as string) || 'monthly';
    
    // Validate period parameter
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid period. Must be one of: weekly, monthly, yearly"
      });
    }

    // Ensure cache is initialized
    await ensureCacheInitialized();
    
    // Ambil semua data user dari database
    const allKeys = await txhashDB.keys().all();
    const userKeys = allKeys.filter(key => key.toString().startsWith('user:'));
    
    // Get all users with their creation timestamps
    const users = [];
    for (const key of userKeys) {
      try {
        const userData = await txhashDB.get(key);
        const user = JSON.parse(userData) as User;
        users.push({
          id: user.id,
          createdAt: user.createdAt || 0
        });
      } catch (error) {
        console.error(`Error loading user from key ${key}:`, error);
      }
    }
    
    // Sort users by creation date
    users.sort((a, b) => a.createdAt - b.createdAt);
    
    // Generate trend data based on period
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    let trendData: {label: string, count: number}[] = [];
    
    if (period === 'weekly') {
      // Last 12 weeks
      const oneWeek = 7 * oneDay;
      const startDate = now - (12 * oneWeek);
      
      // Create array of week labels
      const weeks = [];
      for (let i = 0; i < 12; i++) {
        const weekStart = new Date(startDate + (i * oneWeek));
        const weekLabel = `Week ${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
        weeks.push({
          label: weekLabel,
          start: startDate + (i * oneWeek),
          end: startDate + ((i + 1) * oneWeek),
          count: 0
        });
      }
      
      // Count users per week
      for (const user of users) {
        if (user.createdAt < startDate) continue;
        
        for (const week of weeks) {
          if (user.createdAt >= week.start && user.createdAt < week.end) {
            week.count++;
            break;
          }
        }
      }
      
      trendData = weeks.map(week => ({
        label: week.label,
        count: week.count
      }));
    } 
    else if (period === 'monthly') {
      // Last 12 months
      const months = [];
      const currentDate = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        const monthStart = date.getTime();
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
        
        months.push({
          label: `${monthName} ${year}`,
          start: monthStart,
          end: monthEnd,
          count: 0
        });
      }
      
      // Count users per month
      for (const user of users) {
        for (const month of months) {
          if (user.createdAt >= month.start && user.createdAt <= month.end) {
            month.count++;
            break;
          }
        }
      }
      
      trendData = months.map(month => ({
        label: month.label,
        count: month.count
      }));
    } 
    else if (period === 'yearly') {
      // Last 5 years
      const years = [];
      const currentYear = new Date().getFullYear();
      
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearStart = new Date(year, 0, 1).getTime();
        const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();
        
        years.push({
          label: year.toString(),
          start: yearStart,
          end: yearEnd,
          count: 0
        });
      }
      
      // Count users per year
      for (const user of users) {
        for (const year of years) {
          if (user.createdAt >= year.start && user.createdAt <= year.end) {
            year.count++;
            break;
          }
        }
      }
      
      trendData = years.map(year => ({
        label: year.label,
        count: year.count
      }));
    }
    
    res.status(200).json({
      success: true,
      data: {
        period,
        trends: trendData
      }
    });
  } catch (error) {
    console.error("Error retrieving user signup trend:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user signup trend data"
    });
  }
};

export { 
  getUserList, 
  getUser, 
  register, 
  login, 
  getPrivateKey,
  linkGoogleAccount,
  googleLogin,
  updateUserProfile,
  updateUserRole,
  changePassword,
  findOrCreateGoogleUser,
  registerWithGoogle,
  getProfileChangeHistory,
  sendVerificationEmail,
  verifyEmail,
  requestPasswordReset,
  resetPasswordForm,
  resetPassword,
  getCurrentUserById,
  getProfileInfo,
  getUserByWalletAddress,
  saveUserToDb,
  getUserStatistics,
  getUserSignupTrend
}
