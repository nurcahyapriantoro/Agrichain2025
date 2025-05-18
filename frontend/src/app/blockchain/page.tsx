'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlockchainDashboard from './dashboard';
import BlockchainSearch from './search';
import { BlockExplorer } from './blocks';
import { motion } from 'framer-motion';

export default function BlockchainPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <ProtectedRoute allowNoRole={true}>
      <div className="relative py-10 min-h-screen overflow-hidden bg-[#121212]">
        {/* Dynamic web3 background elements */}
        <div className="absolute inset-0 z-0 web3-grid-pattern opacity-20"></div>
        <div className="absolute inset-0 z-0 web3-hex-pattern opacity-10"></div>
        
        {/* Animated gradient orbs */}
        <div 
          className="absolute z-0 w-[500px] h-[500px] rounded-full blur-[150px] bg-[#bd93f9]/20"
          style={{ 
            left: `${mousePosition.x / 10}px`, 
            top: `${mousePosition.y / 10}px`,
            transition: 'all 1.5s cubic-bezier(0.1, 0.9, 0.2, 1)'
          }}
        ></div>
        <div 
          className="absolute z-0 w-[400px] h-[400px] rounded-full blur-[150px] bg-[#50fa7b]/15"
          style={{ 
            right: `${mousePosition.x / 15}px`, 
            bottom: `${mousePosition.y / 15}px`,
            transition: 'all 2s cubic-bezier(0.1, 0.9, 0.2, 1)'
          }}
        ></div>
        
        {/* Digital rain effect (matrix-like) for web3 theme */}
        <div className="absolute inset-0 z-0 digital-rain-container opacity-5"></div>
        
        <header>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center text-center mb-8"
            >
              <h1 className="text-5xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] mb-2">
                Blockchain Explorer
              </h1>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "5rem" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-1 bg-gradient-to-r from-[#50fa7b] to-[#bd93f9] rounded-full my-3"
              />
              <p className="mt-2 text-gray-400 max-w-2xl text-lg">
                Explore the blockchain network, view blocks, and search for specific entries in a decentralized and transparent ledger system.
              </p>

              {/* Decorative elements - glowing dots */}
              <div className="mt-6 flex space-x-3">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ 
                      scale: [0.8, 1.2, 0.8], 
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.2
                    }}
                    className="w-2 h-2 rounded-full bg-gradient-to-r from-[#50fa7b] to-[#bd93f9]"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </header>
        
        <main className="relative z-10">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Tabs 
                  defaultValue="dashboard" 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="space-y-8"
                >
                  <div className="flex justify-center">
                    <TabsList className="grid grid-cols-3 w-full max-w-2xl bg-black/40 backdrop-blur-xl p-1 rounded-xl border border-[#bd93f9]/20 shadow-[0_0_15px_rgba(189,147,249,0.15)]">
                      <TabsTrigger 
                        value="dashboard"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300 
                        hover:bg-white/5 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(80,250,123,0.2)] group"
                      >
                        <span className="group-hover:text-[#50fa7b] transition-colors duration-200">Dashboard</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="blocks"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300
                        hover:bg-white/5 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(80,250,123,0.2)] group"
                      >
                        <span className="group-hover:text-[#50fa7b] transition-colors duration-200">Blocks</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="search"
                        className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#50fa7b]/20 data-[state=active]:to-[#bd93f9]/20 data-[state=active]:text-[#50fa7b] rounded-lg transition-all duration-300
                        hover:bg-white/5 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(80,250,123,0.2)] group"
                      >
                        <span className="group-hover:text-[#50fa7b] transition-colors duration-200">Search</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="dashboard" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-[#bd93f9]/20 shadow-lg hover:shadow-[0_0_20px_rgba(80,250,123,0.15)] transition-all duration-500"
                    >
                      <BlockchainDashboard />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="blocks" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-[#bd93f9]/20 shadow-lg hover:shadow-[0_0_20px_rgba(80,250,123,0.15)] transition-all duration-500"
                    >
                      <BlockExplorer />
                    </motion.div>
                  </TabsContent>
                  
                  <TabsContent value="search" className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-[#bd93f9]/20 shadow-lg hover:shadow-[0_0_20px_rgba(80,250,123,0.15)] transition-all duration-500"
                    >
                      <BlockchainSearch />
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </div>
          </div>
        </main>

        {/* Floating blockchain nodes visualization */}
        <div className="absolute bottom-0 left-0 w-full h-32 z-0 overflow-hidden blockchain-nodes-viz opacity-30"></div>
      </div>

      {/* CSS for the web3 background patterns and animations */}
      <style jsx global>{`
        .web3-grid-pattern {
          background-image: 
            linear-gradient(rgba(80, 250, 123, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80, 250, 123, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: gridMovement 150s linear infinite;
        }

        .web3-hex-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill-opacity='0.05' fill='%23bd93f9' fill-rule='evenodd'/%3E%3C/svg%3E");
          background-size: 40px 40px;
          animation: hexMovement 100s linear infinite;
        }

        .digital-rain-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .digital-rain-container::before {
          content: "";
          position: absolute;
          top: -100%;
          left: 0;
          width: 100%;
          height: 200%;
          background: repeating-linear-gradient(
            90deg,
            rgba(80, 250, 123, 0.03),
            rgba(80, 250, 123, 0.03) 1px,
            transparent 1px,
            transparent 20px
          );
          animation: digital-rain 20s linear infinite;
        }

        .blockchain-nodes-viz {
          background: radial-gradient(circle at 50% 100%, rgba(80, 250, 123, 0.1) 0%, transparent 70%);
        }

        .blockchain-nodes-viz::before,
        .blockchain-nodes-viz::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(189, 147, 249, 0.15) 0%, transparent 30%),
            radial-gradient(circle at 80% 90%, rgba(80, 250, 123, 0.15) 0%, transparent 30%);
          animation: pulse 5s ease-in-out infinite alternate;
        }

        @keyframes gridMovement {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 1000px 1000px;
          }
        }

        @keyframes hexMovement {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 500px 500px;
          }
        }

        @keyframes digital-rain {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(50%);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 0.3;
            transform: scale(1);
          }
          100% {
            opacity: 0.7;
            transform: scale(1.1);
          }
        }
      `}</style>
    </ProtectedRoute>
  );
}
