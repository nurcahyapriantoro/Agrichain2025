'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productAPI, transactionAPI } from '@/lib/api';
import { Transaction, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProtectedRoute } from '@/components/auth/protected-route';
import TransactionList from '@/components/transactions/transaction-list';
import TransactionFilters, { TransactionFilters as Filters } from '@/components/transactions/transaction-filters';
import TransactionCharts from '@/components/transactions/transaction-charts';

// Interface untuk respons API
interface ApiResponse {
  data?: any;
  success?: boolean;
  message?: string;
  totalPages?: number;
  transactions?: Transaction[];
  pagination?: {
    totalPages: number;
  };
}

// Transaction list response interface
interface TransactionListResponse {
  transactions: Transaction[];
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

// Simplified product statuses
enum ProductStatus {
  CREATED = "CREATED",
  TRANSFERRED = "TRANSFERRED",
  VERIFIED = "VERIFIED",
  RECEIVED = "RECEIVED"
}

const getStatusBadgeClass = (status: string | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'; // Default style for undefined status
  }
  
  switch (status.toUpperCase()) {
    case ProductStatus.CREATED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    case ProductStatus.TRANSFERRED:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
    case ProductStatus.VERIFIED:
      return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
    case ProductStatus.RECEIVED:
      return 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-100';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

// Debounce timeout duration in milliseconds
const DEBOUNCE_TIMEOUT = 500;

export default function TransactionsPage() {
  return (
    <ProtectedRoute>
      <TransactionsContent />
    </ProtectedRoute>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const productIdParam = searchParams.get('productId');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>({});
  const [activeTab, setActiveTab] = useState('list');
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);

  // Create refs for debouncing and cancellation
  const isMountedRef = useRef(true);
  const fetchRequestIdRef = useRef(0);
  const debouncedFetchRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize filters with productId from URL if present
  useEffect(() => {
    if (productIdParam) {
      setFilters(prev => ({ ...prev, productId: productIdParam }));
      fetchProductDetails(productIdParam);
    }
  }, [productIdParam]);

  useEffect(() => {
    fetchTransactions(currentPage, filters);
  }, [currentPage, filters]);

  // Use useCallback to memoize fetch functions
  const fetchProductDetails = useCallback(async (productId: string) => {
    try {
      setIsLoadingProduct(true);
      const response = await productAPI.getProductById(productId);
      
      if (!isMountedRef.current) return;
      
      setProduct(response);
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingProduct(false);
      }
    }
  }, []);

  const fetchTransactions = useCallback(async (page: number, appliedFilters: Filters = {}) => {
    const currentRequestId = ++fetchRequestIdRef.current;
    
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current && isLoading) {
        setIsLoading(false);
        setError("Request timed out. The backend server may be offline or unreachable.");
        console.error("Transaction request timed out");
      }
    }, 15000);
    
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams: Record<string, any> = {
        page,
        limit: 10,
        ...appliedFilters
      };
      
      let response;
      try {
        if (appliedFilters.productId) {
          response = await transactionAPI.getProductTransactions(appliedFilters.productId, page, 10);
        } else {
          response = await transactionAPI.getTransactions(page, 10, queryParams);
        }

        if (!isMountedRef.current || currentRequestId !== fetchRequestIdRef.current) {
          return;
        }

        if (response) {
          setTransactions(response.data || []);
          setTotalPages(response.totalPages || 1);
          setError(null);
        } else {
          setTransactions([]);
          setTotalPages(1);
          setError('No data received from server');
        }
      } catch (error: any) {
        console.error('API call failed:', error);
        if (isMountedRef.current && currentRequestId === fetchRequestIdRef.current) {
          setTransactions([]);
          setError(error.message || 'Failed to fetch transactions. Please try again.');
        }
      }
    } finally {
      if (isMountedRef.current && currentRequestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
      clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Set up debounced data fetching when filters or page changes
  useEffect(() => {
    // Clear any existing timeout
    if (debouncedFetchRef.current) {
      clearTimeout(debouncedFetchRef.current);
    }
    
    // Set a new timeout
    debouncedFetchRef.current = setTimeout(() => {
      fetchTransactions(currentPage, filters);
      
      // Also fetch product details if needed
      if (filters.productId && !product) {
        fetchProductDetails(filters.productId);
      }
    }, DEBOUNCE_TIMEOUT);
    
    // Cleanup function
    return () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, [currentPage, filters, fetchTransactions, fetchProductDetails, product]);
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    };
  }, []);

  const handleFilterChange = (newFilters: Filters) => {
    setCurrentPage(1); // Reset to first page when filters change
    setFilters(newFilters);
  };
  
  const handleResetFilters = () => {
    setFilters({});
    setCurrentPage(1);
    // Clear product details if filters are reset
    setProduct(null);
  };

  const handleRefresh = () => {
    fetchTransactions(currentPage, filters);
    if (filters.productId) {
      fetchProductDetails(filters.productId);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#18122B] via-[#232526] to-[#0f2027] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">Transactions</h1>
        
        {/* Search bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search transactions by product name, users, or ID..."
            className="flex-grow px-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#00ffcc]"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          />
          <Button 
            onClick={() => setTotalPages(20)} 
            className="bg-[#00ffcc] hover:bg-[#00d9ae] text-black font-semibold"
          >
            Search
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab(activeTab === 'list' ? 'analytics' : 'list')}
            className="border-[#a259ff] text-[#a259ff] hover:bg-[#a259ff20]"
          >
            {activeTab === 'list' ? 'Analytics' : 'Transaction List'}
          </Button>
          <div className="relative">
            <Button
              variant="outline" 
              onClick={() => document.getElementById('filtersDropdown')?.classList.toggle('hidden')}
              className="border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc20]"
            >
              Filters
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-800 border border-gray-700 mb-6">
            <TabsTrigger 
              value="list"
              className={activeTab === 'list' ? 'bg-[#00ffcc] text-black' : 'text-gray-300'}
            >
              Transaction List
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className={activeTab === 'analytics' ? 'bg-[#00ffcc] text-black' : 'text-gray-300'}
            >
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="border-none p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-8 text-[#00ffcc]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ffcc] mb-4"></div>
                <p className="text-white">Loading transactions...</p>
                <p className="text-gray-400 text-sm mt-2">If loading takes too long, the server might be offline.</p>
              </div>
            ) : error ? (
              // Show error state with more useful information
              <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
                <h3 className="text-red-400 text-lg font-semibold mb-2">Error Loading Transactions</h3>
                <p className="text-white mb-4">{error}</p>
                <div className="text-sm text-gray-300 mb-4 text-left">
                  <p>Debug Information:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api'}</li>
                    <li>Endpoint: /transaction-history/latest</li>
                    <li>Network Status: {navigator.onLine ? 'Online' : 'Offline'}</li>
                    <li>Browser: {navigator.userAgent}</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                  <Button 
                    className="bg-[#a259ff] hover:bg-[#8a4ad9] text-white" 
                    onClick={handleRefresh}
                  >
                    Try Again
                  </Button>
                  <Button 
                    className="bg-[#00ffcc] hover:bg-[#00d9ae] text-black" 
                    onClick={() => window.location.reload()}
                  >
                    Reload Page
                  </Button>
                </div>
                
                {/* Fallback transaction display */}
                <div className="mt-8 border-t border-gray-700 pt-8">
                  <h4 className="text-[#00ffcc] text-lg font-semibold mb-4">Fallback Mode: Sample Transactions</h4>
                  <p className="text-gray-300 mb-6">Showing sample transactions since the API failed to load.</p>
                  
                  <Button 
                    className="bg-[#a259ff] hover:bg-[#8a4ad9] text-white mb-6" 
                    onClick={() => {
                      // Create sample transactions
                      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5010/api'}/transaction-history/create-bulk-test`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                          count: 10,
                          productId: 'test-product-123',
                          fromUserId: 'test-user-456'
                        })
                      })
                      .then(response => {
                        if (response.ok) {
                          handleRefresh();
                        }
                      })
                      .catch(err => {
                        console.error('Error creating test transactions:', err);
                      });
                    }}
                  >
                    Create New Test Transactions
                  </Button>
                  
                  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mt-4">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-300">ID</th>
                          <th className="px-4 py-2 text-left text-gray-300">Type</th>
                          <th className="px-4 py-2 text-left text-gray-300">Product</th>
                          <th className="px-4 py-2 text-left text-gray-300">From</th>
                          <th className="px-4 py-2 text-left text-gray-300">To</th>
                          <th className="px-4 py-2 text-left text-gray-300">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(5)].map((_, i) => (
                          <tr key={i} className="border-t border-gray-700">
                            <td className="px-4 py-3 text-gray-300">sample-tx-{i+1}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                i % 3 === 0 ? 'bg-purple-700 text-purple-100' : 
                                i % 3 === 1 ? 'bg-blue-700 text-blue-100' : 
                                'bg-green-700 text-green-100'
                              }`}>
                                {i % 3 === 0 ? 'TRANSFER' : i % 3 === 1 ? 'CREATE' : 'VERIFY'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300">Sample Product {i+1}</td>
                            <td className="px-4 py-3 text-gray-300">User A</td>
                            <td className="px-4 py-3 text-gray-300">User B</td>
                            <td className="px-4 py-3 text-gray-300">{new Date().toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg text-center">
                <h3 className="text-white text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-gray-400 mb-6">There are no transactions matching your criteria.</p>
                <div className="flex justify-center">
                  <Button 
                    className="bg-[#00ffcc] hover:bg-[#00d9ae] text-black" 
                    onClick={handleResetFilters}
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            ) : (
              <TransactionList 
                transactions={transactions} 
                currentPage={currentPage} 
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
                onRefresh={handleRefresh}
              />
            )}
          </TabsContent>
          
          <TabsContent value="analytics" className="border-none p-0">
            <TransactionCharts transactions={transactions || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
