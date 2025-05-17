import crypto from 'crypto';

/**
 * Mengenkripsi private key menggunakan password user dengan metode PKCS yang lebih aman
 * @param privateKey Private key dalam format hex
 * @param password Password yang digunakan untuk enkripsi
 * @returns Encrypted private key dalam format string
 */
export function encryptPrivateKey(privateKey: string, password: string): string {
  // Generate salt acak 16 bytes
  const salt = crypto.randomBytes(16);
  
  // Gunakan PBKDF2 untuk membuat key derivation yang lebih aman
  // 100000 iterasi untuk menambah waktu komputasi dan mengurangi risiko brute force
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  const iv = crypto.randomBytes(16); // Initialization Vector
  
  // Gunakan AES-256-CBC untuk enkripsi
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Gabungkan salt, iv, dan encrypted data dengan delimiter
  // Format: salt:iv:encryptedData
  const saltHex = salt.toString('hex');
  const ivHex = iv.toString('hex');
  
  return `${saltHex}:${ivHex}:${encrypted}`;
}

/**
 * Mendekripsi private key menggunakan password user
 * @param encryptedData Encrypted private key dari database
 * @param password Password yang digunakan saat enkripsi
 * @returns Decrypted private key dalam format hex
 * @throws Error jika password salah atau format tidak valid
 */
export function decryptPrivateKey(encryptedData: string, password: string): string {
  try {
    // Pisahkan salt, iv, dan encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Gunakan PBKDF2 dengan parameter yang sama seperti saat enkripsi
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
    
    // Gunakan AES-256-CBC untuk dekripsi
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt private key: Invalid password or corrupted data');
  }
}

/**
 * Hash password menggunakan algoritma yang aman
 * @param password Password yang akan di-hash
 * @returns Hashed password yang aman untuk disimpan di database
 */
export function hashPassword(password: string): string {
  // Generate salt acak 16 bytes
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash password menggunakan PBKDF2 dengan 100000 iterasi
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  // Gabungkan salt dan hash dengan delimiter
  return `${salt}:${hash}`;
}

/**
 * Verifikasi password dengan hash yang tersimpan
 * @param password Password yang dimasukkan user
 * @param hashedPassword Hashed password dari database
 * @returns Boolean yang menunjukkan apakah password valid
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    // Pisahkan salt dan hash
    const [salt, originalHash] = hashedPassword.split(':');
    
    // Hash password yang dimasukkan dengan salt yang sama
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    
    // Bandingkan hash
    return hash === originalHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
} 