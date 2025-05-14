'use client';

import { Transaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TransactionChartsProps {
  transactions: Transaction[];
}

export default function TransactionCharts({ transactions }: TransactionChartsProps) {
  const [typeData, setTypeData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    // Process type data for pie chart
    const typeCounts: Record<string, number> = {};
    transactions.forEach(transaction => {
      const type = (transaction.actionType || transaction.type || 'Unknown').toLowerCase();
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    
    const typeChartData = Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count
    }));
    
    setTypeData(typeChartData);

    // Process status data for pie chart
    const statusCounts: Record<string, number> = {};
    transactions.forEach(transaction => {
      const status = (transaction.status || 'Unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusChartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
    
    setStatusData(statusChartData);

    // Process time data for bar chart
    const dateMap: Record<string, number> = {};
    
    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => {
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
    
    // Group by day
    sortedTransactions.forEach(transaction => {
      if (!transaction.timestamp) return;
      
      const date = new Date(transaction.timestamp);
      const dateString = date.toLocaleDateString();
      
      dateMap[dateString] = (dateMap[dateString] || 0) + 1;
    });
    
    // Convert to array for chart
    const timeChartData = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count
    }));
    
    // Limit to last 15 days if we have more data
    const limitedTimeData = timeChartData.slice(-15);
    
    setTimeData(limitedTimeData);
  }, [transactions]);

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Transaction Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Activity Over Time */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Transaction Activity</h3>
          <div className="h-72">
            {timeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Transactions" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Types Distribution */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Transaction Types</h3>
          <div className="h-72">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status Distribution */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg lg:col-span-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Transaction Status Distribution</h3>
          <div className="h-72">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 