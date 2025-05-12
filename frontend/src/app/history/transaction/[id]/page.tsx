'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { transactionAPI } from '@/lib/api';
import { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/lib/utils';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (transactionId) {
      fetchTransactionDetails(transactionId);
    }
  }, [transactionId]);

  const fetchTransactionDetails = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionAPI.getTransactionById(id);
      
      if (response.data) {
        // Handle different API response formats
        const txData = response.data.data || response.data || {};
        setTransaction(txData);
      } else {
        setError("Transaction not found");
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setError("Could not load transaction details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
    alert('Copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading transaction details...</p>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-10">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Transaction</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error || "Transaction not found"}</p>
                </div>
                <div className="mt-4 flex space-x-4">
                  <Button variant="outline" onClick={() => fetchTransactionDetails(transactionId)}>
                    Try Again
                  </Button>
                  <Link href="/history">
                    <Button variant="default">Back to History</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link href="/history" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Transaction History
        </Link>
      </div>

      <div className="bg-white shadow dark:bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Transaction Details</h3>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {/* Transaction Hash */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash:</p>
                <div className="mt-1 flex items-center">
                  <p className="text-sm text-gray-900 dark:text-gray-100 break-all mr-2">
                    {transaction.id || transaction.transactionId || 'N/A'}
                  </p>
                  <button 
                    onClick={() => copyToClipboard(transaction.id || transaction.transactionId || '')}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' || transaction.status === 'success' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : transaction.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    : transaction.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                }`}>
                  {transaction.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp:</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(transaction.timestamp)}
            </p>
          </div>

          {/* From/To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">From:</p>
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-900 dark:text-gray-100 break-all mr-2">
                  {transaction.fromUser || transaction.sender || 'N/A'}
                </p>
                <button 
                  onClick={() => copyToClipboard(transaction.fromUser || transaction.sender || '')}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">To:</p>
              <div className="mt-1 flex items-center">
                <p className="text-sm text-gray-900 dark:text-gray-100 break-all mr-2">
                  {transaction.toUser || transaction.recipient || 'N/A'}
                </p>
                <button 
                  onClick={() => copyToClipboard(transaction.toUser || transaction.recipient || '')}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Method */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Method:</p>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                {transaction.actionType || transaction.type || 'Transferred'}
              </span>
            </p>
          </div>

          {/* Product Details Section */}
          <div className="mb-6">
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Product Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Product Name:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {transaction.productName || transaction.product?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Product ID:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 break-all">
                    {transaction.productId || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {transaction.metadata?.description || 'No description available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Quantity:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {transaction.quantity || transaction.amount || 0} {transaction.metadata?.unit || 'units'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="sm:col-span-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatRupiah(transaction.price || 0)}
                  </p>
                </div>
                <div className="sm:col-span-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value:</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatRupiah((transaction.quantity || 0) * (transaction.price || 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Info */}
          {transaction.blockchain?.blockHash && (
            <div className="mb-6">
              <h4 className="text-base font-medium text-gray-900 dark:text-white mb-4">Blockchain Information</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Hash:</p>
                  <div className="mt-1 flex items-center">
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-all mr-2">
                      {transaction.blockchain?.blockHash}
                    </p>
                    <button 
                      onClick={() => copyToClipboard(transaction.blockchain?.blockHash || '')}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {transaction.blockchain?.transactionHash && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Transaction Hash:</p>
                    <div className="mt-1 flex items-center">
                      <p className="text-sm text-gray-900 dark:text-gray-100 break-all mr-2">
                        {transaction.blockchain?.transactionHash}
                      </p>
                      <button 
                        onClick={() => copyToClipboard(transaction.blockchain?.transactionHash || '')}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {transaction.blockchain?.timestamp && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Block Timestamp:</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(transaction.blockchain?.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-4 sm:px-6 bg-gray-50 dark:bg-gray-700 flex justify-between">
          <Link href="/history">
            <Button variant="outline">Back to History</Button>
          </Link>
          {transaction.productId && (
            <Link href={`/products/${transaction.productId}`}>
              <Button variant="default">View Product</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 