'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { blockchainAPI } from '@/lib/api';
import { Block } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';

// Debounce timeout duration in milliseconds
const DEBOUNCE_TIMEOUT = 500;

export default function BlockchainPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [showBlockDetails, setShowBlockDetails] = useState(false);
  
  // Create a ref to track if component is mounted
  const isMountedRef = useRef(true);
  // Create a ref for fetchBlocks function to track the latest fetch request
  const fetchRequestIdRef = useRef(0);

  // Use useCallback to memoize fetchBlocks to prevent unnecessary recreations
  const fetchBlocks = useCallback(async (page: number) => {
    // Increment the request ID to track the latest request
    const currentRequestId = ++fetchRequestIdRef.current;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching blocks for page:', page);
      const response = await blockchainAPI.getBlocks(page, 10);
      
      // If this is not the latest request, ignore the results
      if (!isMountedRef.current || currentRequestId !== fetchRequestIdRef.current) {
        console.log('Ignoring stale request', currentRequestId, 'current is', fetchRequestIdRef.current);
        return;
      }
      
      console.log('Block data response:', response.data);
      
      if (response.data) {
        // Handle different response structures
        if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
          // Format from blockchain/blocks endpoint: { success: true, data: blocks[], pagination: { page, limit, totalBlocks, totalPages } }
          setBlocks(response.data.data);
          if (response.data.pagination) {
            setTotalPages(response.data.pagination.totalPages || 1);
          } else {
            setTotalPages(Math.ceil(response.data.data.length / 10) || 1);
          }
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Format 1: { data: Block[], totalPages: number }
          setBlocks(response.data.data);
          setTotalPages(response.data.totalPages || 1);
        } else if (Array.isArray(response.data)) {
          // Format 2: Block[]
          setBlocks(response.data);
          setTotalPages(Math.ceil(response.data.length / 10) || 1);
        } else if (response.data.blocks && Array.isArray(response.data.blocks)) {
          // Format 3: { blocks: Block[], totalPages: number }
          setBlocks(response.data.blocks);
          setTotalPages(response.data.totalPages || 1);
        } else {
          console.error('Unexpected response format:', response.data);
          setError('Received unexpected data format from server');
          setBlocks([]);
        }
      } else {
        setBlocks([]);
        setError('No data received from server');
      }
    } catch (error: any) {
      if (!isMountedRef.current || currentRequestId !== fetchRequestIdRef.current) return;
      
      console.error('Error fetching blocks:', error);
      const errorMessage = error.response?.data?.message || 
                           error.response?.statusText ||
                           error.message ||
                           'Failed to load blockchain data. Please try again later.';
      
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else {
        setError(errorMessage);
      }
      
      setBlocks([]);
    } finally {
      if (isMountedRef.current && currentRequestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Create a debounced version of page change
  const debouncedFetchRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Implementation to handle debouncing when currentPage changes
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }
    
    debouncedFetchRef.current = setTimeout(() => {
      fetchBlocks(currentPage);
    }, DEBOUNCE_TIMEOUT);
    
    // Cleanup function
    return () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, [currentPage, fetchBlocks]);
  
  // Set up cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const handleViewBlockDetails = (block: Block) => {
    setSelectedBlock(block);
    setShowBlockDetails(true);
  };

  const handleCloseBlockDetails = () => {
    setShowBlockDetails(false);
    setSelectedBlock(null);
  };

  const truncateHash = (hash: string, length = 8) => {
    if (!hash) return '';
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  // Safe accessor function for block data
  const safeGet = (block: Block | null, key: keyof Block | string, fallback: any = 'N/A') => {
    if (!block) return fallback;
    return (block as any)[key] ?? fallback;
  };

  return (
    <ProtectedRoute allowNoRole={true}>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">Blockchain Explorer</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-8 sm:px-0">
              {isLoading ? (
                <div className="text-center py-10">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                  </div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Loading blockchain data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10">
                  <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : blocks.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 dark:text-gray-400">No blockchain data available.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Block List</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
                          Recent blocks in the chain
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Height
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Hash
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Timestamp
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Transactions
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Difficulty
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Miner
                              </th>
                              <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {blocks.map((block) => (
                              <tr key={block.hash} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                  {block.height !== undefined ? block.height : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                                  {truncateHash(block.hash)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {formatDate(block.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {block.transactionCount !== undefined ? block.transactionCount : 
                                   (Array.isArray(block.data) ? block.data.length : 
                                    (Array.isArray(block.transactions) ? block.transactions.length : 0))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {block.difficulty !== undefined ? block.difficulty : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                  {block.miner ? truncateHash(block.miner, 4) : 
                                   (block.createdBy ? truncateHash(block.createdBy, 4) : 'Unknown')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button
                                    onClick={() => handleViewBlockDetails(block)}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 mt-4">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Showing page <span className="font-medium">{currentPage}</span> of{' '}
                            <span className="font-medium">{totalPages}</span> pages
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <Button
                              variant="outline"
                              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Previous
                            </Button>
                            {[...Array(totalPages)].map((_, i) => (
                              <Button
                                key={i}
                                variant={currentPage === i + 1 ? 'primary' : 'outline'}
                                onClick={() => handlePageChange(i + 1)}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium"
                              >
                                {i + 1}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Next
                            </Button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Block Details Modal */}
                  {showBlockDetails && selectedBlock && (
                    <div className="fixed inset-0 overflow-y-auto z-50">
                      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
                        </div>
                        
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                  Block Details
                                </h3>
                                
                                {/* Block height if available */}
                                {selectedBlock.height !== undefined && (
                                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md mt-4">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Block Height</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                      {safeGet(selectedBlock, 'height')}
                                    </dd>
                                  </div>
                                )}
                                
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md mt-4">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Block Hash</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 font-mono break-all">
                                    {safeGet(selectedBlock, 'hash')}
                                  </dd>
                                </div>
                                
                                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Previous Hash</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 font-mono break-all">
                                    {safeGet(selectedBlock, 'lastHash') || safeGet(selectedBlock, 'previousHash')}
                                  </dd>
                                </div>
                                
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Timestamp</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                    {formatDate(safeGet(selectedBlock, 'timestamp'))}
                                  </dd>
                                </div>
                                
                                {selectedBlock.nonce !== undefined && (
                                  <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Nonce</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                      {safeGet(selectedBlock, 'nonce', 0)}
                                    </dd>
                                  </div>
                                )}
                                
                                {selectedBlock.difficulty !== undefined && (
                                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Difficulty</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                      {safeGet(selectedBlock, 'difficulty', 0)}
                                    </dd>
                                  </div>
                                )}
                                
                                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Miner</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2 font-mono">
                                    {safeGet(selectedBlock, 'miner') || safeGet(selectedBlock, 'createdBy', 'Unknown')}
                                  </dd>
                                </div>
                                
                                {selectedBlock.size !== undefined && (
                                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Block Size</dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                      {safeGet(selectedBlock, 'size', 0)} bytes
                                    </dd>
                                  </div>
                                )}
                                
                                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 rounded-md">
                                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Transactions</dt>
                                  <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                                    {selectedBlock.transactionCount !== undefined ? selectedBlock.transactionCount :
                                     (Array.isArray(selectedBlock.data) ? selectedBlock.data.length : 
                                      (Array.isArray(selectedBlock.transactions) ? selectedBlock.transactions.length : 0))} transactions
                                  </dd>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <Button variant="primary" onClick={handleCloseBlockDetails} className="w-full sm:w-auto">
                              Close
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction list section - show only if the block has data in the original format */}
                  {showBlockDetails && selectedBlock && (
                    (Array.isArray(selectedBlock.data) && selectedBlock.data.length > 0) ? (
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Transaction Details</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 shadow overflow-hidden sm:rounded-md">
                          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                            {selectedBlock.data.map((transaction: any, index: number) => (
                              <li key={index} className="px-4 py-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    {transaction.id ? (
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        Transaction ID: {truncateHash(transaction.id)}
                                      </p>
                                    ) : (
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        Transaction #{index + 1}
                                      </p>
                                    )}
                                    {transaction.timestamp && (
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Time: {formatDate(transaction.timestamp)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      Array.isArray(selectedBlock.transactions) && selectedBlock.transactions.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Transaction Details</h4>
                          <div className="bg-gray-50 dark:bg-gray-700 shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                              {selectedBlock.transactions.map((transaction: any, index: number) => (
                                <li key={index} className="px-4 py-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      {transaction.txId ? (
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          Transaction ID: {truncateHash(transaction.txId)}
                                        </p>
                                      ) : (
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          Transaction #{index + 1}
                                        </p>
                                      )}
                                      {transaction.timestamp && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                          Time: {formatDate(transaction.timestamp)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
