'use client';

import { useState, useEffect } from 'react';
import { blockchainAPI } from '@/lib/api/blockchain';
import { SearchResponse, Block, Transaction } from '@/lib/api/blockchain';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Box, Database, Hash, AlertCircle, CheckCircle2, FileText, Clock, Key, Copy } from 'lucide-react';
import Link from 'next/link';
import { authAPI } from '@/lib/api/auth';

// Helper type guards
function isBlock(result: Block | Transaction): result is Block {
  return (result as Block).hash !== undefined && (result as Block).timestamp !== undefined &&
         (result as Transaction).from === undefined;
}

function isTransaction(result: Block | Transaction): result is Transaction {
  return (result as Transaction).from !== undefined && (result as Transaction).to !== undefined;
}

export default function BlockchainSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromUserDetails, setFromUserDetails] = useState<{ userId: string; name: string; publicKey: string } | null>(null);
  const [toUserDetails, setToUserDetails] = useState<{ userId: string; name: string; publicKey: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm) {
      setError('Please enter a search term');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchResult(null);
      
      const result = await blockchainAPI.searchBlockchain(searchTerm);
      
      if (result) {
        setSearchResult(result);
      } else {
        setError('No results found for the search term');
      }
    } catch (error) {
      console.error('Error during blockchain search:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // When search result changes and it's a transaction, fetch user details
    if (searchResult?.type === 'transaction' && isTransaction(searchResult.result)) {
      const tx = searchResult.result;
      fetchUserDetailsFromAddresses(tx.from, tx.to);
    }
  }, [searchResult]);

  // Function to fetch user details from addresses
  const fetchUserDetailsFromAddresses = async (fromAddress?: string, toAddress?: string) => {
    try {
      // Reset existing state
      setFromUserDetails(null);
      setToUserDetails(null);
      
      if (!fromAddress && !toAddress) return;
      
      // Try to extract user IDs from addresses
      const fromUserId = fromAddress && fromAddress.includes('-') ? 
        fromAddress.split('-')[0] + '-' + fromAddress.split('-')[1] : null;
      const toUserId = toAddress && toAddress.includes('-') ? 
        toAddress.split('-')[0] + '-' + toAddress.split('-')[1] : null;
      
      // Fetch from user details
      if (fromUserId) {
        try {
          const fromUserResponse = await authAPI.getPublicKeyById(fromUserId);
          if (fromUserResponse.success && fromUserResponse.data) {
            setFromUserDetails({
              userId: fromUserResponse.data.userId,
              name: fromUserResponse.data.userName,
              publicKey: fromUserResponse.data.publicKey
            });
          }
        } catch (error) {
          console.error('Error fetching from user details:', error);
        }
      }
      
      // Fetch to user details
      if (toUserId) {
        try {
          const toUserResponse = await authAPI.getPublicKeyById(toUserId);
          if (toUserResponse.success && toUserResponse.data) {
            setToUserDetails({
              userId: toUserResponse.data.userId,
              name: toUserResponse.data.userName,
              publicKey: toUserResponse.data.publicKey
            });
          }
        } catch (error) {
          console.error('Error fetching to user details:', error);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserDetailsFromAddresses:', error);
    }
  };

  // Helper function to extract user ID from address
  const extractUserIdFromAddress = (address?: string): string | null => {
    if (!address) return null;
    
    // Check if address follows the pattern ROLE-XXXXX...
    const parts = address.split('-');
    if (parts.length >= 2) {
      return `${parts[0]}-${parts[1]}`;
    }
    return null;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const truncateHash = (hash: string | undefined, length = 8) => {
    if (!hash) return 'N/A';
    if (hash.length <= length * 2) return hash;
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
  };

  const formatDate = (timestamp: number | string | undefined) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  const renderResultCard = () => {
    if (!searchResult) return null;

    switch (searchResult.type) {
      case 'block': {
        const block = searchResult.result as Block;
        return (
          <div className="web3-card blockchain-card rounded-xl overflow-hidden backdrop-blur-lg mt-8 border border-[#50fa7b]/30">
            <div className="bg-gradient-to-r from-[#50fa7b]/10 to-[#121212] p-6 border-b border-[#50fa7b]/20">
              <div className="flex items-center gap-3">
                <Box className="h-6 w-6 text-[#50fa7b] web3-float" />
                <h2 className="text-xl font-semibold text-white">Block Found</h2>
              </div>
              <p className="text-gray-400 mt-2">Block #{block.height || block.number}</p>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Block Hash</h3>
                <p className="text-sm text-white font-mono break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {block.hash}
                </p>
              </div>
              {(block.previousHash || block.lastHash) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Previous Hash</h3>
                  <p className="text-sm text-white font-mono break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                    {block.previousHash || block.lastHash}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Timestamp</h3>
                <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {formatDate(block.timestamp)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Transactions</h3>
                <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {block.transactionCount || (block.transactions && block.transactions.length) || 0}
                </p>
              </div>
              <div className="md:col-span-2 mt-4">
                <Button
                  className="bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] hover:opacity-90 transition-all duration-300 border-none shadow-lg shadow-purple-900/20"
                  onClick={() => window.open(`/blockchain?block=${block.hash}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Block Details
                </Button>
              </div>
            </div>
          </div>
        );
      }

      case 'transaction': {
        const tx = searchResult.result as Transaction;
        return (
          <div className="web3-card blockchain-card rounded-xl overflow-hidden backdrop-blur-lg mt-8 border border-[#bd93f9]/30">
            <div className="bg-gradient-to-r from-[#bd93f9]/10 to-[#121212] p-6 border-b border-[#bd93f9]/20">
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-[#bd93f9] web3-float" />
                <h2 className="text-xl font-semibold text-white">Transaction Found</h2>
              </div>
              <p className="text-gray-400 mt-2">Transaction ID: {truncateHash(tx.id || tx.hash || tx.transactionHash, 12)}</p>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">From</h3>
                <div className="bg-black/40 p-3 rounded border border-[#bd93f9]/10">
                  <p className="text-sm text-white mb-1 flex items-center justify-between">
                    <span className="text-gray-400">User ID: </span>
                    <span className="font-mono">{fromUserDetails?.userId || extractUserIdFromAddress(tx.from) || (tx as any).fromUserId || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-white mb-1 flex items-center justify-between">
                    <span className="text-gray-400">Role: </span>
                    <span>{(tx as any).fromRole || tx.data?.fromRole || fromUserDetails?.userId?.split('-')[0] || 'User'}</span>
                  </p>
                  <div className="text-sm text-white flex items-start gap-2">
                    <span className="text-gray-400 whitespace-nowrap">Public Key: </span>
                    <div className="font-mono text-xs break-all flex-1">
                      {fromUserDetails?.publicKey || tx.from}
                      <button 
                        onClick={() => copyToClipboard(fromUserDetails?.publicKey || tx.from)}
                        className="ml-2 inline-flex p-1 rounded hover:bg-[#bd93f9]/20 transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">To</h3>
                <div className="bg-black/40 p-3 rounded border border-[#bd93f9]/10">
                  <p className="text-sm text-white mb-1 flex items-center justify-between">
                    <span className="text-gray-400">User ID: </span>
                    <span className="font-mono">{toUserDetails?.userId || extractUserIdFromAddress(tx.to) || (tx as any).toUserId || 'N/A'}</span>
                  </p>
                  <p className="text-sm text-white mb-1 flex items-center justify-between">
                    <span className="text-gray-400">Role: </span>
                    <span>{(tx as any).toRole || tx.data?.toRole || toUserDetails?.userId?.split('-')[0] || 'User'}</span>
                  </p>
                  <div className="text-sm text-white flex items-start gap-2">
                    <span className="text-gray-400 whitespace-nowrap">Public Key: </span>
                    <div className="font-mono text-xs break-all flex-1">
                      {toUserDetails?.publicKey || tx.to}
                      <button 
                        onClick={() => copyToClipboard(toUserDetails?.publicKey || tx.to)}
                        className="ml-2 inline-flex p-1 rounded hover:bg-[#bd93f9]/20 transition-colors"
                      >
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Timestamp</h3>
                <p className="text-sm text-[#50fa7b] bg-black/40 p-3 rounded border border-[#bd93f9]/10 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatDate(tx.timestamp)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Transaction Details</h3>
                <div className="bg-black/40 p-3 rounded border border-[#bd93f9]/10">
                  <p className="text-sm text-white mb-1 flex items-center justify-between">
                    <span className="text-gray-400">Type: </span>
                    <span className="text-[#bd93f9]">{tx.data?.type || (tx as any).actionType || 'Standard Transaction'}</span>
                  </p>
                  {(tx as any).productId && (
                    <p className="text-sm text-white mb-1 flex items-center justify-between">
                      <span className="text-gray-400">Product ID: </span>
                      <span className="font-mono">{(tx as any).productId}</span>
                    </p>
                  )}
                  {tx.blockchain && (
                    <p className="text-sm text-white flex items-center justify-between">
                      <span className="text-gray-400">Block: </span>
                      <span>#{tx.blockchain.blockHeight}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 mt-4 flex justify-between">
                <Button
                  className="bg-gradient-to-r from-[#bd93f9] to-[#50fa7b] hover:opacity-90 transition-all duration-300 border-none shadow-lg shadow-purple-900/20"
                  onClick={() => window.open(`/transactions/${tx.id || tx.hash || tx.transactionHash}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Transaction Details
                </Button>
                
                {(tx as any).productId && (
                  <Button
                    variant="outline"
                    className="border-[#bd93f9]/30 text-[#bd93f9] hover:bg-[#bd93f9]/10"
                    onClick={() => window.open(`/history/product/${(tx as any).productId}`, '_blank')}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    View Product History
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'product': {
        const productData = searchResult.result;
        return (
          <div className="web3-card blockchain-card rounded-xl overflow-hidden backdrop-blur-lg mt-8 border border-[#50fa7b]/30">
            <div className="bg-gradient-to-r from-[#50fa7b]/10 to-[#121212] p-6 border-b border-[#50fa7b]/20">
              <div className="flex items-center gap-3">
                <Box className="h-6 w-6 text-[#50fa7b] web3-float" />
                <h2 className="text-xl font-semibold text-white">Product Found</h2>
              </div>
              <p className="text-gray-400 mt-2">Product ID: {searchResult.productId}</p>
            </div>
            
            {/* Product Details Section */}
            <div className="p-6 grid gap-6 md:grid-cols-2 border-b border-[#50fa7b]/20">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Product Information</h3>
                <div className="bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  <p className="text-sm text-white mb-1">
                    <span className="text-gray-400">ID: </span>
                    {searchResult.productId}
                  </p>
                  <p className="text-sm text-white mb-1">
                    <span className="text-gray-400">Type: </span>
                    {productData?.data?.productType || "Agricultural Product"}
                  </p>
                  <p className="text-sm text-white">
                    <span className="text-gray-400">Created: </span>
                    {formatDate(productData?.timestamp) || "Unknown"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Blockchain Status</h3>
                <div className="bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  <p className="text-sm text-white mb-1">
                    <span className="text-gray-400">Status: </span>
                    <span className="text-[#50fa7b]">
                      {(productData as any)?.blockchain ? "Verified on Blockchain" : "Pending Verification"}
                    </span>
                  </p>
                  {(productData as any)?.blockchain && (
                    <>
                      <p className="text-sm text-white mb-1">
                        <span className="text-gray-400">Block: </span>
                        #{(productData as any).blockchain.blockHeight || 0}
                      </p>
                      <p className="text-sm font-mono text-xs text-white truncate">
                        <span className="text-gray-400">TX Hash: </span>
                        {truncateHash((productData as any).blockchain.transactionHash, 8)}
                      </p>
                    </>
                  )}
                </div>
              </div>
                            
              <div className="md:col-span-2 flex justify-between">
                <Button
                  className="bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] hover:opacity-90 transition-all duration-300 border-none shadow-lg shadow-purple-900/20"
                  onClick={() => window.open(`/products/${searchResult.productId}`, '_blank')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Full Product Details
                </Button>
                
                <Button
                  variant="outline"
                  className="border-[#50fa7b]/30 text-[#50fa7b] hover:bg-[#50fa7b]/10"
                  onClick={() => window.open(`/history/product/${searchResult.productId}`, '_blank')}
                >
                  <Database className="h-4 w-4 mr-2" />
                  View Complete History
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Transactions</h3>
              <div className="bg-black/40 rounded-lg border border-[#50fa7b]/10 overflow-hidden">
                <div className="grid grid-cols-5 bg-[#121212] p-3 border-b border-[#50fa7b]/20">
                  <div className="col-span-2 text-[#50fa7b] text-sm font-medium">Transaction</div>
                  <div className="text-[#50fa7b] text-sm font-medium">Type</div>
                  <div className="text-[#50fa7b] text-sm font-medium">From</div>
                  <div className="text-[#50fa7b] text-sm font-medium">Timestamp</div>
                </div>
                <div className="divide-y divide-[#50fa7b]/10">
                  {searchResult.transactions && searchResult.transactions.map((tx, index) => (
                    <div 
                      key={index} 
                      className="grid grid-cols-5 p-3 hover:bg-[#50fa7b]/5 transition-colors cursor-pointer"
                      onClick={() => window.open(`/transactions/${tx.id || tx.hash || tx.transactionHash}`, '_blank')}
                    >
                      <div className="col-span-2 font-mono text-xs text-gray-300 truncate">{truncateHash(tx.id || tx.hash || tx.transactionHash)}</div>
                      <div className="text-xs text-white">{tx.data?.type || (tx as any).actionType || 'Transaction'}</div>
                      <div className="font-mono text-xs text-gray-300 truncate">
                        {(tx as any).fromUserId || tx.from || (tx as any).fromUser || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(tx.timestamp)}</div>
                    </div>
                  ))}
                  
                  {(!searchResult.transactions || searchResult.transactions.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                      No transactions found for this product
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'user':
        return (
          <div className="web3-card blockchain-card rounded-xl overflow-hidden backdrop-blur-lg mt-8 border border-[#bd93f9]/30">
            <div className="bg-gradient-to-r from-[#bd93f9]/10 to-[#121212] p-6 border-b border-[#bd93f9]/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-[#bd93f9] web3-float" />
                <h2 className="text-xl font-semibold text-white">User Found</h2>
              </div>
              <p className="text-gray-400 mt-2">User ID: {searchResult.userId}</p>
            </div>
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">User Transactions</h3>
              <div className="bg-black/40 rounded-lg border border-[#bd93f9]/10 overflow-hidden">
                <div className="grid grid-cols-5 bg-[#121212] p-3 border-b border-[#bd93f9]/20">
                  <div className="col-span-2 text-[#bd93f9] text-sm font-medium">Transaction</div>
                  <div className="text-[#bd93f9] text-sm font-medium">Type</div>
                  <div className="text-[#bd93f9] text-sm font-medium">To</div>
                  <div className="text-[#bd93f9] text-sm font-medium">Timestamp</div>
                </div>
                <div className="divide-y divide-[#bd93f9]/10">
                  {searchResult.transactions && searchResult.transactions.map((tx, index) => (
                    <div key={index} className="grid grid-cols-5 p-3 hover:bg-[#bd93f9]/5 transition-colors">
                      <div className="col-span-2 font-mono text-xs text-gray-300 truncate">{truncateHash(tx.id || tx.hash || tx.transactionHash)}</div>
                      <div className="text-xs text-white">{tx.data?.type || 'Transaction'}</div>
                      <div className="font-mono text-xs text-gray-300 truncate">{truncateHash(tx.to, 6)}</div>
                      <div className="text-xs text-gray-400">{formatDate(tx.timestamp)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 mt-4">
            <p>Unknown result type: {searchResult.type}</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="web3-card blockchain-card rounded-xl backdrop-blur-lg p-6 border border-[#50fa7b]/20">
        <div className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#50fa7b] to-[#bd93f9]">
          Blockchain Search
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Search for blocks, transactions, products, or users by entering a block hash, block height, transaction ID, product ID, or user ID.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter block hash, transaction ID, product ID or user ID..."
              className="pl-10 bg-black/40 border-[#50fa7b]/20 focus:border-[#bd93f9] focus:ring-[#bd93f9]/20 placeholder-gray-500 text-gray-200"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !searchTerm}
            className="bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] hover:opacity-90 transition-all duration-300 border-none w-full sm:w-auto px-6"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {/* Search result display */}
      {renderResultCard()}
      
      {/* Search tips */}
      <div className="web3-card rounded-xl backdrop-blur-lg p-6 border border-[#bd93f9]/20 mt-8">
        <div className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#bd93f9] to-[#50fa7b]">
          Search Tips
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-black/40 p-4 rounded-lg border border-[#bd93f9]/10">
            <div className="flex items-center gap-2 text-[#bd93f9] mb-2">
              <Hash className="h-5 w-5" />
              <h3 className="font-medium">Block Hash</h3>
            </div>
            <p className="text-sm text-gray-400">
              Search using the full block hash to find specific block details
            </p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-[#bd93f9]/10">
            <div className="flex items-center gap-2 text-[#50fa7b] mb-2">
              <Box className="h-5 w-5" />
              <h3 className="font-medium">Block Height</h3>
            </div>
            <p className="text-sm text-gray-400">
              Enter a block number/height to retrieve that specific block
            </p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-[#bd93f9]/10">
            <div className="flex items-center gap-2 text-[#bd93f9] mb-2">
              <Database className="h-5 w-5" />
              <h3 className="font-medium">Transaction ID</h3>
            </div>
            <p className="text-sm text-gray-400">
              Search transactions using the transaction ID or hash
            </p>
          </div>
          <div className="bg-black/40 p-4 rounded-lg border border-[#bd93f9]/10">
            <div className="flex items-center gap-2 text-[#50fa7b] mb-2">
              <Box className="h-5 w-5" />
              <h3 className="font-medium">Product ID</h3>
            </div>
            <p className="text-sm text-gray-400">
              Search for product history using the product ID
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 