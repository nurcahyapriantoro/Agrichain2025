'use client';

import { useState, useEffect, useCallback } from 'react';
import { blockchainAPI } from '@/lib/api/blockchain';
import { Block, BlockDetailResponse } from '@/lib/api/blockchain';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronDown, ChevronUp, Clock, Database, FileText, Hash, Zap, Box } from 'lucide-react';
import React from 'react';

export function BlockExplorer() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<BlockDetailResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

  const toggleRowExpansion = (blockHash: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [blockHash]: !prev[blockHash]
    }));
  };

  const fetchBlocks = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const data = await blockchainAPI.getBlocks(page, 10);
      
      // Debug log to understand block structure
      if (data.data && data.data.length > 0) {
        console.log('Block data structure example:', {
          firstBlock: {
            hasTransactionsArray: Array.isArray(data.data[0].transactions),
            transactionsLength: data.data[0].transactions?.length,
            transactionCount: data.data[0].transactionCount,
            dataLength: data.data[0].data?.length,
            fullBlock: data.data[0]
          }
        });
      }
      
      setBlocks(data.data);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / (data.limit || 10)));
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks(currentPage);
  }, [currentPage, fetchBlocks]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const viewBlockDetails = async (blockId: string | number) => {
    try {
      const data = await blockchainAPI.getBlockById(blockId);
      if (data) {
        // Debug log for understanding block detail structure
        console.log('Block detail structure:', {
          hasTransactions: Array.isArray(data.transactions) && data.transactions.length > 0,
          transactionsCount: data.transactions?.length,
          blockDataTransactions: data.block.data?.length,
          blockTransactionsCount: data.block.transactionCount,
        });
        
        setSelectedBlock(data);
        setIsDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching block details:', error);
    }
  };

  const formatDate = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const renderPaginationLinks = () => {
    const links = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      links.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        links.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      links.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return links;
  };

  if (loading && blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-t-2 border-[#50fa7b] animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-[#bd93f9] animate-spin animate-delay-150"></div>
          <div className="absolute inset-4 rounded-full border-b-2 border-[#50fa7b] animate-spin animate-delay-300"></div>
          <div className="absolute inset-6 rounded-full border-l-2 border-[#bd93f9] animate-spin animate-delay-500"></div>
        </div>
        <p className="mt-6 text-gray-400">Loading blockchain blocks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="web3-card rounded-xl backdrop-blur-lg p-0.5 blockchain-card">
        <div className="overflow-hidden rounded-lg">
          <Table>
            <TableHeader className="bg-black/60">
              <TableRow className="border-b border-[#50fa7b]/10 hover:bg-transparent">
                <TableHead className="text-[#50fa7b] w-[100px]">Height</TableHead>
                <TableHead className="text-[#50fa7b]">Hash</TableHead>
                <TableHead className="text-[#50fa7b] hidden lg:table-cell">Timestamp</TableHead>
                <TableHead className="text-[#50fa7b] hidden md:table-cell">Transactions</TableHead>
                <TableHead className="text-[#50fa7b] w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((block) => (
                <React.Fragment key={block.hash}>
                  <TableRow 
                    className={`cursor-pointer transition-colors border-b border-[#50fa7b]/10 hover:bg-[#50fa7b]/5 ${expandedRows[block.hash] ? 'bg-[#121212]' : ''}`}
                    onClick={() => toggleRowExpansion(block.hash)}
                  >
                    <TableCell className="font-medium text-[#bd93f9]">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#50fa7b] web3-pulse" />
                        #{block.height || block.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-[#bd93f9] hidden md:inline" />
                        <span className="text-gray-300 font-mono text-sm">{truncateHash(block.hash)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#50fa7b]" />
                        {formatDate(block.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-gray-400">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-[#bd93f9]" />
                        {block.transactions?.length || block.transactionCount || block.data?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          className="bg-[#121212] hover:bg-black border border-[#50fa7b]/20 hover:border-[#50fa7b]/40 text-[#50fa7b] text-xs p-1 h-8 rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewBlockDetails(block.hash);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" /> View
                        </Button>
                        <div className="text-[#bd93f9]">
                          {expandedRows[block.hash] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedRows[block.hash] && (
                    <TableRow className="bg-[#090909] border-b border-[#50fa7b]/10">
                      <TableCell colSpan={5} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {block.previousHash && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Previous Hash</h3>
                              <p className="text-xs text-gray-300 font-mono break-all bg-black/40 p-2 rounded">{block.previousHash}</p>
                            </div>
                          )}
                          {block.lastHash && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Last Hash</h3>
                              <p className="text-xs text-gray-300 font-mono break-all bg-black/40 p-2 rounded">{block.lastHash}</p>
                            </div>
                          )}
                          {block.nonce !== undefined && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Nonce</h3>
                              <p className="text-xs text-[#50fa7b] font-mono bg-black/40 p-2 rounded">{block.nonce}</p>
                            </div>
                          )}
                          {block.difficulty !== undefined && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Difficulty</h3>
                              <p className="text-xs text-[#50fa7b] font-mono bg-black/40 p-2 rounded">{block.difficulty}</p>
                            </div>
                          )}
                          {block.miner && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Miner</h3>
                              <p className="text-xs text-gray-300 font-mono bg-black/40 p-2 rounded">{block.miner}</p>
                            </div>
                          )}
                          {block.size !== undefined && (
                            <div>
                              <h3 className="text-xs font-medium text-gray-400 mb-1">Size</h3>
                              <p className="text-xs text-[#bd93f9] font-mono bg-black/40 p-2 rounded">{block.size} bytes</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
          </PaginationItem>
          
          {renderPaginationLinks()}
          
          <PaginationItem>
            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl web3-card backdrop-blur-lg border border-[#50fa7b]/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#50fa7b] to-[#bd93f9]">
              Block Details
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Complete information about block {selectedBlock?.block.height || selectedBlock?.block.number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBlock && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Block Hash</h3>
                  <p className="text-sm text-white font-mono break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                    {selectedBlock.block.hash}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Block Height</h3>
                  <p className="text-sm text-[#bd93f9] font-mono bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                    #{selectedBlock.block.height || selectedBlock.block.number}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Previous Hash</h3>
                  <p className="text-sm text-white font-mono break-all bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                    {selectedBlock.block.previousHash || selectedBlock.block.lastHash || 'Genesis Block'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Timestamp</h3>
                  <p className="text-sm text-[#50fa7b] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                    {formatDate(selectedBlock.block.timestamp)}
                  </p>
                </div>
                {selectedBlock.block.nonce !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Nonce</h3>
                    <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                      {selectedBlock.block.nonce}
                    </p>
                  </div>
                )}
                {selectedBlock.block.difficulty !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Difficulty</h3>
                    <p className="text-sm text-[#bd93f9] bg-black/40 p-3 rounded border border-[#50fa7b]/10">
                      {selectedBlock.block.difficulty}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Conditionally show transactions section if any transactions exist */}
              {(selectedBlock.transactions?.length > 0 || 
                (selectedBlock.block.transactions && selectedBlock.block.transactions.length > 0) || 
                (selectedBlock.block.data && selectedBlock.block.data.length > 0) || 
                (selectedBlock.block.transactionCount && selectedBlock.block.transactionCount > 0)) && (
                <div>
                  <h3 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#bd93f9] to-[#50fa7b] mb-3">
                    Block Transactions ({selectedBlock.transactions?.length || 
                      (selectedBlock.block.transactions?.length) || 
                      (selectedBlock.block.data?.length) || 
                      selectedBlock.block.transactionCount || 0})
                  </h3>
                  <div className="backdrop-blur rounded border border-[#bd93f9]/20 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-black/60">
                        <TableRow className="border-b border-[#bd93f9]/10">
                          <TableHead className="text-[#bd93f9]">TX Hash</TableHead>
                          <TableHead className="text-[#bd93f9]">From</TableHead>
                          <TableHead className="text-[#bd93f9]">To</TableHead>
                          <TableHead className="text-[#bd93f9]">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* First try to use selectedBlock.transactions */}
                        {selectedBlock.transactions?.map((tx) => (
                          <TableRow key={tx.hash || tx.id || tx.transactionHash} className="border-b border-[#bd93f9]/10 hover:bg-[#bd93f9]/5">
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.hash || tx.id || tx.transactionHash || '')}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.from)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.to)}
                            </TableCell>
                            <TableCell className="text-[#50fa7b]">
                              {tx.data?.type || 'Transaction'}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Then try block.transactions if they exist */}
                        {!selectedBlock.transactions?.length && selectedBlock.block.transactions?.map((tx, index) => (
                          <TableRow key={`block-tx-${index}`} className="border-b border-[#bd93f9]/10 hover:bg-[#bd93f9]/5">
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.hash || tx.id || tx.transactionHash || '')}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.from)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(tx.to)}
                            </TableCell>
                            <TableCell className="text-[#50fa7b]">
                              {tx.data?.type || 'Transaction'}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Finally, try block.data if it contains transactions */}
                        {!selectedBlock.transactions?.length && !selectedBlock.block.transactions?.length && selectedBlock.block.data?.map((item, index) => (
                          <TableRow key={`data-item-${index}`} className="border-b border-[#bd93f9]/10 hover:bg-[#bd93f9]/5">
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(item.hash || item.id || item.transactionHash || `tx-${index}`)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(item.from || '')}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-300">
                              {truncateHash(item.to || '')}
                            </TableCell>
                            <TableCell className="text-[#50fa7b]">
                              {item.type || 'Data Item'}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Show "No transaction details available" if we have a count but no transaction data */}
                        {!selectedBlock.transactions?.length && 
                          !selectedBlock.block.transactions?.length && 
                          !selectedBlock.block.data?.length && 
                          selectedBlock.block.transactionCount !== undefined &&
                          selectedBlock.block.transactionCount > 0 && (
                          <TableRow className="border-b border-[#bd93f9]/10">
                            <TableCell colSpan={4} className="text-center text-gray-400 py-4">
                              Block contains {selectedBlock.block.transactionCount} transactions, but detailed transaction data is not available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setIsDialogOpen(false)}
              className="bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] hover:opacity-90 transition-all duration-300 border-none shadow-lg shadow-purple-900/20"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 