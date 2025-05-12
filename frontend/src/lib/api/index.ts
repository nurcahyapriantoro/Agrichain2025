// Export API client and functions
import * as authAPI from './auth';
import * as userAPI from './users';
import * as productAPI from './products';
import * as transactionAPI from './transactions';
import productVerificationAPI from './productVerification';
import { updateProfile } from './users';

export {
  authAPI,
  userAPI,
  productAPI,
  transactionAPI,
  productVerificationAPI,
  updateProfile
}; 