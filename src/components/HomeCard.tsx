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
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 border-border/50 bg-gradient-to-br ${gradient} hover:shadow-primary/10 touch-manipulation`} onClick={onClick}>
      <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
        <div className="flex items-center justify-between">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors flex-shrink-0">
            <Icon className="h-4 w-4 md:h-6 md:w-6 text-primary" />
          </div>
          {count !== undefined && (
            <div className="bg-primary text-primary-foreground text-xs md:text-sm font-semibold px-2 py-1 rounded-full flex-shrink-0">
              {count}
            </div>
          )}
        </div>
        <CardTitle className="text-sm md:text-xl font-semibold md:font-bold group-hover:text-primary transition-colors leading-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 p-3 md:p-6 md:pt-0">
        <CardDescription className="text-xs md:text-base mb-3 md:mb-4 leading-relaxed line-clamp-2">
          {description}
        </CardDescription>
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-8 md:h-10 text-xs md:text-sm">
          <span className="truncate">Access {title}</span>
        </Button>
      </CardContent>
    </Card>
  );
}