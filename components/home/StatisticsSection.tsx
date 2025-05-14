import { useState, useEffect } from 'react';
import { UserDistributionChart, UserGrowthChart } from './BasicCharts';

interface UserStatistics {
  totalUsers: number;
  farmerCount: number;
  collectorCount: number;
  traderCount: number;
  retailerCount: number;
  consumerCount: number;
}

interface SignupTrend {
  date: string;
  count: number;
}

interface StatisticsSectionProps {
  userStatistics: UserStatistics | null;
  signupTrends: SignupTrend[];
  transactionData: any[];
  isLoading: boolean;
}

export function StatisticsSection({ 
  userStatistics, 
  signupTrends, 
  transactionData,
  isLoading 
}: StatisticsSectionProps) {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Trigger animation after a short delay for better UX
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate distribution percentages for the pie chart
  const calculateRolePercentages = () => {
    if (!userStatistics || userStatistics.totalUsers === 0) return [];
    
    return [
      { name: 'Farmers', value: userStatistics.farmerCount, color: '#4CAF50' },
      { name: 'Collectors', value: userStatistics.collectorCount, color: '#2196F3' },
      { name: 'Traders', value: userStatistics.traderCount, color: '#FF9800' },
      { name: 'Retailers', value: userStatistics.retailerCount, color: '#9C27B0' },
      { name: 'Consumers', value: userStatistics.consumerCount, color: '#F44336' }
    ];
  };

  const roleData = calculateRolePercentages();

  // Render placeholder when loading
  if (isLoading) {
    return (
      <div className="rounded-xl bg-black/20 backdrop-blur-sm border border-gray-800 p-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-700 rounded"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl bg-black/30 backdrop-blur-sm border border-gray-700 p-6 shadow-xl transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <h2 className="text-2xl font-semibold text-white mb-8 flex items-center">
        <span className="inline-block mr-3 w-2 h-8 bg-indigo-500 rounded-sm"></span>
        Platform Statistics
        <span className="ml-2 text-xs text-gray-400 font-normal">(Real-time Data)</span>
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Distribution Chart */}
        <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
          <UserDistributionChart 
            data={roleData} 
            totalUsers={userStatistics?.totalUsers || 0} 
          />
        </div>
        
        {/* User Growth Chart */}
        <div className={`transition-all duration-700 delay-500 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
          <UserGrowthChart 
            data={signupTrends}
            chartType={chartType}
            onChartTypeChange={setChartType}
          />
        </div>
      </div>
      
      {/* Additional Stats Summary */}
      <div className={`mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-700 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 p-4 rounded-lg border border-indigo-900/50">
          <div className="text-gray-400 text-xs mb-1">Total Users</div>
          <div className="text-2xl font-bold text-white">{userStatistics?.totalUsers || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-4 rounded-lg border border-green-900/50">
          <div className="text-gray-400 text-xs mb-1">Farmers</div>
          <div className="text-2xl font-bold text-white">{userStatistics?.farmerCount || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-4 rounded-lg border border-blue-900/50">
          <div className="text-gray-400 text-xs mb-1">Collectors</div>
          <div className="text-2xl font-bold text-white">{userStatistics?.collectorCount || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-4 rounded-lg border border-purple-900/50">
          <div className="text-gray-400 text-xs mb-1">Traders & Retailers</div>
          <div className="text-2xl font-bold text-white">{(userStatistics?.traderCount || 0) + (userStatistics?.retailerCount || 0)}</div>
        </div>
      </div>
    </div>
  );
} 