import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface HomeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  count?: number;
  gradient?: string;
}

export function HomeCard({ title, description, icon: Icon, onClick, count, gradient = "from-primary/20 to-primary/5" }: HomeCardProps) {
  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-border/50 bg-gradient-to-br ${gradient} hover:shadow-primary/10`} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {count !== undefined && (
            <div className="bg-primary text-primary-foreground text-sm font-semibold px-2 py-1 rounded-full">
              {count}
            </div>
          )}
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base mb-4">{description}</CardDescription>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          Access {title}
        </Button>
      </CardContent>
    </Card>
  );
}