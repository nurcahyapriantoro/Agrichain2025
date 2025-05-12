import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';

// Helper function to generate a JWT token with consistent parameters
export function generateToken(payload: object): string {
  // Get the secret from environment or config
  const secretValue = process.env.JWT_SECRET || jwtConfig.secret || 'default_jwt_secret';
  
  // Use the secret as a JWT Secret type
  const secret = Buffer.from(secretValue, 'utf8');
  
  // Sign the token without options that might cause type errors
  return jwt.sign(payload, secret);
} 