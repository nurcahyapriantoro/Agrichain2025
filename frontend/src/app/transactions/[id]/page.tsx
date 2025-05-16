'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import React from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { transactionAPI, productAPI } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import { Transaction, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatRupiah } from '@/lib/utils';
import { 
  ArrowLeftIcon, 
  ClockIcon, 
  CubeIcon, 
  UserIcon, 
  DocumentDuplicateIcon, 
  CheckCircleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowRightIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
// Import the ExtendedTransaction from the transactions API client
import { ExtendedTransaction } from '@/lib/api/transactions';

// Define an interface for blockchain data
interface BlockchainData {
  blockHeight: number;
  blockHash: string;
  transactionHash: string;
  timestamp: number;
  validator: string;
}

// Define API response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Extend Transaction type to include response structure
interface TransactionWithData extends Transaction {
  data?: any;
  blockchain?: BlockchainData;
  transactionHash?: string;
  blockHash?: string;
  from?: string;
  to?: string;
  fromRole?: string;
  toRole?: string;
  fromUserId?: string;
  toUserId?: string;
}

// Extend Product type to include response structure
interface ProductWithData extends Product {
  data?: any;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = Array.isArray(params.id) ? params.id[0] : params.id as string;
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionWithData | null>(null);
  const [productDetails, setProductDetails] = useState<ProductWithData | null>(null);
  const [senderDetails, setSenderDetails] = useState<any | null>(null);
  const [recipientDetails, setRecipientDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransaction(transactionId);
    }
  }, [transactionId]);

  const fetchTransaction = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`Attempting to fetch transaction with ID: ${id}`);
      
      try {
        // Try the transaction history endpoint
        const response = await transactionAPI.getTransactionById(id);
        
        if (response) {
          console.log('Transaction data received:', response);
          // Format the transaction data to match our expected format
          const txData: TransactionWithData = {
            id: response.id || id,
            transactionId: response.id || id,
            fromUser: response.fromUser || response.from || response.fromUserId || '',
            toUser: response.toUser || response.to || response.toUserId || '',
            productId: response.productId || '',
            timestamp: response.timestamp || Date.now(),
            status: response.status || 'success',
            actionType: response.type || response.actionType || 'TRANSFER',
            // Add fields from the ExtendedTransaction interface
            blockchain: response.blockchain || {
              blockHeight: 0,
              blockHash: response.blockHash || '',
              transactionHash: response.transactionHash || response.id || id,
              timestamp: response.timestamp || Date.now(),
              validator: 'agrichain-node-1'
            },
            blockHash: response.blockHash || response.blockchain?.blockHash,
            transactionHash: response.transactionHash || response.blockchain?.transactionHash || response.id,
            from: response.from || response.fromUserId || response.fromUser,
            to: response.to || response.toUserId || response.toUser,
            fromRole: response.fromRole || '',
            toRole: response.toRole || '',
            fromUserId: response.fromUserId || response.from || response.fromUser,
            toUserId: response.toUserId || response.to || response.toUser,
            // Include any other fields we need
            quantity: response.quantity || 0,
            price: response.price || 0,
            unit: response.unit || '',
            metadata: response.metadata || {}
          };
          
          setTransaction(txData);
          
          // Fetch additional data
          await fetchRelatedData(txData);
          return;
        }
      } catch (primaryError) {
        console.warn('Primary transaction endpoint failed:', primaryError);
        // Continue to fallback methods
      }
      
      // If transaction history endpoint fails, try direct transaction endpoint as fallback
      try {
        console.log('Trying fallback endpoint for transaction');
        const fallbackResponse = await apiClient.get(`/transaction-history/transaction/${id}`);
        
        if (fallbackResponse.data && (fallbackResponse.data.data || fallbackResponse.data.metadata)) {
          console.log('Fallback transaction data received:', fallbackResponse.data);
          
          // Format data to match expected structure
          const txData = {
            id: id,
            transactionId: id,
            productId: fallbackResponse.data.data?.productId || 'unknown',
            timestamp: fallbackResponse.data.data?.timestamp || Date.now(),
            status: 'success',
            actionType: fallbackResponse.data.data?.type || 'TRANSFER',
            ...fallbackResponse.data.data
          };
          
          setTransaction(txData);
          await fetchRelatedData(txData);
          return;
        }
      } catch (fallbackError) {
        console.warn('Fallback transaction endpoint failed:', fallbackError);
      }
      
      // If all API calls failed, show error message
      console.error('All transaction API endpoints failed');
      setError('Transaction data could not be retrieved. Please try again later.');
      
    } catch (error: any) {
      console.error('Error fetching transaction:', error);
      setError(error.response?.data?.message || 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Separate function to fetch product and user details
  const fetchRelatedData = async (txData: any) => {
    // If there's a product ID, fetch product details
    if (txData.productId) {
      try {
        const productResponse = await productAPI.getProductById(txData.productId);
        if (productResponse && 'data' in productResponse) {
          setProductDetails(productResponse.data as ProductWithData);
        }
      } catch (err) {
        console.warn('Could not fetch product details:', err);
      }
    }

    // If there's a sender ID (fromUser), fetch sender details
    if (txData.fromUser || txData.from || txData.senderId || txData.fromUserId) {
      try {
        const userId = txData.fromUser || txData.from || txData.senderId || txData.fromUserId;
        const userResponse = await fetch(`/api/users/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setSenderDetails(userData.data);
        }
      } catch (err) {
        console.warn('Could not fetch sender details:', err);
      }
    }

    // If there's a recipient ID (toUser), fetch recipient details
    if (txData.toUser || txData.to || txData.recipientId || txData.toUserId) {
      try {
        const userId = txData.toUser || txData.to || txData.recipientId || txData.toUserId;
        const userResponse = await fetch(`/api/users/${userId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setRecipientDetails(userData.data);
        }
      } catch (err) {
        console.warn('Could not fetch recipient details:', err);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed' || statusLower === 'success') {
      return <Badge variant="success" className="text-sm">{status}</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge variant="warning" className="text-sm">{status}</Badge>;
    } else if (statusLower === 'failed' || statusLower === 'error') {
      return <Badge variant="destructive" className="text-sm">{status}</Badge>;
    } else if (statusLower === 'transferred') {
      return <Badge className="bg-blue-600 text-sm">{status}</Badge>;
    } else if (statusLower === 'verified') {
      return <Badge className="bg-purple-600 text-sm">{status}</Badge>;
    } else {
      return <Badge variant="outline" className="text-sm">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed' || statusLower === 'success') {
      return <CheckCircleIcon className="h-12 w-12 text-green-500" />;
    } else if (statusLower === 'pending') {
      return <ClockIcon className="h-12 w-12 text-yellow-500" />;
    } else if (statusLower === 'failed' || statusLower === 'error') {
      return <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />;
    } else if (statusLower === 'transferred') {
      return <ArrowRightIcon className="h-12 w-12 text-blue-500" />;
    } else if (statusLower === 'verified') {
      return <ShieldCheckIcon className="h-12 w-12 text-purple-500" />;
    } else {
      return <CubeIcon className="h-12 w-12 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast/notification here
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
              <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">Loading transaction details...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-8 max-w-lg mx-auto">
                <div className="flex flex-col items-center">
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
                  <h3 className="text-xl font-medium text-red-800 dark:text-red-200">Error Loading Transaction</h3>
                  <div className="mt-2 text-base text-red-700 dark:text-red-300">
                    <p>{error}</p>
                  </div>
                  <div className="mt-6 flex space-x-4">
                    <Button variant="outline" onClick={() => router.back()}>
                      Go Back
                    </Button>
                    <Button onClick={() => fetchTransaction(transactionId)}>
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!transaction) {
    return (
      <ProtectedRoute>
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">Transaction Not Found</h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">The transaction you are looking for does not exist or has been removed.</p>
              <div className="mt-6">
                <Link href="/transactions">
                  <Button variant="primary">View All Transactions</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center mb-8">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                Transaction Details
              </h1>
            </div>
          </div>
        </header>

        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                  </div>
                  <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">Loading transaction details...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-8 max-w-lg mx-auto">
                    <div className="flex flex-col items-center">
                      <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
                      <h3 className="text-xl font-medium text-red-800 dark:text-red-200">Error Loading Transaction</h3>
                      <div className="mt-2 text-base text-red-700 dark:text-red-300">
                        <p>{error}</p>
                      </div>
                      <div className="mt-6 flex space-x-4">
                        <Button variant="outline" onClick={() => router.back()}>
                          Go Back
                        </Button>
                        <Button onClick={() => fetchTransaction(transactionId)}>
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !transaction ? (
                <div className="text-center py-10">
                  <CubeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Transaction Not Found</h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">The transaction you are looking for does not exist or has been removed.</p>
                  <div className="mt-6">
                    <Link href="/transactions">
                      <Button variant="primary">View All Transactions</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Enhanced Transaction Status Card */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-900 dark:bg-gray-800 shadow-xl overflow-hidden rounded-xl"
                  >
                    {/* Status Header */}
                    <div className="px-6 py-5 relative overflow-hidden">
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 260, 
                              damping: 20,
                              delay: 0.3 
                            }}
                            className="flex-shrink-0 mr-4"
                          >
                            {getStatusIcon(transaction.status || 'Unknown')}
                          </motion.div>
                          <div>
                            <h2 className="text-xl font-bold text-white">
                              Transaction {transaction.status || 'Unknown'}
                            </h2>
                            <p className="mt-1 text-gray-300">
                              {transaction.actionType || transaction.type || 'Transaction'} processed on {formatDate(transaction.timestamp || Date.now())}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {getStatusBadge(transaction.status || 'Unknown')}
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Badge variant="outline" className="bg-gray-700 text-gray-200 dark:bg-gray-800">
                              {transaction.actionType || transaction.type || 'Unknown Type'}
                            </Badge>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Transaction Flow Visualization */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between mt-6 relative">
                        {/* From User */}
                        <motion.div 
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="text-center"
                        >
                          <div className="inline-block p-4 rounded-full bg-blue-900 dark:bg-blue-800 mb-3">
                            <UserIcon className="h-8 w-8 text-blue-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">From</p>
                            <p className="text-base font-semibold text-white">
                              {senderDetails?.name || transaction.fromUserName || transaction.fromUser || transaction.sender || 'Unknown Sender'}
                            </p>
                            {senderDetails?.role && (
                              <p className="text-xs text-gray-400">
                                {senderDetails.role}
                              </p>
                            )}
                          </div>
                        </motion.div>

                        {/* Transfer Animation */}
                        <div className="flex flex-col items-center">
                          <div className="w-32 sm:w-48 md:w-64 h-0.5 bg-gradient-to-r from-blue-500 via-green-400 to-green-500 relative mb-4">
                            <motion.div
                              initial={{ left: '0%', scale: 0 }}
                              animate={{ left: '100%', scale: 1 }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 2,
                                repeatType: "loop"
                              }}
                              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                              <div className="h-3 w-3 rounded-full bg-green-400 shadow-lg shadow-green-400/50"></div>
                            </motion.div>
                          </div>
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.3 }}
                            className="text-center"
                          >
                            <p className="text-sm font-medium text-gray-400">{transaction.actionType || transaction.type || 'Transfer'}</p>
                            <p className="text-lg font-bold text-white flex items-center justify-center">
                              {transaction.quantity || transaction.amount || 0}{' '}
                              <span className="text-sm text-gray-400 ml-1">
                                {transaction.unit || productDetails?.unit || 'unit(s)'}
                              </span>
                            </p>
                          </motion.div>
                        </div>

                        {/* To User */}
                        <motion.div 
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.5 }}
                          className="text-center"
                        >
                          <div className="inline-block p-4 rounded-full bg-green-900 dark:bg-green-800 mb-3">
                            <UserIcon className="h-8 w-8 text-green-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">To</p>
                            <p className="text-base font-semibold text-white">
                              {recipientDetails?.name || transaction.toUserName || transaction.toUser || transaction.recipient || 'Unknown Recipient'}
                            </p>
                            {recipientDetails?.role && (
                              <p className="text-xs text-gray-400">
                                {recipientDetails.role}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Transaction Details Grid - using existing code with minor motion animations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Product Information - Keep as is but add motion */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg md:col-span-2"
                    >
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                            <CubeIcon className="h-5 w-5 mr-2 text-gray-500" />
                            Product Information
                          </h3>
                          <Link href={`/products/${transaction.productId}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              View Product
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name</dt>
                            <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                              {productDetails?.name || transaction.productName || 'Product'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Product ID</dt>
                            <dd className="mt-1 text-base text-gray-900 dark:text-white flex items-center">
                              <span className="font-mono truncate mr-2">{transaction.productId}</span>
                              <button onClick={() => copyToClipboard(transaction.productId)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              </button>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity</dt>
                            <dd className="mt-1 text-base text-gray-900 dark:text-white">
                              {transaction.quantity} {transaction.unit || productDetails?.unit || 'unit(s)'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Price Per Unit</dt>
                            <dd className="mt-1 text-base text-gray-900 dark:text-white">
                              {formatRupiah(transaction.price || productDetails?.price || 0)}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</dt>
                            <dd className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                              {formatRupiah((transaction.quantity || 0) * (transaction.price || 0))}
                            </dd>
                          </div>
                          {transaction.actionReason && (
                            <div className="sm:col-span-2">
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reason</dt>
                              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                {transaction.actionReason}
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </motion.div>

                    {/* Transaction Timeline */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
                    >
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
                          Transaction Timeline
                        </h3>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <ol className="relative border-l border-green-500 dark:border-green-600 ml-3">
                          <motion.li 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="mb-6 ml-6"
                          >
                            <div className="absolute w-4 h-4 bg-green-500 rounded-full -left-2 border-2 border-white dark:border-gray-800"></div>
                            <div className="absolute w-3 h-3 animate-ping bg-green-400 rounded-full -left-1.5 mt-0.5"></div>
                            <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Created</time>
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Transaction Initiated</h3>
                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.timestamp || transaction.createdAt || Date.now())}</p>
                            {transaction.createdBy && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">By: {transaction.createdBy}</p>
                            )}
                          </motion.li>
                          {transaction.status && transaction.status.toLowerCase() !== 'pending' && (
                            <motion.li 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7, duration: 0.4 }}
                              className="mb-6 ml-6"
                            >
                              <div className={`absolute w-4 h-4 ${
                                transaction.status.toLowerCase() === 'failed' || transaction.status.toLowerCase() === 'error' 
                                  ? 'bg-red-500' 
                                  : 'bg-blue-500'
                              } rounded-full -left-2 border-2 border-white dark:border-gray-800`}></div>
                              <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Processed</time>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                Transaction {transaction.status}
                              </h3>
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                {transaction.updatedAt ? formatDate(transaction.updatedAt) : formatDate(transaction.timestamp || Date.now())}
                              </p>
                            </motion.li>
                          )}
                          {transaction.blockchain && transaction.blockchain.blockHash && (
                            <motion.li 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9, duration: 0.4 }}
                              className="ml-6"
                            >
                              <div className="absolute w-4 h-4 bg-purple-500 rounded-full -left-2 border-2 border-white dark:border-gray-800"></div>
                              <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">Blockchain Record</time>
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Added to Blockchain</h3>
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                {transaction.blockchain?.timestamp ? formatDate(transaction.blockchain.timestamp) : "Not available"}
                              </p>
                              {transaction.blockchain?.validator && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">Validated by: {transaction.blockchain?.validator}</p>
                              )}
                            </motion.li>
                          )}
                        </ol>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Blockchain Information */}
                  {transaction.blockchain && transaction.blockchain.blockHash && (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Blockchain Information
                        </h3>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash</dt>
                            <dd className="mt-1 text-base text-gray-900 dark:text-white flex items-center">
                              <span className="font-mono text-sm break-all mr-2">{transaction.blockchain?.transactionHash || 'Not available'}</span>
                              {transaction.blockchain?.transactionHash && (
                                <button onClick={() => copyToClipboard(transaction.blockchain?.transactionHash || '')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </button>
                              )}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Hash</dt>
                            <dd className="mt-1 text-base text-gray-900 dark:text-white flex items-center">
                              <span className="font-mono text-sm break-all mr-2">{transaction.blockchain?.blockHash || 'Not available'}</span>
                              {transaction.blockchain?.blockHash && (
                                <button onClick={() => copyToClipboard(transaction.blockchain?.blockHash || '')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                  <DocumentDuplicateIcon className="h-4 w-4" />
                                </button>
                              )}
                            </dd>
                          </div>
                          {transaction.blockchain?.blockHeight && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Height</dt>
                              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                {transaction.blockchain.blockHeight}
                              </dd>
                            </div>
                          )}
                          {transaction.blockchain?.timestamp ? (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Timestamp</dt>
                              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                {formatDate(transaction.blockchain.timestamp)}
                              </dd>
                            </div>
                          ) : (
                            <div>
                              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Timestamp</dt>
                              <dd className="mt-1 text-base text-gray-900 dark:text-white">
                                Not available
                              </dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  )}

                  {/* Additional Metadata */}
                  {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
                      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                          <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Additional Metadata
                        </h3>
                      </div>
                      <div className="px-4 py-5 sm:p-6">
                        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm text-gray-900 dark:text-gray-300">
                          {JSON.stringify(transaction.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => router.back()}
                      className="flex items-center justify-center gap-2"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      Back to Transactions
                    </Button>

                    <Link href={`/products/${transaction.productId}`}>
                      <Button 
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                      >
                        <CubeIcon className="h-4 w-4" />
                        View Product
                      </Button>
                    </Link>

                    <Button 
                      variant="primary" 
                      onClick={() => fetchTransaction(transactionId)}
                      className="flex items-center justify-center gap-2"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Refresh Data
                    </Button>
                  </div>

                  {/* Blockchain Verification */}
                  {transaction && (
                    <div className="mt-6 space-y-4 border-t pt-4 dark:border-gray-700">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                        Blockchain Verification
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Block Height</div>
                          <div className="mt-1 font-medium text-gray-900 dark:text-gray-100 flex items-center">
                            {transaction?.blockchain?.blockHeight?.toLocaleString() || "Not available"}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Block Hash</div>
                          <div className="mt-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                            {transaction?.blockchain?.blockHash || "Not available"}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Transaction Hash</div>
                        <div className="mt-1 font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                          {transaction?.blockchain?.transactionHash || transaction?.transactionHash || transaction?.id || "Not available"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Timestamp</div>
                        <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                          {transaction?.blockchain?.timestamp ? formatDate(transaction.blockchain.timestamp) : "Not available"}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Validator</div>
                        <div className="mt-1 font-medium text-gray-900 dark:text-gray-100">
                          {transaction?.blockchain?.validator || "Not available"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
