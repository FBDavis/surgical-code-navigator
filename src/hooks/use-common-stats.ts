import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CommonStats {
  mostUsedCodes: Array<{ code: string; description: string; count: number; rvu: number }>;
  recentCodes: Array<{ code: string; description: string; rvu: number; date: string }>;
  totalUniqueCodes: number;
  loading: boolean;
}

export function useCommonStats(): CommonStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<CommonStats>({
    mostUsedCodes: [],
    recentCodes: [],
    totalUniqueCodes: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user?.id) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchCommonStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true }));
        
        // Get all case codes for frequency analysis
        const { data: caseCodes, error } = await supabase
          .from('case_codes')
          .select('cpt_code, description, rvu_value, created_at')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching case codes:', error);
          return;
        }

        if (!caseCodes) {
          setStats(prev => ({ ...prev, loading: false }));
          return;
        }

        // Calculate most used codes
        const codeFrequency = caseCodes.reduce((acc, code) => {
          const key = code.cpt_code;
          if (!acc[key]) {
            acc[key] = { 
              code: code.cpt_code, 
              description: code.description, 
              count: 0, 
              rvu: code.rvu_value 
            };
          }
          acc[key].count++;
          return acc;
        }, {} as Record<string, { code: string; description: string; count: number; rvu: number }>);

        const mostUsedCodes = Object.values(codeFrequency)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Recent codes (last 10)
        const recentCodes = caseCodes
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
          .map(code => ({
            code: code.cpt_code,
            description: code.description,
            rvu: code.rvu_value,
            date: new Date(code.created_at).toLocaleDateString()
          }));

        // Total unique codes
        const uniqueCodes = new Set(caseCodes.map(code => code.cpt_code));
        const totalUniqueCodes = uniqueCodes.size;

        setStats({
          mostUsedCodes,
          recentCodes,
          totalUniqueCodes,
          loading: false,
        });

      } catch (error) {
        console.error('Error fetching common stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchCommonStats();
  }, [user?.id]);

  return stats;
}