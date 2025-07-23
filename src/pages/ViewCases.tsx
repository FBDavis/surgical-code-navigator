import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CommonSection } from '@/components/CommonSection';
import { AnalyticsSection } from '@/components/AnalyticsSection';
import { ProceduresSection } from '@/components/ProceduresSection';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Clock, 
  DollarSign, 
  Calculator,
  Search,
  Trash2,
  Edit,
  Eye,
  Filter,
  History,
  BarChart3,
  Activity
} from 'lucide-react';

interface Case {
  id: string;
  case_name: string;
  patient_mrn?: string;
  procedure_date?: string;
  procedure_description?: string;
  notes?: string;
  total_rvu: number;
  estimated_value: number;
  status: string;
  created_at: string;
  updated_at: string;
  case_codes?: CaseCode[];
}

interface CaseCode {
  id: string;
  cpt_code: string;
  description: string;
  rvu: number;
  category: string;
  modifiers?: string[];
  is_primary: boolean;
  position: number;
}

export const ViewCases = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab === 'common' || tab === 'analytics' || tab === 'procedures' ? tab : 'cases';
  });

  const fetchCases = async (filter: 'today' | 'week' | 'month' | 'all' | 'custom' = 'all', customDate?: Date) => {
    console.log('ViewCases: fetchCases called', { user: !!user, filter, customDate });
    if (!user) {
      console.log('ViewCases: No user, returning early');
      return;
    }
    
    console.log('ViewCases: Setting loading true');
    setLoading(true);
    try {
      let query = supabase
        .from('cases')
        .select(`
          *,
          case_codes (
            id,
            cpt_code,
            description,
            rvu,
            category,
            modifiers,
            is_primary,
            position
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply date filters
      const now = new Date();
      let startDate: Date;

      switch (filter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query = query.gte('created_at', startDate.toISOString());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          query = query.gte('created_at', startDate.toISOString());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          query = query.gte('created_at', startDate.toISOString());
          break;
        case 'custom':
          if (customDate) {
            startDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
            const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
            query = query
              .gte('created_at', startDate.toISOString())
              .lt('created_at', endDate.toISOString());
          }
          break;
      }

      console.log('ViewCases: Executing database query...');
      const { data, error } = await query;

      console.log('ViewCases: Query result', { data: data?.length || 0, error });
      if (error) throw error;

      console.log('ViewCases: Setting cases data');
      setCases(data || []);
    } catch (error) {
      console.error('ViewCases: Error fetching cases:', error);
      toast({
        title: "Error loading cases",
        description: "Unable to load your cases. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('ViewCases: Setting loading false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('ViewCases: useEffect triggered', { user: !!user });
    fetchCases();
  }, [user]);

  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return;

    try {
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setCases(cases.filter(c => c.id !== caseId));
      toast({
        title: "Case deleted",
        description: "The case has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        title: "Error deleting case",
        description: "Unable to delete the case. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_.case_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.procedure_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.patient_mrn?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRVUs = filteredCases.reduce((sum, case_) => sum + case_.total_rvu, 0);
  const totalValue = filteredCases.reduce((sum, case_) => sum + case_.estimated_value, 0);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Please sign in to view your cases.
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderCasesTab = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{filteredCases.length}</div>
            <div className="text-sm text-muted-foreground">Total Cases</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Calculator className="w-5 h-5" />
              {totalRVUs.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Total RVUs</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold flex items-center justify-center gap-1 text-green-600">
              <DollarSign className="w-5 h-5" />
              {totalValue.toFixed(0)}
            </div>
            <div className="text-sm text-muted-foreground">Estimated Value</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <Label htmlFor="timeFilter">Time Period</Label>
                <Select 
                  value={timeFilter} 
                  onValueChange={(value: 'all' | 'today' | 'week' | 'month') => {
                    setTimeFilter(value);
                    setShowCustomDate(false);
                    fetchCases(value);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant={showCustomDate ? "default" : "outline"}
                  onClick={() => {
                    setShowCustomDate(!showCustomDate);
                    if (!showCustomDate) {
                      setTimeFilter('all');
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Custom Date
                </Button>
              </div>
            </div>

            {showCustomDate && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <Label className="text-sm font-medium mb-2 block">Select Custom Date</Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange ? format(dateRange, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange}
                      onSelect={(date) => {
                        setDateRange(date);
                        setShowCalendar(false);
                        if (date) {
                          fetchCases('custom', date);
                        }
                      }}
                      initialFocus
                      className="p-3"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Cases</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by case name, description, or MRN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cases found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCases.map((case_) => (
                <Card key={case_.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{case_.case_name}</h3>
                          <Badge variant={case_.status === 'active' ? 'default' : 'secondary'}>
                            {case_.status}
                          </Badge>
                          {case_.patient_mrn && (
                            <Badge variant="outline">MRN: {case_.patient_mrn}</Badge>
                          )}
                        </div>
                        
                        {case_.procedure_description && (
                          <p className="text-sm text-muted-foreground">
                            {case_.procedure_description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(case_.created_at), 'MMM dd, yyyy')}
                          </div>
                          {case_.procedure_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              Procedure: {format(new Date(case_.procedure_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>

                        {case_.case_codes && case_.case_codes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {case_.case_codes.map((code) => (
                              <Badge key={code.id} variant="outline" className="text-xs">
                                {code.cpt_code} ({code.rvu} RVU)
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">{case_.total_rvu.toFixed(1)} RVU</div>
                        <div className="text-sm text-green-600 font-medium">
                          ${case_.estimated_value.toFixed(2)}
                        </div>
                        
                        <div className="flex gap-1 mt-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCase(case_.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('Tab changed to:', value);
        setActiveTab(value);
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cases">
            <FileText className="w-4 h-4 mr-2" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="common">
            <History className="w-4 h-4 mr-2" />
            Common
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="procedures">
            <Activity className="w-4 h-4 mr-2" />
            Procedures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-6">
          {renderCasesTab()}
        </TabsContent>

        <TabsContent value="common" className="mt-6">
          <CommonSection />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsSection />
        </TabsContent>

        <TabsContent value="procedures" className="mt-6">
          <ProceduresSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};