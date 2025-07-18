import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Clock, 
  DollarSign, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Zap,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InsightsDashboardProps {
  onStatsUpdate?: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ onStatsUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');
  const [insights, setInsights] = useState({
    productivity: {
      trend: 'up',
      change: 15.2,
      score: 87,
      recommendations: []
    },
    efficiency: {
      trend: 'up',
      change: 8.7,
      score: 92,
      recommendations: []
    },
    revenue: {
      trend: 'down',
      change: -3.2,
      total: 125000,
      projected: 135000
    },
    predictions: [],
    benchmarks: {},
    alerts: []
  });
  
  const [performanceData, setPerformanceData] = useState({
    weeklyRVU: [],
    caseVolume: [],
    specialtyBreakdown: {},
    efficiencyScores: [],
    timeAnalytics: {}
  });

  useEffect(() => {
    if (user) {
      loadInsightsData();
    }
  }, [user, timeframe]);

  const loadInsightsData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(timeframe.replace('d', '')));

      // Load user cases and calculate metrics
      const { data: cases } = await supabase
        .from('cases')
        .select(`
          *,
          case_codes (
            cpt_code,
            description,
            rvu,
            category,
            modifiers
          )
        `)
        .eq('user_id', user.id)
        .gte('procedure_date', startDate.toISOString().split('T')[0])
        .order('procedure_date', { ascending: true });

      const { data: weeklyAssessments } = await supabase
        .from('weekly_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(8);

      // Generate AI insights
      await generateAIInsights(cases || [], weeklyAssessments || []);
      
      // Process performance data
      processPerformanceData(cases || []);
      
    } catch (error) {
      console.error('Error loading insights data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIInsights = async (cases: any[], assessments: any[]) => {
    try {
      // Mock AI-powered insights generation
      const totalRVU = cases.reduce((sum, case_item) => {
        return sum + (case_item.case_codes?.reduce((codeSum: number, code: any) => 
          codeSum + (parseFloat(code.rvu) || 0), 0) || 0);
      }, 0);

      const totalCases = cases.length;
      const avgRVUPerCase = totalCases > 0 ? totalRVU / totalCases : 0;

      // Simulate AI predictions and recommendations
      const mockInsights = {
        productivity: {
          trend: totalRVU > 500 ? 'up' : 'down',
          change: Math.random() * 20 - 10,
          score: Math.min(100, Math.max(0, 60 + (avgRVUPerCase * 2))),
          recommendations: [
            'Consider scheduling more high-RVU procedures in the morning',
            'Your efficiency peaks on Tuesdays - optimize scheduling',
            'Focus on minimally invasive techniques to improve outcomes'
          ]
        },
        efficiency: {
          trend: 'up',
          change: Math.random() * 15,
          score: Math.min(100, Math.max(0, 70 + Math.random() * 30)),
          recommendations: [
            'Reduce case preparation time by 12 minutes on average',
            'Consider batching similar procedures for better flow'
          ]
        },
        revenue: {
          trend: totalRVU > 600 ? 'up' : 'down',
          change: Math.random() * 20 - 10,
          total: totalRVU * 65, // Assuming $65 per RVU
          projected: totalRVU * 65 * 1.15
        },
        predictions: [
          {
            type: 'revenue',
            title: 'Revenue Forecast',
            description: 'Expected to reach $145K this quarter based on current trends',
            confidence: 87,
            timeframe: '90 days'
          },
          {
            type: 'workload',
            title: 'Workload Optimization',
            description: 'Suggest reducing Friday case load by 20% for better work-life balance',
            confidence: 73,
            timeframe: 'ongoing'
          }
        ],
        benchmarks: {
          rvuPerDay: { value: avgRVUPerCase, percentile: 78 },
          caseVolume: { value: totalCases, percentile: 65 },
          efficiency: { value: 92, percentile: 88 }
        },
        alerts: [
          {
            type: 'opportunity',
            title: 'High-Value Case Opportunity',
            description: 'Consider adding more complex spine procedures to increase RVU',
            priority: 'medium'
          },
          {
            type: 'risk',
            title: 'Workload Alert',
            description: 'Case volume 25% above average - monitor for burnout',
            priority: 'high'
          }
        ]
      };

      setInsights(mockInsights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    }
  };

  const processPerformanceData = (cases: any[]) => {
    // Process data for charts and analytics
    const weeklyData = cases.reduce((acc: any, case_item) => {
      const week = case_item.procedure_date;
      const rvu = case_item.case_codes?.reduce((sum: number, code: any) => 
        sum + (parseFloat(code.rvu) || 0), 0) || 0;
      
      acc[week] = (acc[week] || 0) + rvu;
      return acc;
    }, {});

    const specialtyData = cases.reduce((acc: any, case_item) => {
      case_item.case_codes?.forEach((code: any) => {
        const category = code.category || 'Other';
        acc[category] = (acc[category] || 0) + 1;
      });
      return acc;
    }, {});

    setPerformanceData({
      weeklyRVU: Object.entries(weeklyData).map(([date, rvu]) => ({ date, rvu })),
      caseVolume: cases.map(c => ({ date: c.procedure_date, cases: 1 })),
      specialtyBreakdown: specialtyData,
      efficiencyScores: [85, 92, 88, 95, 90, 87, 94],
      timeAnalytics: {
        avgCaseTime: '2.3 hours',
        peakHours: '8-11 AM',
        bestDay: 'Tuesday'
      }
    });
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon, subtitle }: any) => (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      <CardContent className="p-6 relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Icon className="h-8 w-8 text-primary" />
            {change !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const InsightCard = ({ insight }: any) => (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            insight.type === 'opportunity' ? 'bg-green-100 text-green-600' : 
            insight.type === 'risk' ? 'bg-red-100 text-red-600' : 
            'bg-blue-100 text-blue-600'
          }`}>
            {insight.type === 'opportunity' ? <Lightbulb className="h-4 w-4" /> : 
             insight.type === 'risk' ? <AlertTriangle className="h-4 w-4" /> : 
             <Brain className="h-4 w-4" />}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{insight.title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
            <Badge 
              variant={insight.priority === 'high' ? 'destructive' : 'outline'} 
              className="mt-2 text-xs"
            >
              {insight.priority} priority
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
          <p className="text-muted-foreground">
            Smart analytics and predictions for your surgical practice
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={loadInsightsData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Brain className="h-4 w-4 mr-2" />
            Refresh AI
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Productivity Score"
          value={insights.productivity.score}
          change={insights.productivity.change}
          trend={insights.productivity.trend}
          icon={TrendingUp}
          subtitle="AI-calculated efficiency"
        />
        <MetricCard
          title="Revenue Impact"
          value={`$${insights.revenue.total?.toLocaleString()}`}
          change={insights.revenue.change}
          trend={insights.revenue.trend}
          icon={DollarSign}
          subtitle={`${timeframe} period`}
        />
        <MetricCard
          title="Efficiency Rating"
          value={insights.efficiency.score}
          change={insights.efficiency.change}
          trend={insights.efficiency.trend}
          icon={Zap}
          subtitle="vs peer average"
        />
        <MetricCard
          title="Case Volume"
          value={performanceData.caseVolume.length}
          icon={BarChart3}
          subtitle="total procedures"
        />
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Smart Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.productivity.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Smart Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.alerts.map((alert, index) => (
                  <InsightCard key={index} insight={alert} />
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {insights.predictions.map((prediction, index) => (
              <Card key={index} className="border-2 border-dashed border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{prediction.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {prediction.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant="outline">
                          {prediction.confidence}% confidence
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {prediction.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(insights.benchmarks).map(([key, benchmark]: [string, any]) => (
              <Card key={key}>
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {benchmark.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {benchmark.percentile}th percentile
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-blue-500 h-2 rounded-full"
                      style={{ width: `${benchmark.percentile}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Detailed analytics of your surgical performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-4" />
                  <p>Interactive charts will be displayed here</p>
                  <p className="text-sm">Showing RVU trends, case volume, and efficiency metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};