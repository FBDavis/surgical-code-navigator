import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalSearches: number;
  recentSearches: number;
  thisMonth: number;
  totalRVUs: number;
  commonProcedures: number;
  recentCodes: Array<{ code: string; description: string; rvu: number; date: string }>;
  topCodes: Array<{ code: string; count: number; rvu: number }>;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSearches: 0,
    recentSearches: 0,
    thisMonth: 0,
    totalRVUs: 0,
    commonProcedures: 0,
    recentCodes: [],
    topCodes: [],
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchDashboardStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Get all cases for the user
        const { data: cases, error: casesError } = await supabase
          .from('cases')
          .select(`
            id,
            case_name,
            procedure_date,
            total_rvu,
            estimated_value,
            created_at,
            case_codes (
              cpt_code,
              description,
              rvu,
              is_primary,
              created_at
            )
          `)
          .eq('user_id', user.id);

        if (casesError) {
          console.error('Error fetching cases:', casesError);
          return;
        }

        if (!cases) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        // Calculate stats
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Total searches (total case codes across all cases)
        const allCodes = cases.flatMap(c => c.case_codes || []);
        const totalSearches = allCodes.length;

        // Recent searches (codes added in last 7 days)
        const recentSearches = allCodes.filter(code => 
          new Date(code.created_at) >= lastWeekStart
        ).length;

        // This month searches
        const thisMonth = allCodes.filter(code => 
          new Date(code.created_at) >= thisMonthStart
        ).length;

        // Total RVUs
        const totalRVUs = cases.reduce((sum, c) => sum + (c.total_rvu || 0), 0);

        // Recent codes (last 5 codes added)
        const recentCodes = allCodes
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
          .map(code => ({
            code: code.cpt_code,
            description: code.description,
            rvu: code.rvu,
            date: new Date(code.created_at).toLocaleDateString()
          }));

        // Top codes (most frequently used)
        const codeFrequency = allCodes.reduce((acc, code) => {
          const key = code.cpt_code;
          if (!acc[key]) {
            acc[key] = { count: 0, rvu: code.rvu, code: code.cpt_code };
          }
          acc[key].count++;
          return acc;
        }, {} as Record<string, { count: number; rvu: number; code: string }>);

        const topCodes = Object.values(codeFrequency)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Common procedures count (unique CPT codes used)
        const uniqueCodes = new Set(allCodes.map(code => code.cpt_code));
        const commonProcedures = uniqueCodes.size;

        setStats({
          totalSearches,
          recentSearches,
          thisMonth,
          totalRVUs,
          commonProcedures,
          recentCodes,
          topCodes,
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardStats();
  }, [user?.id]);

  return stats;
}