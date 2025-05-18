import { User } from '../utils/userUtils';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 