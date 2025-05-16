// Export API client and functions
import * as authAPI from './auth';
import * as userAPI from './users';
import * as productAPI from './products';
import * as transactionAPI from './transactions';
import * as blockchainAPI from './blockchain';
import productVerificationAPI from './productVerification';
import { updateProfile } from './users';

export {
  authAPI,
  userAPI,
  productAPI,
  transactionAPI,
  blockchainAPI,
  productVerificationAPI,
  updateProfile
}; 