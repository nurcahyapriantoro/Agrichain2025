import { Router } from "express"
import passport from "passport"
import { 
  googleLogin, 
  findOrCreateGoogleUser, 
  registerWithGoogle, 
  verifyEmail, 
  sendVerificationEmail, 
  requestPasswordReset, 
  resetPasswordForm, 
  resetPassword,
  changePassword,
  updateUserProfile,
  getUserByWalletAddress,
  saveUserToDb
} from "../controller/UserController"
import { verifyWalletSignature, linkWallet, unlinkWallet } from "../controller/Web3AuthController"
import catcher from "../helper/handler"
import { configurePassport } from "../../config/passport"
import session from "express-session"
import { jwtConfig } from "../../config"
import { UserRole } from "../../enum"
import { Request, Response } from "express"
import { isAuthenticated } from "../middleware/auth"  // Fix: Menggunakan isAuthenticated bukan authenticateUser
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'
import { ethers } from 'ethers'
import { generateToken } from '../../utils/jwtHelper'

// Configure passport with our findOrCreateGoogleUser function
const passportInstance = configurePassport(findOrCreateGoogleUser);

const router = Router()

// Configure session middleware
router.use(session({
  secret: process.env.SESSION_SECRET || jwtConfig.secret,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize passport
router.use(passportInstance.initialize());
router.use(passportInstance.session());

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations including Google OAuth
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth authentication
 *     tags: [Auth]
 *     description: |
 *       Redirects the user to Google's OAuth 2.0 consent screen.
 *       This is the first step in the Google authentication flow.
 *       The user will be prompted to grant access to their profile and email.
 *     responses:
 *       302:
 *         description: Redirects to Google authentication page
 */
router.get('/google', (req, res, next) => {
  console.log('Starting Google OAuth flow...');
  next();
}, 
  passport.authenticate('google', { 
    scope: ['profile', 'email']
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback endpoint
 *     tags: [Auth]
 *     description: |
 *       Callback URL that Google redirects to after user authentication.
 *       - For existing users: Completes the authentication and returns a JWT token
 *       - For new users: Redirects to role selection page
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google (handled automatically)
 *       - in: query
 *         name: isNewUser
 *         schema:
 *           type: boolean
 *         description: Flag indicating if this is a new user registration
 *     responses:
 *       302:
 *         description: |
 *           Redirects to either:
 *           - Role selection page (for new users)
 *           - Frontend application with JWT token (for existing users)
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Authentication failed"
 */
router.get('/google/callback', (req, res, next) => {
  console.log('Auth route: Handling Google callback at path:', req.path);
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('Query params:', req.query);
  next();
},
  passport.authenticate('google', { 
    failureRedirect: '/login',
    session: true // Gunakan session untuk menyimpan profil sementara
  }),
  catcher((req: Request, res: Response) => {
    // Cek apakah pengguna baru atau sudah ada
    const isNewUser = req.query.isNewUser === 'true';
    console.log('User authentication successful, isNewUser:', isNewUser);
    
    if (isNewUser) {
      // Redirect ke halaman pilih role
      return res.redirect('/api/auth/select-role');
    }
    
    // Jika bukan pengguna baru, lanjutkan ke login seperti biasa
    return googleLogin(req, res);
  })
);

/**
 * @swagger
 * /auth/select-role:
 *   get:
 *     summary: Role selection page for new Google users
 *     tags: [Auth]
 *     description: |
 *       Displays a form for new users who authenticated with Google to select their role.
 *       This step is required before account creation is completed.
 *       The user must have authenticated with Google first to access this page.
 *     responses:
 *       200:
 *         description: HTML form for role selection
 *       302:
 *         description: Redirects to Google login if not authenticated
 */
router.get('/select-role', (req, res) => {
  // Cek apakah user sudah autentikasi dengan Google
  if (!(req.session as any).googleProfile) {
    return res.redirect('/api/auth/google');
  }
  
  // Kirim HTML form sederhana
  const roleOptions = Object.values(UserRole)
    .map(role => `<option value="${role}">${role}</option>`)
    .join('');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Pilih Role - Agrichain</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
      h1 { color: #333; }
      select { width: 100%; padding: 8px; margin: 10px 0; }
      button { background: #4285f4; color: white; border: none; padding: 10px 15px; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Pilih Role untuk Akun Anda</h1>
    <p>Anda berhasil login dengan Google. Silakan pilih role untuk akun Anda:</p>
    
    <form action="/api/auth/register-google" method="post">
      <select name="role" required>
        <option value="">-- Pilih Role --</option>
        ${roleOptions}
      </select>
      <p>
        <button type="submit">Daftar</button>
      </p>
    </form>
  </body>
  </html>
  `;
  
  res.send(html);
});

/**
 * @swagger
 * /auth/register-google:
 *   post:
 *     summary: Complete registration with Google account
 *     tags: [Auth]
 *     description: |
 *       Creates a new user account using the Google profile information and selected role.
 *       This endpoint:
 *       - Creates a blockchain wallet
 *       - Encrypts the private key
 *       - Generates a JWT token
 *       - Returns complete user information
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [FARMER, COLLECTOR, TRADER, RETAILER, CONSUMER, ADMIN, PRODUCER, INSPECTOR, MEDIATOR]
 *                 example: "FARMER"
 *                 description: User's role in the system
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully with Google account"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "FARM-12345678"
 *                         email:
 *                           type: string
 *                           example: "user@gmail.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         role:
 *                           type: string
 *                           example: "FARMER"
 *                         walletAddress:
 *                           type: string
 *                           example: "0x1234567890abcdef1234567890abcdef12345678"
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     privateKey:
 *                       type: string
 *                       description: Blockchain wallet private key (only shown once)
 *       400:
 *         description: Invalid input or missing Google profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Role tidak valid"
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
router.post('/register-google', catcher(registerWithGoogle));

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     description: |
 *       Verifies a user's email using the token sent to their email.
 *       This endpoint is accessed via the link in the verification email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully (returns HTML)
 *       400:
 *         description: Invalid or expired token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/verify-email/:token', catcher(verifyEmail));

/**
 * @swagger
 * /auth/send-verification-email:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     description: |
 *       Sends a new verification email to the user's email address.
 *       Can be used if the original verification email was lost or expired.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification email sent successfully"
 *       400:
 *         description: Email already verified
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to send email
 */
router.post('/send-verification-email', isAuthenticated, catcher(sendVerificationEmail));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     description: |
 *       Requests a password reset link to be sent to the user's email.
 *       This is the first step in the password reset flow.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Reset link sent if email exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "If an account exists with this email, a reset link has been sent"
 *       400:
 *         description: Email not provided
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', catcher(requestPasswordReset));

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   get:
 *     summary: Show password reset form
 *     tags: [Auth]
 *     description: |
 *       Shows the password reset form for a valid token.
 *       This page is accessed via the link in the reset password email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     responses:
 *       200:
 *         description: Reset password form (returns HTML)
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/reset-password/:token', catcher(resetPasswordForm));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Process password reset
 *     tags: [Auth]
 *     description: |
 *       Processes a password reset request with a new password.
 *       This is called from the password reset form.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful (returns HTML)
 *       400:
 *         description: Invalid token or password requirements not met
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', catcher(resetPassword));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     description: |
 *       Allows authenticated users to change their password.
 *       Requires the current password for verification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password berhasil diubah"
 *       400:
 *         description: Password requirements not met or missing required fields
 *       401:
 *         description: Not authenticated or incorrect old password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/change-password', isAuthenticated, catcher(changePassword));

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     description: |
 *       Updates the authenticated user's profile information.
 *       Only certain fields can be updated (name, phone, address, profilePicture).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's full name
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               address:
 *                 type: string
 *                 description: User's physical address
 *               profilePicture:
 *                 type: string
 *                 format: uri
 *                 description: URL to user's profile picture
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profil berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     address:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Attempting to change protected fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/update-profile', isAuthenticated, catcher(updateUserProfile));

/**
 * @swagger
 * /auth/login-success:
 *   get:
 *     summary: Success page after authentication
 *     tags: [Auth]
 *     description: |
 *       Page that displays a success message after successful authentication.
 *       This can be used as a callback target or redirect destination.
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 */
router.get('/login-success', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Login successful"
  });
});

/**
 * @swagger
 * /auth/web3-login:
 *   post:
 *     summary: Authenticate using MetaMask wallet
 *     tags: [Auth]
 *     description: Verifies a signature from MetaMask to authenticate a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - signature
 *               - message
 *             properties:
 *               address:
 *                 type: string
 *                 description: Ethereum wallet address
 *               signature:
 *                 type: string
 *                 description: Signature of the message signed by user's private key
 *               message:
 *                 type: string
 *                 description: Plain text message that was signed
 *               chainId:
 *                 type: string
 *                 description: Chain ID from which the signature was generated
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Authentication successful"
 *                 token:
 *                   type: string
 *                   example: "jwt.token.here"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     role:
 *                       type: string
 *                     walletAddress:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid signature
 */
router.post('/web3-login', catcher(verifyWalletSignature));

/**
 * @swagger
 * /auth/link-wallet:
 *   post:
 *     summary: Link a MetaMask wallet to existing account
 *     tags: [Auth]
 *     description: Links a verified wallet address to an existing user account
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *               - signature
 *               - message
 *             properties:
 *               address:
 *                 type: string
 *               signature:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet linked successfully
 *       400:
 *         description: Invalid request or wallet already linked
 *       401:
 *         description: Not authenticated
 */
router.post('/link-wallet', isAuthenticated, catcher(linkWallet));

/**
 * @swagger
 * /auth/unlink-wallet:
 *   post:
 *     summary: Unlink a wallet from user account
 *     tags: [Auth]
 *     description: Removes the linked wallet from a user account
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet unlinked successfully
 *       400:
 *         description: Cannot unlink (e.g., no alternative login method)
 *       401:
 *         description: Not authenticated
 */
router.post('/unlink-wallet', isAuthenticated, catcher(unlinkWallet));

/**
 * @swagger
 * /auth/register-wallet:
 *   post:
 *     summary: Register a new user with wallet
 *     tags: [Auth]
 *     description: Creates a new user account using a crypto wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - role
 *               - address
 *               - signature
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: User's name
 *               role:
 *                 type: string
 *                 description: User's role (e.g., FARMER, CONSUMER)
 *               address:
 *                 type: string
 *                 description: Wallet address
 *               signature:
 *                 type: string
 *                 description: Signature proving wallet ownership
 *               message:
 *                 type: string
 *                 description: Message that was signed
 *               chainId:
 *                 type: string
 *                 description: Chain ID of the wallet
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or wallet already registered
 */
router.post('/register-wallet', catcher(async (req: Request, res: Response) => {
  console.log('Received wallet registration request:', {
    name: req.body.name,
    role: req.body.role,
    address: req.body.address,
    // Tidak perlu log signature lengkap untuk keamanan
    signatureLength: req.body.signature ? req.body.signature.length : 0,
    messagePreview: req.body.message ? req.body.message.substring(0, 20) + '...' : null,
    chainId: req.body.chainId
  });
  
  const { name, role, address, signature, message, chainId } = req.body;
  
  // Validate required fields
  if (!name || !role || !address || !signature || !message) {
    console.log('Missing required fields:', {
      name: !!name,
      role: !!role,
      address: !!address,
      signature: !!signature,
      message: !!message
    });
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Validate role
  if (!Object.values(UserRole).includes(role)) {
    console.log('Invalid role:', role);
    return res.status(400).json({
      success: false,
      message: 'Invalid role'
    });
  }
  
  try {
    console.log('Verifying signature for address:', address);
    // Verify the signature
    const signerAddress = ethers.verifyMessage(message, signature);
    console.log('Recovered signer address:', signerAddress);
    
    // Check if the recovered address matches the claimed address
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      console.log('Signature verification failed. Expected:', address.toLowerCase(), 'Got:', signerAddress.toLowerCase());
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid signature' 
      });
    }
    
    // Check if wallet is already registered
    console.log('Checking if wallet already exists:', address);
    const existingUser = await getUserByWalletAddress(address);
    if (existingUser) {
      console.log('Wallet already registered to user:', existingUser.id);
      return res.status(400).json({
        success: false,
        message: 'This wallet address is already registered'
      });
    }
    
    // Generate user ID with role prefix
    const userId = `${role.toUpperCase().substring(0, 4)}-${uuidv4().substring(0, 8)}`;
    console.log('Generated new user ID:', userId);
    
    // Create user with required fields
    const newUser = {
      id: userId,
      name,
      role,
      walletAddress: address.toLowerCase(),
      authMethods: ['metamask'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isEmailVerified: true, // No email to verify for wallet-based accounts
      
      // Add required fields for User interface
      email: `${address.substring(0, 6)}@wallet.agrichain.local`, // Generate a placeholder email
      password: '', // Empty password as it's not used for wallet auth
      encryptedPrivateKey: '' // Empty as it's not used for wallet auth
    };
    
    // Save user to database
    console.log('Saving new user to database:', userId);
    try {
      await saveUserToDb(newUser);
      console.log('User saved successfully');
    } catch (dbError) {
      console.error('Database error saving user:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error saving user data'
      });
    }
    
    // Generate JWT token
    console.log('Generating JWT token');
    const token = generateToken({
      id: userId, 
      role, 
      walletAddress: address.toLowerCase()
    });
    
    // Return success response
    console.log('Wallet registration completed successfully for user:', userId);
    return res.status(201).json({
      success: true,
      message: 'User registered successfully with wallet',
      token,
      user: {
        id: userId,
        name,
        role,
        walletAddress: address.toLowerCase(),
        authMethods: ['metamask']
      }
    });
  } catch (error) {
    console.error('Wallet registration error:', error);
    // Type check the error object before accessing its properties
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      details: errorMessage
    });
  }
}));

export default router;