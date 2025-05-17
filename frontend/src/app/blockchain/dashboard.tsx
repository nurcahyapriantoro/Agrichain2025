'use client';

import { useState, useEffect } from 'react';
import { blockchainAPI } from '@/lib/api/blockchain';
import { BlockchainStats, MiningStatus } from '@/lib/api/blockchain';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Clock, Box, Database, Layers, BarChart, Zap } from 'lucide-react';

export default function BlockchainDashboard() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [miningStatus, setMiningStatus] = useState<MiningStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miningTriggered, setMiningTriggered] = useState(false);
  const [miningMessage, setMiningMessage] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch both blockchain stats and mining status in parallel
        const [statsResponse, miningStatusResponse] = await Promise.all([
          blockchainAPI.getBlockchainStats(),
          blockchainAPI.getMiningStatus()
        ]);

        // Debug logging to understand block structure
        if (statsResponse?.latestBlock) {
          console.log('Latest block data structure:', {
            hasTransactionsArray: Array.isArray(statsResponse.latestBlock.transactions),
            transactionsLength: statsResponse.latestBlock.transactions?.length,
            transactionCount: statsResponse.latestBlock.transactionCount,
            dataLength: statsResponse.latestBlock.data?.length,
            fullBlock: statsResponse.latestBlock
          });
        }

        setStats(statsResponse);
        setMiningStatus(miningStatusResponse);
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        setError('Failed to load blockchain information');
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Set up interval to refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const triggerMining = async () => {
    try {
      setMiningTriggered(true);
      setMiningMessage('Processing...');
      
      const result = await blockchainAPI.triggerManualMining();
      
      if (result && result.success) {
        setMiningMessage(result.message || 'Mining triggered successfully');
        
        // Refresh mining status after a short delay
        setTimeout(async () => {
          const newMiningStatus = await blockchainAPI.getMiningStatus();
          setMiningStatus(newMiningStatus);
          setMiningTriggered(false);
        }, 2000);
      } else {
        setMiningMessage(result?.message || 'Failed to trigger mining');
        setMiningTriggered(false);
      }
    } catch (error) {
      console.error('Error triggering mining:', error);
      setMiningMessage('Error occurred while triggering mining');
      setMiningTriggered(false);
    }
  };

  const formatDate = (dateString: string | number | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#50fa7b] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-[#bd93f9] animate-spin animate-delay-150"></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-[#50fa7b] animate-spin animate-delay-300"></div>
          <div className="absolute inset-6 rounded-full border-l-2 border-[#bd93f9] animate-spin animate-delay-500"></div>
        </div>
        <p className="mt-6 text-gray-400">Loading blockchain information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-900/30 p-6 my-8 border border-red-500/50 backdrop-blur-md">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-300">Error</h3>
            <div className="mt-2 text-red-200">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Blocks Card */}
        <div className="web3-card blockchain-card hover:web3-glow rounded-xl overflow-hidden relative border border-[#50fa7b]/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#50fa7b] to-transparent"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Total Blocks</h3>
              <div className="web3-float">
                <Layers className="h-5 w-5 text-[#50fa7b]" />
              </div>
            </div>
            <div className="data-value text-3xl font-bold mb-1">{stats?.stats.totalBlocks || 0}</div>
            <p className="text-xs text-gray-500">
              Latest height: <span className="text-[#bd93f9]">{stats?.stats.blockHeight || 0}</span>
            </p>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="web3-card blockchain-card hover:web3-glow rounded-xl overflow-hidden relative border border-[#bd93f9]/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bd93f9] to-transparent"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Total Transactions</h3>
              <div className="web3-float">
                <Database className="h-5 w-5 text-[#bd93f9]" />
              </div>
            </div>
            <div className="data-value text-3xl font-bold mb-1">{stats?.stats.totalTransactions || 0}</div>
            <p className="text-xs text-gray-500">
              Across all blocks
            </p>
          </div>
        </div>

        {/* Last Block Time Card */}
        <div className="web3-card blockchain-card hover:web3-glow rounded-xl overflow-hidden relative border border-[#50fa7b]/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#50fa7b] to-transparent"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Last Block Time</h3>
              <div className="web3-float">
                <Clock className="h-5 w-5 text-[#50fa7b]" />
              </div>
            </div>
            <div className="text-xl font-bold mb-1 text-white">{formatDate(stats?.stats.lastBlockTime)}</div>
            <p className="text-xs text-gray-500">
              Latest block mined
            </p>
          </div>
        </div>

        {/* Pending Transactions Card */}
        <div className="web3-card blockchain-card hover:web3-glow rounded-xl overflow-hidden relative border border-[#bd93f9]/20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#bd93f9] to-transparent"></div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-400">Pending Transactions</h3>
              <div className="web3-float">
                <Box className="h-5 w-5 text-[#bd93f9]" />
              </div>
            </div>
            <div className="data-value text-3xl font-bold mb-1">{miningStatus?.pendingTransactions || 0}</div>
            <p className="text-xs text-gray-500 mb-3">
              Waiting to be mined
            </p>
            {miningStatus && miningStatus.pendingTransactions > 0 && (
              <Button 
                className="w-full mt-2 text-xs bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] hover:opacity-90 transition-all duration-300 border-none shadow-lg shadow-purple-900/20"
                onClick={triggerMining}
                disabled={miningTriggered}
              >
                <Zap className="mr-2 h-4 w-4" />
                {miningTriggered ? "Processing..." : "Trigger Mining"}
              </Button>
            )}
            {miningMessage && (
              <p className="text-xs mt-3 font-medium text-[#50fa7b] web3-pulse">
                {miningMessage}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Latest Block Details */}
      {stats?.latestBlock && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#50fa7b] to-[#bd93f9]">Latest Block Information</h2>
          <div className="web3-card blockchain-card rounded-xl p-6 backdrop-blur-md border border-[#50fa7b]/20">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Block Hash</h3>
                <p className="text-sm text-white break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {stats.latestBlock.hash}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Previous Hash</h3>
                <p className="text-sm text-white break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {stats.latestBlock.previousHash || stats.latestBlock.lastHash || 'Genesis Block'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Timestamp</h3>
                <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {formatDate(stats.latestBlock.timestamp)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Nonce</h3>
                <p className="text-sm text-[#50fa7b] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {stats.latestBlock.nonce || 0}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Difficulty</h3>
                <p className="text-sm text-[#50fa7b] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {stats.latestBlock.difficulty || 0}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Transactions</h3>
                <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                  {stats.latestBlock.transactions?.length || stats.latestBlock.transactionCount || stats.latestBlock.data?.length || 0} transaction(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 