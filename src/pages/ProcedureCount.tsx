import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Calendar, TrendingUp, Filter, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProcedureData {
  id: string;
  case_name: string;
  procedure_date: string;
  total_rvu: number;
  created_at: string;
  codes_count: number;
  primary_code?: string;
}

export const ProcedureCount = () => {
  const { user } = useAuth();
  const [procedures, setProcedures] = useState<ProcedureData[]>([]);
  const [filteredProcedures, setFilteredProcedures] = useState<ProcedureData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'this-month' | 'last-month' | 'this-year'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'rvu' | 'name'>('date');

  useEffect(() => {
    if (user) {
      fetchProcedures();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [procedures, filter, sortBy]);

  const fetchProcedures = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data: cases, error } = await supabase
        .from('cases')
        .select(`
          id,
          case_name,
          procedure_date,
          total_rvu,
          created_at,
          case_codes!inner(
            cpt_code,
            is_primary
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedProcedures = cases?.map(caseItem => {
        const codes = (caseItem.case_codes as any[]) || [];
        const primaryCode = codes.find(code => code.is_primary)?.cpt_code || codes[0]?.cpt_code;
        
        return {
          id: caseItem.id,
          case_name: caseItem.case_name,
          procedure_date: caseItem.procedure_date || caseItem.created_at,
          total_rvu: caseItem.total_rvu || 0,
          created_at: caseItem.created_at,
          codes_count: codes.length,
          primary_code: primaryCode
        };
      }) || [];

      setProcedures(processedProcedures);
    } catch (error) {
      console.error('Error fetching procedures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...procedures];
    const now = new Date();

    // Apply date filter
    switch (filter) {
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(proc => new Date(proc.created_at) >= startOfMonth);
        break;
      case 'last-month':
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        filtered = filtered.filter(proc => {
          const date = new Date(proc.created_at);
          return date >= startOfLastMonth && date <= endOfLastMonth;
        });
        break;
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(proc => new Date(proc.created_at) >= startOfYear);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rvu':
        filtered.sort((a, b) => b.total_rvu - a.total_rvu);
        break;
      case 'name':
        filtered.sort((a, b) => a.case_name.localeCompare(b.case_name));
        break;
    }

    setFilteredProcedures(filtered);
  };

  const exportData = () => {
    const csvContent = [
      ['Case Name', 'Procedure Date', 'Primary Code', 'Codes Count', 'Total RVU', 'Created Date'],
      ...filteredProcedures.map(proc => [
        proc.case_name,
        proc.procedure_date ? new Date(proc.procedure_date).toLocaleDateString() : '',
        proc.primary_code || '',
        proc.codes_count.toString(),
        proc.total_rvu.toString(),
        new Date(proc.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procedures-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const totalCases = filteredProcedures.length;
    const totalRVUs = filteredProcedures.reduce((sum, proc) => sum + proc.total_rvu, 0);
    const avgRVU = totalCases > 0 ? totalRVUs / totalCases : 0;
    
    return { totalCases, totalRVUs, avgRVU };
  };

  const stats = getTotalStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Procedure Count</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Procedure Count</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="rvu">RVU</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={exportData} disabled={filteredProcedures.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Procedures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              {filter === 'all' ? 'All time' : filter.replace('-', ' ')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RVUs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRVUs.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue units</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average RVU</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRVU.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per procedure</p>
          </CardContent>
        </Card>
      </div>

      {/* Procedures List */}
      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No procedures found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'Start creating cases to see your procedures here.'
                : `No procedures found for ${filter.replace('-', ' ')}.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredProcedures.map((procedure) => (
            <Card key={procedure.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{procedure.case_name}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {procedure.primary_code && (
                        <Badge variant="default" className="font-mono">
                          {procedure.primary_code}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {procedure.codes_count} code{procedure.codes_count !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="outline">
                        {procedure.total_rvu.toFixed(2)} RVU
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>
                      {procedure.procedure_date 
                        ? new Date(procedure.procedure_date).toLocaleDateString()
                        : 'No date set'
                      }
                    </div>
                    <div className="text-xs">
                      Created: {new Date(procedure.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};