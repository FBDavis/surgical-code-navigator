import { Card } from '@/components/ui/card';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: 'trending' | 'calendar' | 'dollar';
}

export const StatsCard = ({ title, value, subtitle, trend, icon }: StatsCardProps) => {
  const iconMap = {
    trending: TrendingUp,
    calendar: Calendar,
    dollar: DollarSign,
  };

  const IconComponent = icon ? iconMap[icon] : TrendingUp;

  return (
    <Card className="p-4 bg-gradient-card border-medical-accent/10 hover:shadow-card transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${
          trend === 'up' ? 'bg-success/10 text-success' :
          trend === 'down' ? 'bg-destructive/10 text-destructive' :
          'bg-primary/10 text-primary'
        }`}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};