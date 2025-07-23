import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, Clock } from 'lucide-react';
import { useCommonStats } from '@/hooks/use-common-stats';

export function CommonSection() {
  const { mostUsedCodes, recentCodes, totalUniqueCodes, loading } = useCommonStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          Loading common procedures...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Common Procedures Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalUniqueCodes}</div>
              <div className="text-sm text-muted-foreground">Unique Codes Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{mostUsedCodes.length}</div>
              <div className="text-sm text-muted-foreground">Top Procedures</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recentCodes.length}</div>
              <div className="text-sm text-muted-foreground">Recent Codes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Most Used Procedures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mostUsedCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No procedures found. Start creating cases to see your most used codes!
                </div>
              ) : (
                mostUsedCodes.map((proc, index) => (
                  <div key={proc.code} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {proc.code}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {proc.count} uses
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground mt-1">{proc.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{proc.rvu.toFixed(2)} RVU</p>
                      <p className="text-xs text-muted-foreground">avg</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity. Start searching for codes or creating cases!
                </div>
              ) : (
                recentCodes.map((code, index) => (
                  <div key={`${code.code}-${index}`} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {code.code}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{code.date}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{code.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{code.rvu} RVU</p>
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