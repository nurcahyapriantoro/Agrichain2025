'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { transactionAPI } from '@/lib/api';
import { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function TransactionHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const initialTab = searchParams.get('tab') || 'all';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllTransactions(currentPage);
    } else if (activeTab === 'my' && session?.user?.id) {
      fetchUserTransactions(session.user.id, currentPage);
    }
  }, [activeTab, currentPage, session]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
    router.push(`/history?tab=${tab}`, { scroll: false });
  };

  const fetchAllTransactions = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionAPI.getLatestTransactions(page, 10);
      processTransactionResponse(response);
    } catch (error) {
      console.error('Error fetching all transactions:', error);
      setTransactions([]);
      setError("Could not load transactions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTransactions = async (userId: string, page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionAPI.getUserTransactions(userId, page, 10);
      processTransactionResponse(response);
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      setTransactions([]);
      setError("Could not load your transactions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const processTransactionResponse = (response: any) => {
    if (response.data) {
      let transactionsData = [];
      let totalPagesCount = 1;
      
      if (response.data.data) {
        transactionsData = response.data.data;
        totalPagesCount = response.data.totalPages || 1;
      } else if (Array.isArray(response.data)) {
        transactionsData = response.data;
        totalPagesCount = Math.ceil(response.data.length / 10) || 1;
      } else if (response.data.transactions) {
        transactionsData = response.data.transactions;
        totalPagesCount = response.data.pagination?.totalPages || 1;
      }
      
      if (Array.isArray(transactionsData) && transactionsData.length > 0) {
        setTransactions(transactionsData);
        setTotalPages(totalPagesCount);
      } else {
        setTransactions([]);
        setError(null); // No error, just empty data
      }
    } else {
      setTransactions([]);
      setError("No transaction data available");
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleString();
  };

  const truncateAddress = (address: string) => {
    if (!address) return 'Unknown';
    return address.length > 8 ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : address;
  };

  return (
    <div className="py-6">
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold leading-tight text-gray-900 dark:text-white">Transaction History</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Custom Tab Buttons */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 mb-8">
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleTabChange('all')}
          >
            All Transactions
          </button>
          <button
            className={`flex-1 rounded-md py-2 text-sm font-medium ${
              activeTab === 'my'
                ? 'bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => handleTabChange('my')}
          >
            My Transactions
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'my' && !session ? (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">Please log in to view your transactions.</p>
              <Link href="/login" className="mt-4 inline-block">
                <Button variant="default">Login</Button>
              </Link>
            </div>
          ) : (
            renderTransactions()
          )}
        </div>
      </main>
    </div>
  );

  function renderTransactions() {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-green-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
          </div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Loading transactions...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Transactions</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => activeTab === 'all' ? fetchAllTransactions(currentPage) : session?.user?.id && fetchUserTransactions(session.user.id, currentPage)}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
          <Link href="/dashboard" className="mt-4 inline-block">
            <Button variant="default">Back to Dashboard</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((transaction, index) => (
            <li key={transaction.id || transaction.transactionId || `tx-${transaction.timestamp || Date.now()}-${index}`}>
              <Link href={transaction.id || transaction.transactionId ? 
                `/history/transaction/${transaction.id || transaction.transactionId}` : '#'} 
                className="block hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600 truncate">
                          {transaction.productName || transaction.product?.name || 'Product'} 
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(transaction.timestamp)} • {transaction.status || 'pending'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2 flex flex-col items-end">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      From: {truncateAddress(transaction.fromUser || transaction.sender || '')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      To: {truncateAddress(transaction.toUser || transaction.recipient || '')}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
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
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                  
                  {/* Show page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNumber === currentPage
                            ? 'z-10 bg-green-50 dark:bg-green-900 border-green-500 text-green-600 dark:text-green-200'
                            : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
} 