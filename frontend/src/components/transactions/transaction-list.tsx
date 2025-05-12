'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Transaction } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, ArrowPathIcon } from '@heroicons/react/20/solid';
import React from 'react';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TransactionList({ 
  transactions = [],
  isLoading = false,
  onRefresh = () => {},
  currentPage = 1,
  totalPages = 1,
  onPageChange = () => {}
}: TransactionListProps) {
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'completed' || statusLower === 'success') {
      return <Badge variant="success">{status}</Badge>;
    } else if (statusLower === 'pending') {
      return <Badge variant="warning">{status}</Badge>;
    } else if (statusLower === 'failed' || statusLower === 'error') {
      return <Badge variant="destructive">{status}</Badge>;
    } else if (statusLower === 'transferred') {
      return <Badge className="bg-blue-600">{status}</Badge>;
    } else if (statusLower === 'verified') {
      return <Badge className="bg-purple-600">{status}</Badge>;
    } else {
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string | undefined) => {
    if (!type) return <Badge variant="outline">Unknown</Badge>;
    
    const typeLower = type.toLowerCase();
    
    if (typeLower === 'transfer') {
      return <Badge className="bg-blue-600">{type}</Badge>;
    } else if (typeLower === 'purchase' || typeLower === 'buy') {
      return <Badge className="bg-purple-600">{type}</Badge>;
    } else if (typeLower === 'sale' || typeLower === 'sell') {
      return <Badge className="bg-indigo-600">{type}</Badge>;
    } else if (typeLower === 'verification' || typeLower === 'verify') {
      return <Badge className="bg-green-600">{type}</Badge>;
    } else {
      return <Badge variant="outline">{type}</Badge>;
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedTransaction === id) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(id);
    }
  };

  const getTransactionId = (transaction: Transaction) => {
    return transaction.id || transaction.transactionId || `tx-${transaction.timestamp || Date.now()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Transactions</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {!transactions || transactions.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => {
                const id = getTransactionId(transaction);
                const isExpanded = expandedTransaction === id;
                
                return (
                  <React.Fragment key={id}>
                    <tr 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isExpanded ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.productName || transaction.product?.name || 'Product'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                              ID: {transaction.productId && (
                                typeof transaction.productId === 'string' && transaction.productId.length > 8 
                                  ? `${transaction.productId.substring(0, 8)}...` 
                                  : transaction.productId
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTransactionTypeBadge(transaction.actionType || transaction.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {transaction.fromUserName || transaction.fromUser || transaction.sender || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {transaction.toUserName || transaction.toUser || transaction.recipient || 'Unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {transaction.quantity || transaction.amount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatRupiah((transaction.quantity || 0) * (transaction.price || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(transaction.timestamp || Date.now())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(id)}
                            className="text-gray-600 dark:text-gray-300"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="h-5 w-5" />
                            ) : (
                              <ChevronDownIcon className="h-5 w-5" />
                            )}
                          </Button>
                          
                          <Link href={`/transactions/${id}`}>
                            <Button variant="outline" size="sm">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {transaction.price && (
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Price Per Unit</div>
                                <div className="mt-1 text-sm text-gray-900 dark:text-white">{formatRupiah(transaction.price)}</div>
                              </div>
                            )}
                            
                            {transaction.actionReason && (
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Reason</div>
                                <div className="mt-1 text-sm text-gray-900 dark:text-white">{transaction.actionReason}</div>
                              </div>
                            )}
                            
                            {transaction.blockchain && transaction.blockchain.blockHash && (
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Block Hash</div>
                                <div className="mt-1 text-sm font-mono text-gray-900 dark:text-white truncate">{transaction.blockchain.blockHash}</div>
                              </div>
                            )}
                            
                            {transaction.blockchain && transaction.blockchain.transactionHash && (
                              <div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Transaction Hash</div>
                                <div className="mt-1 text-sm font-mono text-gray-900 dark:text-white truncate">{transaction.blockchain.transactionHash}</div>
                              </div>
                            )}
                            
                            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">Additional Metadata</div>
                                <div className="mt-1 text-sm text-gray-900 dark:text-white">
                                  <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto text-xs">
                                    {JSON.stringify(transaction.metadata, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 