'use client';

import React from 'react';
import { Transaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

export interface TransactionChartsProps {
  transactions: Transaction[];
  stats?: any; // Add stats property
}

const TransactionCharts: React.FC<TransactionChartsProps> = ({ transactions, stats }) => {
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-4 bg-gray-800 border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction Distribution</h3>
        <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center">
          {stats ? (
            <p className="text-gray-300">Stats data available: {Object.keys(stats).length} metrics</p>
          ) : (
            <p className="text-gray-300">Chart placeholder (transactions: {transactions.length})</p>
          )}
        </div>
      </Card>
      
      <Card className="p-4 bg-gray-800 border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction Timeline</h3>
        <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center">
          <p className="text-gray-300">Chart placeholder</p>
        </div>
      </Card>
      
      <Card className="p-4 bg-gray-800 border-gray-700 md:col-span-2">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 p-4 rounded-md">
            <h4 className="text-gray-400">Total Transactions</h4>
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-md">
            <h4 className="text-gray-400">Transaction Types</h4>
            <p className="text-2xl font-bold text-white">
              {Array.from(new Set(transactions.map(t => t.actionType || t.type))).length || 0}
            </p>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-md">
            <h4 className="text-gray-400">Products Involved</h4>
            <p className="text-2xl font-bold text-white">
              {Array.from(new Set(transactions.map(t => t.productId))).length || 0}
            </p>
          </div>
        </div>
        
        {stats && (
          <div className="mt-6 bg-gray-700 p-4 rounded-md">
            <h4 className="text-lg font-medium text-white mb-2">Database Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.stats && (
                <>
                  <div className="bg-gray-800 p-3 rounded-md">
                    <p className="text-gray-400 text-sm">Total Keys</p>
                    <p className="text-xl font-bold text-white">{stats.stats.totalKeys || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-md">
                    <p className="text-gray-400 text-sm">Transaction Keys</p>
                    <p className="text-xl font-bold text-white">{stats.stats.transactionKeys || 0}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-md">
                    <p className="text-gray-400 text-sm">Product Keys</p>
                    <p className="text-xl font-bold text-white">{stats.stats.productKeys || 0}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TransactionCharts; 