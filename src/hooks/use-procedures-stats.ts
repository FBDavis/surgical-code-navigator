import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProceduresStats {
  totalProcedureCount: number;
  mostCommonProcedures: Array<{ code: string; description: string; count: number; rvu: number }>;
  mostProfitableProcedures: Array<{ code: string; description: string; totalRevenue: number; avgRvu: number; count: number }>;
  leastProfitableProcedures: Array<{ code: string; description: string; totalRevenue: number; avgRvu: number; count: number }>;
  proceduresByCategory: Array<{ category: string; count: number; totalRvu: number }>;
  loading: boolean;
}

export function useProceduresStats(): ProceduresStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProceduresStats>({
    totalProcedureCount: 0,
    mostCommonProcedures: [],
    mostProfitableProcedures: [],
    leastProfitableProcedures: [],
    proceduresByCategory: [],
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchProceduresStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Get all case codes with RVU rate for calculations
        const { data: caseCodes, error: caseCodesError } = await supabase
          .from('case_codes')
          .select('cpt_code, description, rvu_value, category')
          .eq('user_id', user.id);

        // Get user's RVU rate
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('default_rvu_rate')
          .eq('user_id', user.id)
          .single();

        if (caseCodesError) {
          console.error('Error fetching case codes:', caseCodesError);
          return;
        }

        if (!caseCodes) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        const rvuRate = profile?.default_rvu_rate || 65;

        // Total procedure count
        const totalProcedureCount = caseCodes.length;

        // Group procedures by code
        const procedureGroups = caseCodes.reduce((acc, code) => {
          const key = code.cpt_code;
          if (!acc[key]) {
            acc[key] = {
              code: code.cpt_code,
              description: code.description,
              category: code.category || 'Other',
              count: 0,
              totalRvu: 0,
              instances: []
            };
          }
          acc[key].count++;
          acc[key].totalRvu += code.rvu;
          acc[key].instances.push(code);
          return acc;
        }, {} as Record<string, any>);

        // Most common procedures (by frequency)
        const mostCommonProcedures = Object.values(procedureGroups)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 10)
          .map((proc: any) => ({
            code: proc.code,
            description: proc.description,
            count: proc.count,
            rvu: proc.totalRvu / proc.count // average RVU
          }));

        // Most profitable procedures (by total revenue)
        const mostProfitableProcedures = Object.values(procedureGroups)
          .map((proc: any) => ({
            code: proc.code,
            description: proc.description,
            totalRevenue: proc.totalRvu * rvuRate,
            avgRvu: proc.totalRvu / proc.count,
            count: proc.count
          }))
          .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        // Least profitable procedures (by total revenue, excluding single instances)
        const leastProfitableProcedures = Object.values(procedureGroups)
          .filter((proc: any) => proc.count > 1) // Only include procedures done more than once
          .map((proc: any) => ({
            code: proc.code,
            description: proc.description,
            totalRevenue: proc.totalRvu * rvuRate,
            avgRvu: proc.totalRvu / proc.count,
            count: proc.count
          }))
          .sort((a: any, b: any) => a.totalRevenue - b.totalRevenue)
          .slice(0, 10);

        // Procedures by category
        const categoryGroups = Object.values(procedureGroups).reduce((acc, proc: any) => {
          const category = proc.category;
          if (!acc[category]) {
            acc[category] = { category, count: 0, totalRvu: 0 };
          }
          acc[category].count += proc.count;
          acc[category].totalRvu += proc.totalRvu;
          return acc;
        }, {} as Record<string, any>);

        const proceduresByCategory = Object.values(categoryGroups)
          .sort((a: any, b: any) => b.count - a.count) as Array<{ category: string; count: number; totalRvu: number }>;

        setStats({
          totalProcedureCount,
          mostCommonProcedures,
          mostProfitableProcedures,
          leastProfitableProcedures,
          proceduresByCategory,
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching procedures stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchProceduresStats();
  }, [user?.id]);

  return stats;
}