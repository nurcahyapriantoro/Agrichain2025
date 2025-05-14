import { AreaChart, Area, XAxis, YAxis, CartesianGrid, TooltipProps, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar, Legend, Cell, LabelList } from 'recharts';
import React, { useEffect, useState } from 'react';

// User distribution chart
interface RoleData {
  name: string;
  value: number;
  color: string;
}

export function UserDistributionChart({ data, totalUsers }: { data: RoleData[], totalUsers: number }) {
  const [animatedData, setAnimatedData] = useState<RoleData[]>([]);
  
  useEffect(() => {
    // Reset data for animation
    setAnimatedData([]);
    
    // Animate data entry by entry
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [data]);
  
  // Calculate percentage for each category
  const dataWithPercentage = animatedData.map(item => ({
    ...item,
    percentage: totalUsers > 0 ? ((item.value / totalUsers) * 100).toFixed(1) : '0'
  }));

  return (
    <div className="bg-gray-900/70 rounded-lg p-5 border border-gray-800 shadow-lg animate-scaleUp">
      <h3 className="text-xl font-medium text-white mb-4 animate-fadeInLeft">User Distribution</h3>
      <div className="h-64 animate-histogram3D">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dataWithPercentage} layout="vertical" barGap={8} margin={{ right: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => `${value}`}
              axisLine={{ stroke: '#666' }}
              tick={{ fill: '#bbb' }}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={90}
              axisLine={{ stroke: '#666' }}
              tick={{ fill: '#bbb' }}
            />
            <Tooltip 
              wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
              contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ fontWeight: 'bold', color: '#fff' }}  
            />
            <Bar 
              dataKey="value" 
              name="Users"
              radius={[0, 4, 4, 0]}
              animationDuration={1500}
              animationBegin={300}
              animationEasing="ease-out"
              className="animate-chartGlow"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  fillOpacity={0.85}
                  stroke={entry.color}
                  strokeWidth={1}
                  className="chart-segment"
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                style={{ fill: '#fff', fontSize: 12, fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-center animate-fadeInUp">
        <p className="text-gray-300 font-medium">
          Total Users: <span className="text-white text-lg">{totalUsers || 0}</span>
        </p>
      </div>
    </div>
  );
}

// User growth chart
interface SignupTrend {
  date: string;
  count: number;
}

type ChartType = 'area' | 'line' | 'bar';

interface UserGrowthChartProps {
  data: SignupTrend[];
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
}

export function UserGrowthChart({ data, chartType, onChartTypeChange }: UserGrowthChartProps) {
  const [animatedData, setAnimatedData] = useState<SignupTrend[]>([]);
  
  useEffect(() => {
    // Reset data for animation
    setAnimatedData([]);
    
    // Animate data points sequentially
    const timer = setTimeout(() => {
      setAnimatedData(data);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [data]);

  // Calculate growth rate
  const growthRate = data.length >= 2 
    ? ((data[data.length-1]?.count / Math.max(1, data[0]?.count) - 1) * 100).toFixed(1) 
    : '0';
  
  const lastMonthGrowth = data.length >= 2 
    ? (data[data.length-1]?.count - data[data.length-2]?.count) 
    : 0;

  return (
    <div className="bg-gray-900/70 rounded-lg p-5 border border-gray-800 shadow-lg animate-scaleUp">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium text-white animate-fadeInRight">User Growth</h3>
        <div className="flex space-x-2 animate-fadeInLeft">
          <button 
            onClick={() => onChartTypeChange('area')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${chartType === 'area' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Area
          </button>
          <button 
            onClick={() => onChartTypeChange('line')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${chartType === 'line' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Line
          </button>
          <button 
            onClick={() => onChartTypeChange('bar')}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${chartType === 'bar' ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Bar
          </button>
        </div>
      </div>
      
      <div className="flex justify-between mb-3 animate-fadeInUp">
        <div className="bg-gray-800/50 rounded-md p-2 text-center flex-1 mr-2">
          <p className="text-gray-400 text-xs mb-1">Overall Growth</p>
          <p className={`text-lg font-semibold ${Number(growthRate) > 0 ? 'text-green-400' : Number(growthRate) < 0 ? 'text-red-400' : 'text-gray-300'}`}>
            {growthRate}%
          </p>
        </div>
        
        <div className="bg-gray-800/50 rounded-md p-2 text-center flex-1">
          <p className="text-gray-400 text-xs mb-1">Last Month</p>
          <p className={`text-lg font-semibold ${lastMonthGrowth > 0 ? 'text-green-400' : lastMonthGrowth < 0 ? 'text-red-400' : 'text-gray-300'}`}>
            {lastMonthGrowth > 0 ? '+' : ''}{lastMonthGrowth}
          </p>
        </div>
      </div>
      
      <div className="h-64 animate-fadeIn">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' && (
            <AreaChart data={animatedData}>
              <defs>
                <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#999" 
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                stroke="#999" 
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <Tooltip 
                wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSignups)" 
                animationDuration={1500}
                animationBegin={300}
                animationEasing="ease-out"
                className="chart-segment animate-chartGlow"
              />
            </AreaChart>
          )}
          
          {chartType === 'line' && (
            <LineChart data={animatedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#999"
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                stroke="#999"
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <Tooltip 
                wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#1f2937' }}
                activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2, fill: '#fff' }}
                animationDuration={1500}
                animationBegin={300}
                animationEasing="ease-out"
                className="chart-segment animate-chartGlow"
              />
            </LineChart>
          )}
          
          {chartType === 'bar' && (
            <BarChart data={animatedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#999"
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <YAxis 
                stroke="#999"
                tick={{ fill: '#bbb' }}
                axisLine={{ stroke: '#666' }}
              />
              <Tooltip 
                wrapperStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.375rem' }}
                contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                itemStyle={{ color: '#fff' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff' }}
              />
              <Bar 
                dataKey="count" 
                fill="#8884d8" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
                animationBegin={300}
                animationEasing="ease-out"
                className="animate-barRise chart-segment"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
} 