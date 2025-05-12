import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { TrendingUp } from 'lucide-react';

export interface FallbackTrendChartProps {
  title: string;
  description?: string;
  period?: 'weekly' | 'monthly' | 'yearly';
}

const FallbackTrendChart: React.FC<FallbackTrendChartProps> = ({
  title = "User Signup Trend",
  description = "Trend data is currently unavailable",
  period = 'monthly',
}) => {
  // Add debug log when component renders
  useEffect(() => {
    console.log(`FallbackTrendChart rendered - API data unavailable (period: ${period})`);
  }, [period]);
  
  // Generate placeholder bars
  const generatePlaceholderBars = () => {
    const barCount = period === 'weekly' ? 12 : period === 'monthly' ? 12 : 5;
    
    return Array(barCount).fill(0).map((_, index) => (
      <div key={index} className="flex flex-col items-center">
        <div 
          className="w-7 bg-gray-200 rounded-sm" 
          style={{ 
            height: `${Math.max(15, Math.min(80, Math.random() * 60))}px`,
            opacity: 0.5 
          }}
        />
        <span className="mt-1 text-xs text-gray-400 truncate" style={{ maxWidth: '40px' }}>
          {period === 'weekly' ? `W${index+1}` : 
           period === 'monthly' ? `M${index+1}` : 
           `Y${index+1}`}
        </span>
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] flex flex-col">
          <div className="flex-1 flex items-end justify-around">
            {generatePlaceholderBars()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FallbackTrendChart; 