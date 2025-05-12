import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ArrowUpRight, Users } from 'lucide-react';

export interface FallbackStatsProps {
  title: string;
  description?: string;
  showFarmers?: boolean;
  showCollectors?: boolean;
  showTraders?: boolean;
  showRetailers?: boolean;
  showConsumers?: boolean;
}

const FallbackStatsWidget: React.FC<FallbackStatsProps> = ({
  title = "User Statistics",
  description = "Statistics are currently unavailable",
  showFarmers = true,
  showCollectors = true,
  showTraders = true,
  showRetailers = true,
  showConsumers = true,
}) => {
  useEffect(() => {
    console.log('FallbackStatsWidget rendered - API data unavailable');
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">-</div>
        <div className="text-xs text-muted-foreground">Total Users</div>
        
        {showFarmers && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div className="text-xs">Farmers</div>
            </div>
            <div className="text-xs text-right font-medium">-</div>
          </div>
        )}
        
        {showCollectors && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="text-xs">Collectors</div>
            </div>
            <div className="text-xs text-right font-medium">-</div>
          </div>
        )}
        
        {showTraders && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div className="text-xs">Traders</div>
            </div>
            <div className="text-xs text-right font-medium">-</div>
          </div>
        )}
        
        {showRetailers && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <div className="text-xs">Retailers</div>
            </div>
            <div className="text-xs text-right font-medium">-</div>
          </div>
        )}
        
        {showConsumers && (
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <div className="text-xs">Consumers</div>
            </div>
            <div className="text-xs text-right font-medium">-</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FallbackStatsWidget; 