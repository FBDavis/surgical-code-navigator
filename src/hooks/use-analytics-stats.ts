import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsStats {
  totalRVUs: number;
  totalRevenue: number;
  caseNumbers: number;
  weeklyData: Array<{ week: string; rvus: number; revenue: number; cases: number }>;
  monthlyData: Array<{ month: string; rvus: number; revenue: number; cases: number }>;
  yearlyData: Array<{ year: string; rvus: number; revenue: number; cases: number }>;
  rvuTrend: 'up' | 'down' | 'stable';
  revenueTrend: 'up' | 'down' | 'stable';
  loading: boolean;
}

export function useAnalyticsStats(): AnalyticsStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRVUs: 0,
    totalRevenue: 0,
    caseNumbers: 0,
    weeklyData: [],
    monthlyData: [],
    yearlyData: [],
    rvuTrend: 'stable',
    revenueTrend: 'stable',
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchAnalyticsStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Get all cases with their RVUs and estimated values
        const { data: cases, error } = await supabase
          .from('cases')
          .select('total_rvu, estimated_value, created_at, procedure_date')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching cases:', error);
          return;
        }

        if (!cases) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        // Calculate totals
        const totalRVUs = cases.reduce((sum, c) => sum + (c.total_rvu || 0), 0);
        const totalRevenue = cases.reduce((sum, c) => sum + (c.estimated_value || 0), 0);
        const caseNumbers = cases.length;

        // Calculate weekly data (last 12 weeks)
        const weeklyData = [];
        for (let i = 11; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          const weekCases = cases.filter(c => {
            const caseDate = new Date(c.created_at);
            return caseDate >= weekStart && caseDate <= weekEnd;
          });
          
          weeklyData.push({
            week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
            rvus: weekCases.reduce((sum, c) => sum + (c.total_rvu || 0), 0),
            revenue: weekCases.reduce((sum, c) => sum + (c.estimated_value || 0), 0),
            cases: weekCases.length
          });
        }

        // Calculate monthly data (last 12 months)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
          const monthStart = new Date();
          monthStart.setMonth(monthStart.getMonth() - i, 1);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
          
          const monthCases = cases.filter(c => {
            const caseDate = new Date(c.created_at);
            return caseDate >= monthStart && caseDate <= monthEnd;
          });
          
          monthlyData.push({
            month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            rvus: monthCases.reduce((sum, c) => sum + (c.total_rvu || 0), 0),
            revenue: monthCases.reduce((sum, c) => sum + (c.estimated_value || 0), 0),
            cases: monthCases.length
          });
        }

        // Calculate yearly data (last 3 years)
        const yearlyData = [];
        for (let i = 2; i >= 0; i--) {
          const yearStart = new Date();
          yearStart.setFullYear(yearStart.getFullYear() - i, 0, 1);
          const yearEnd = new Date(yearStart);
          yearEnd.setFullYear(yearEnd.getFullYear() + 1, 0, 0);
          
          const yearCases = cases.filter(c => {
            const caseDate = new Date(c.created_at);
            return caseDate >= yearStart && caseDate <= yearEnd;
          });
          
          yearlyData.push({
            year: yearStart.getFullYear().toString(),
            rvus: yearCases.reduce((sum, c) => sum + (c.total_rvu || 0), 0),
            revenue: yearCases.reduce((sum, c) => sum + (c.estimated_value || 0), 0),
            cases: yearCases.length
          });
        }

        // Calculate trends (compare last 4 weeks vs previous 4 weeks)
        const lastMonth = weeklyData.slice(-4);
        const previousMonth = weeklyData.slice(-8, -4);
        
        const lastMonthRVUs = lastMonth.reduce((sum, w) => sum + w.rvus, 0);
        const previousMonthRVUs = previousMonth.reduce((sum, w) => sum + w.rvus, 0);
        const lastMonthRevenue = lastMonth.reduce((sum, w) => sum + w.revenue, 0);
        const previousMonthRevenue = previousMonth.reduce((sum, w) => sum + w.revenue, 0);

        const rvuTrend = lastMonthRVUs > previousMonthRVUs ? 'up' : 
                        lastMonthRVUs < previousMonthRVUs ? 'down' : 'stable';
        const revenueTrend = lastMonthRevenue > previousMonthRevenue ? 'up' : 
                            lastMonthRevenue < previousMonthRevenue ? 'down' : 'stable';

        setStats({
          totalRVUs,
          totalRevenue,
          caseNumbers,
          weeklyData,
          monthlyData,
          yearlyData,
          rvuTrend,
          revenueTrend,
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching analytics stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAnalyticsStats();
  }, [user?.id]);

  return stats;
}