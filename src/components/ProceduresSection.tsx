import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, TrendingUp, TrendingDown, BarChart3, DollarSign } from 'lucide-react';
import { useProceduresStats } from '@/hooks/use-procedures-stats';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export function ProceduresSection() {
  const { 
    totalProcedureCount, 
    mostCommonProcedures, 
    mostProfitableProcedures, 
    leastProfitableProcedures, 
    proceduresByCategory, 
    loading 
  } = useProceduresStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading procedures data...
        </div>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Procedure Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{totalProcedureCount}</div>
              <div className="text-sm text-muted-foreground">Total Procedures</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{mostCommonProcedures.length}</div>
              <div className="text-sm text-muted-foreground">Most Common</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{mostProfitableProcedures.length}</div>
              <div className="text-sm text-muted-foreground">Most Profitable</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{leastProfitableProcedures.length}</div>
              <div className="text-sm text-muted-foreground">Least Profitable</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procedures by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Procedures by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proceduresByCategory.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ category, count }) => `${category}: ${count}`}
                  >
                    {proceduresByCategory.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Category Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={proceduresByCategory.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Common Procedures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Most Common Procedures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mostCommonProcedures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No procedures found. Start creating cases!
                </div>
              ) : (
                mostCommonProcedures.map((proc, index) => (
                  <div key={proc.code} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {proc.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {proc.count}x
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 truncate">{proc.description}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-medium text-primary">{proc.rvu.toFixed(1)} RVU</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Profitable Procedures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Most Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {mostProfitableProcedures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No profitable procedures found.
                </div>
              ) : (
                mostProfitableProcedures.map((proc, index) => (
                  <div key={proc.code} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {proc.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {proc.count}x
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 truncate">{proc.description}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-medium text-green-600">${proc.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{proc.avgRvu.toFixed(1)} RVU avg</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Least Profitable Procedures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Least Profitable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leastProfitableProcedures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for least profitable procedures.
                </div>
              ) : (
                leastProfitableProcedures.map((proc, index) => (
                  <div key={proc.code} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {proc.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {proc.count}x
                        </Badge>
                      </div>
                      <p className="text-xs text-foreground mt-1 truncate">{proc.description}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-xs font-medium text-red-600">${proc.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{proc.avgRvu.toFixed(1)} RVU avg</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}