import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/jwtConfig';
import { getUserById } from '../../utils/userUtils';

interface TokenPayload {
  id: string;
  role: string;
  walletAddress?: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    
    // Extract the token from the authorization header
    // Expected format: "Bearer [token]"
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid authorization format' });
    }
    
    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      
      // Check if user exists
      const user = await getUserById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      // Attach user information to the request object
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
      }
      
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

/**
 * Extend the Express Request interface to include user property
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        walletAddress?: string;
      };
    }
  }
}
