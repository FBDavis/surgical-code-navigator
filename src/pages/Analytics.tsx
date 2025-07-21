import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, Calendar, DollarSign, FileText, Clock } from 'lucide-react';
import { StatsOverview } from '@/components/StatsOverview';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  totalCases: number;
  totalRVUs: number;
  thisMonthCases: number;
  avgRVUPerCase: number;
  monthlyData: Array<{ month: string; cases: number; rvus: number }>;
  topSpecialties: Array<{ specialty: string; count: number; rvus: number }>;
  recentActivity: Array<{ date: string; cases: number }>;
}

export const Analytics = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalCases: 0,
    totalRVUs: 0,
    thisMonthCases: 0,
    avgRVUPerCase: 0,
    monthlyData: [],
    topSpecialties: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch all cases with codes
      const { data: cases, error: casesError } = await supabase
        .from('cases')
        .select(`
          id,
          case_name,
          total_rvu,
          created_at,
          case_codes(
            cpt_code,
            description,
            rvu,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Calculate monthly data
      const monthlyStats: { [key: string]: { cases: number; rvus: number } } = {};
      const now = new Date();
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlyStats[monthKey] = { cases: 0, rvus: 0 };
      }

      // Process cases data
      const specialtyStats: { [key: string]: { count: number; rvus: number } } = {};
      const recentActivityMap: { [key: string]: number } = {};
      let totalRVUs = 0;
      let thisMonthCases = 0;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      cases?.forEach(caseItem => {
        const caseDate = new Date(caseItem.created_at);
        const monthKey = caseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const dayKey = caseDate.toLocaleDateString();
        
        // Monthly stats
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].cases++;
          monthlyStats[monthKey].rvus += caseItem.total_rvu || 0;
        }

        // This month cases
        if (caseDate >= startOfMonth) {
          thisMonthCases++;
        }

        // Total RVUs
        totalRVUs += caseItem.total_rvu || 0;

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (caseDate >= thirtyDaysAgo) {
          recentActivityMap[dayKey] = (recentActivityMap[dayKey] || 0) + 1;
        }

        // Specialty stats from codes
        caseItem.case_codes?.forEach(code => {
          const specialty = code.category || 'General';
          if (!specialtyStats[specialty]) {
            specialtyStats[specialty] = { count: 0, rvus: 0 };
          }
          specialtyStats[specialty].count++;
          specialtyStats[specialty].rvus += code.rvu || 0;
        });
      });

      // Convert to arrays
      const monthlyData = Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        cases: data.cases,
        rvus: Number(data.rvus.toFixed(2))
      }));

      const topSpecialties = Object.entries(specialtyStats)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 5)
        .map(([specialty, data]) => ({
          specialty,
          count: data.count,
          rvus: Number(data.rvus.toFixed(2))
        }));

      const recentActivity = Object.entries(recentActivityMap)
        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
        .slice(0, 7)
        .map(([date, cases]) => ({ date, cases }));

      setAnalyticsData({
        totalCases: cases?.length || 0,
        totalRVUs: Number(totalRVUs.toFixed(2)),
        thisMonthCases,
        avgRVUPerCase: cases?.length ? Number((totalRVUs / cases.length).toFixed(2)) : 0,
        monthlyData,
        topSpecialties,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <StatsOverview 
        totalSearches={analyticsData.totalCases}
        recentSearches={analyticsData.recentActivity.length}
        thisMonth={analyticsData.thisMonthCases}
        totalRVUs={analyticsData.totalRVUs}
      />

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg RVU/Case</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgRVUPerCase}</div>
            <p className="text-xs text-muted-foreground">Per procedure</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Case Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="cases" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* RVU Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Monthly RVU Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rvus" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Specialties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Top Procedure Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analyticsData.topSpecialties.map((specialty, index) => (
              <div key={specialty.specialty} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <span className="font-medium">{specialty.specialty}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{specialty.count} procedures</span>
                  <span>{specialty.rvus} RVUs</span>
                </div>
              </div>
            ))}
            {analyticsData.topSpecialties.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No procedure data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analyticsData.recentActivity.map((activity) => (
              <div key={activity.date} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm">{activity.date}</span>
                <Badge variant="secondary">{activity.cases} case{activity.cases !== 1 ? 's' : ''}</Badge>
              </div>
            ))}
            {analyticsData.recentActivity.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};