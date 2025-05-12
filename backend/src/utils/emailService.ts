import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';

// Interface untuk opsi email
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Konfigurasi transporter email
const createTransporter = () => {
  // Gunakan variabel lingkungan, jika tidak ada gunakan nilai default untuk development
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER || 'your-email@gmail.com';
  const pass = process.env.EMAIL_PASSWORD || 'your-app-password';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true untuk port 465, false untuk port lain
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Fungsi untuk mengirim email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      ...options,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Fungsi untuk membuat token verifikasi email
 */
export const generateEmailVerificationToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, purpose: 'email-verification' },
    process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
    { expiresIn: '24h' }
  );
};

/**
 * Fungsi untuk membuat token reset password
 */
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign(
    { id: userId, purpose: 'password-reset' },
    process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key',
    { expiresIn: '1h' }
  );
};

/**
 * Fungsi untuk memverifikasi token
 */
export const verifyToken = (token: string): { id: string; purpose: string } | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || jwtConfig.secret || 'default_secret_key'
    ) as { id: string; purpose: string };
    
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Template email untuk verifikasi email
 */
export const createVerificationEmailTemplate = (name: string, verificationUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Verifikasi Email Anda - Agrichain</h2>
      <p>Halo ${name},</p>
      <p>Terima kasih telah mendaftar di Agrichain. Untuk mengaktifkan akun Anda, silakan verifikasi email Anda dengan mengklik tombol di bawah:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verifikasi Email</a>
      </div>
      <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${verificationUrl}</p>
      <p>Link ini akan kedaluwarsa dalam 24 jam.</p>
      <p>Jika Anda tidak membuat akun ini, Anda dapat mengabaikan email ini.</p>
      <p>Terima kasih,<br>Tim Agrichain</p>
    </div>
  `;
};

/**
 * Template email untuk reset password
 */
export const createPasswordResetEmailTemplate = (name: string, resetUrl: string): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #333;">Reset Password - Agrichain</h2>
      <p>Halo ${name},</p>
      <p>Kami menerima permintaan untuk reset password akun Agrichain Anda. Klik tombol di bawah untuk membuat password baru:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Atau, Anda dapat menyalin dan menempelkan URL berikut ke browser Anda:</p>
      <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
      <p>Link ini akan kedaluwarsa dalam 1 jam.</p>
      <p>Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini dan password Anda tidak akan berubah.</p>
      <p>Terima kasih,<br>Tim Agrichain</p>
    </div>
  `;
};