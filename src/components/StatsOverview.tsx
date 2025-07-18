import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react';

interface StatsOverviewProps {
  totalSearches: number;
  recentSearches: number;
  thisMonth: number;
  totalRVUs: number;
}

export function StatsOverview({ totalSearches, recentSearches, thisMonth, totalRVUs }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-blue-700 leading-tight">Total Searches</CardTitle>
          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-blue-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-lg md:text-2xl font-bold text-blue-900">{totalSearches.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">All time</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-green-700 leading-tight">Recent Activity</CardTitle>
          <Clock className="h-3 w-3 md:h-4 md:w-4 text-green-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-lg md:text-2xl font-bold text-green-900">{recentSearches}</div>
          <p className="text-xs text-green-600 mt-1">Last 7 days</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-purple-700 leading-tight">This Month</CardTitle>
          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-lg md:text-2xl font-bold text-purple-900">{thisMonth}</div>
          <p className="text-xs text-purple-600 mt-1">Searches</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2 p-3 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium text-amber-700 leading-tight">Total RVUs</CardTitle>
          <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-amber-600 flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-lg md:text-2xl font-bold text-amber-900">{totalRVUs.toFixed(2)}</div>
          <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800">
            Est. Value
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}