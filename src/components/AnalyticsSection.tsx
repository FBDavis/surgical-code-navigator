import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, FileText, Calendar } from 'lucide-react';
import { useAnalyticsStats } from '@/hooks/use-analytics-stats';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

type TimePeriod = 'weekly' | 'monthly' | 'yearly';

export function AnalyticsSection() {
  const { 
    totalRVUs, 
    totalRevenue, 
    caseNumbers, 
    weeklyData, 
    monthlyData, 
    yearlyData, 
    rvuTrend, 
    revenueTrend, 
    loading 
  } = useAnalyticsStats();
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('monthly');

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    );
  }

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case 'weekly': return weeklyData;
      case 'monthly': return monthlyData;
      case 'yearly': return yearlyData;
      default: return monthlyData;
    }
  };

  const data = getCurrentData();
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RVUs</p>
                <p className="text-2xl font-bold">{totalRVUs.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1">
                {rvuTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : rvuTrend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-1">
                {revenueTrend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : revenueTrend === 'down' ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null}
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{caseNumbers}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg RVU/Case</p>
                <p className="text-2xl font-bold">{caseNumbers > 0 ? (totalRVUs / caseNumbers).toFixed(2) : '0'}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Productivity Trends</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={selectedPeriod === 'yearly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('yearly')}
              >
                Yearly
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={selectedPeriod === 'weekly' ? 'week' : selectedPeriod === 'monthly' ? 'month' : 'year'} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rvus" stroke="hsl(var(--primary))" strokeWidth={2} name="RVUs" />
                <Line type="monotone" dataKey="cases" stroke="hsl(var(--secondary))" strokeWidth={2} name="Cases" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={selectedPeriod === 'weekly' ? 'week' : selectedPeriod === 'monthly' ? 'month' : 'year'} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* RVU Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>RVU Distribution ({selectedPeriod})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.slice(-4)} // Show last 4 periods
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="rvus"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.slice(-4).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}