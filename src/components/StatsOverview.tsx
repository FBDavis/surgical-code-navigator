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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Total Searches</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{totalSearches.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">All time</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Recent Activity</CardTitle>
          <Clock className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">{recentSearches}</div>
          <p className="text-xs text-green-600 mt-1">Last 7 days</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{thisMonth}</div>
          <p className="text-xs text-purple-600 mt-1">Searches this month</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-700">Total RVUs</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-900">{totalRVUs.toFixed(2)}</div>
          <Badge variant="secondary" className="mt-1 text-xs bg-amber-100 text-amber-800">
            Estimated Value
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}