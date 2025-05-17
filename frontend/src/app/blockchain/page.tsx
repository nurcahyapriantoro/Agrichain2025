'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlockchainDashboard from './dashboard';
import BlockchainSearch from './search';
import { BlockExplorer } from './blocks';

export default function BlockchainPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ProtectedRoute allowNoRole={true}>
      <div className="py-10 web3-gradient-bg min-h-screen hex-pattern">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center mb-8">
              <h1 className="text-4xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] mb-2">
                Blockchain Explorer
              </h1>
              <div className="w-20 h-1 bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] rounded-full my-3 web3-pulse"></div>
              <p className="mt-2 text-gray-400 max-w-2xl">
                Explore the blockchain network, view blocks, and search for specific entries in a decentralized and transparent ledger system.
              </p>
            </div>
          </div>
        </header>
        
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <Tabs 
                defaultValue="dashboard" 
                value={activeTab} 
                onValueChange={setActiveTab} 
                className="space-y-8"
              >
                <div className="flex justify-center">
                  <TabsList className="grid grid-cols-3 w-full max-w-2xl bg-[#121212]/60 backdrop-blur-lg p-1 rounded-xl web3-glow">
                    <TabsTrigger 
                      value="dashboard"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300"
                    >
                      Dashboard
                    </TabsTrigger>
                    <TabsTrigger 
                      value="blocks"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300"
                    >
                      Blocks
                    </TabsTrigger>
                    <TabsTrigger 
                      value="search"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300"
                    >
                      Search
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="dashboard" className="space-y-4">
                  <BlockchainDashboard />
                </TabsContent>
                
                <TabsContent value="blocks" className="space-y-4">
                  <BlockExplorer />
                </TabsContent>
                
                <TabsContent value="search" className="space-y-4">
                  <BlockchainSearch />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
