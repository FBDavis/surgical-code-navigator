import { StatsCard } from '@/components/StatsCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Clock, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const recentCodes = [
    { code: '47562', description: 'Laparoscopic cholecystectomy', rvu: 10.61, date: '2024-01-10' },
    { code: '44970', description: 'Laparoscopic appendectomy', rvu: 8.56, date: '2024-01-09' },
    { code: '49650', description: 'Laparoscopic hernia repair', rvu: 12.33, date: '2024-01-08' },
  ];

  const topCodes = [
    { code: '47562', count: 15, rvu: 10.61 },
    { code: '49650', count: 12, rvu: 12.33 },
    { code: '44970', count: 8, rvu: 8.56 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <Button variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          This Month
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total RVUs"
          value="342.8"
          subtitle="This month"
          trend="up"
          icon="trending"
        />
        <StatsCard
          title="Cases Coded"
          value="28"
          subtitle="This month"
          trend="up"
          icon="calendar"
        />
        <StatsCard
          title="Estimated Value"
          value="$18,642"
          subtitle="Based on compensation rate"
          trend="up"
          icon="dollar"
        />
      </div>

      {/* Recent Activity */}
      <Card className="p-6 bg-gradient-card border-medical-accent/10">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {recentCodes.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-medical-accent/10 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-primary">{item.code}</span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
                <p className="text-sm text-card-foreground mt-1">{item.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">{item.rvu} RVU</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Procedures */}
      <Card className="p-6 bg-gradient-card border-medical-accent/10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">Most Common Procedures</h2>
        </div>
        <div className="space-y-3">
          {topCodes.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="font-mono text-sm font-medium text-primary">{item.code}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-card-foreground">{item.count} times</p>
                <p className="text-xs text-muted-foreground">{item.rvu} RVU each</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};