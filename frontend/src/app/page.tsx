'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Web3Background, 
  SupplyChainAnimation,
  ScrollFollowingAnimation, 
  HeroSection,
  FeatureSection,
  StatisticsSection
} from '@/components/home';

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [walletAuthenticated, setWalletAuthenticated] = useState(false);
  
  // Periksa autentikasi wallet saat komponen mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const walletToken = localStorage.getItem('walletAuthToken') || localStorage.getItem('web3AuthToken');
      const walletUserData = localStorage.getItem('walletUserData');
      
      if (walletToken && walletUserData) {
        setWalletAuthenticated(true);
        console.log('Home: Wallet auth detected');
      }
    }
  }, []);
  
  // User dianggap terotentikasi jika ada session NextAuth ATAU ada autentikasi wallet
  const isAuthenticated = !!session?.user || walletAuthenticated;
  
  // Data state for statistics
  const [userStatistics, setUserStatistics] = useState<{
    totalUsers: number;
    farmerCount: number;
    collectorCount: number;
    traderCount: number;
    retailerCount: number;
    consumerCount: number;
  } | null>(null);
  
  const [signupTrends, setSignupTrends] = useState<Array<{
    date: string;
    count: number;
  }>>([]);
  
  const [transactionData, setTransactionData] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data for dashboard statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Mock data for demo purposes
        // In a real app, these would be API calls to backend
        
        // Mock user statistics
        setUserStatistics({
          totalUsers: 235,
          farmerCount: 85,
          collectorCount: 45,
          traderCount: 30,
          retailerCount: 55,
          consumerCount: 20
        });
        
        // Mock signup trends
        const mockTrends = [
          { date: 'Jan', count: 15 },
          { date: 'Feb', count: 22 },
          { date: 'Mar', count: 28 },
          { date: 'Apr', count: 35 },
          { date: 'May', count: 42 },
          { date: 'Jun', count: 48 },
          { date: 'Jul', count: 55 },
          { date: 'Aug', count: 65 },
          { date: 'Sep', count: 75 },
          { date: 'Oct', count: 90 },
          { date: 'Nov', count: 110 },
          { date: 'Dec', count: 128 }
        ];
        setSignupTrends(mockTrends);
        
        // Mock transaction data
        const mockTransactions = [
          { id: 1, type: 'transfer', amount: 5, date: '2023-12-01' },
          { id: 2, type: 'certification', amount: 3, date: '2023-12-05' },
          { id: 3, type: 'transfer', amount: 7, date: '2023-12-10' },
          { id: 4, type: 'verification', amount: 2, date: '2023-12-15' },
          { id: 5, type: 'transfer', amount: 10, date: '2023-12-20' }
        ];
        setTransactionData(mockTransactions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background Animations */}
      <Web3Background />
      <SupplyChainAnimation />
      <ScrollFollowingAnimation />
      
      {/* Hero Section */}
      <HeroSection isAuthenticated={isAuthenticated} />
      
      {/* Feature Section */}
      <FeatureSection />
      
      {/* Statistics Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <StatisticsSection 
            userStatistics={userStatistics}
            signupTrends={signupTrends}
            transactionData={transactionData}
            isLoading={isLoading}
          />
        </div>
      </section>
      
      {/* Footer Highlight - Hide for authenticated users */}
      {!isAuthenticated && (
        <section className="py-16 bg-black/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Join the Agricultural Revolution?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
              Start tracking your products on the blockchain today. Join farmers, collectors, 
              traders, retailers, and consumers on our transparent supply chain platform.
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="/register" 
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-md font-medium"
              >
                Create Account
              </a>
              <a 
                href="/roles" 
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-md font-medium border border-gray-700"
              >
                Explore Roles
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
