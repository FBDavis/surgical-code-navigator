import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign } from 'lucide-react';

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
  whenNeeded?: string;
}

interface CPTCodeCardProps {
  cptCode: CPTCode;
  onAdd: (code: CPTCode) => void;
  compensationRate?: number;
}

export const CPTCodeCard = ({ cptCode, onAdd, compensationRate = 0 }: CPTCodeCardProps) => {
  const calculatedValue = compensationRate > 0 ? (cptCode.rvu * compensationRate).toFixed(2) : null;

  return (
    <Card className="p-3 md:p-4 hover:shadow-medical transition-all duration-200 bg-gradient-card border-medical-accent/10 touch-manipulation">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-primary border-primary/20 text-xs md:text-sm">
              {cptCode.code}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {cptCode.category}
            </Badge>
          </div>
          
          <p className="text-sm text-card-foreground leading-relaxed">
            {cptCode.description}
          </p>
          
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">RVU:</span>
              <span className="font-semibold text-primary text-sm">{cptCode.rvu}</span>
            </div>
            
            {calculatedValue && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-success" />
                <span className="font-semibold text-success text-sm">${calculatedValue}</span>
              </div>
            )}
          </div>
          
          {cptCode.modifiers && cptCode.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs text-muted-foreground">Modifiers:</span>
              {cptCode.modifiers.map((modifier, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {modifier}
                </Badge>
              ))}
            </div>
          )}
          
          {cptCode.whenNeeded && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 rounded-lg p-2 md:p-3 mt-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs font-medium text-blue-600">When to use:</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                {cptCode.whenNeeded}
              </p>
            </div>
          )}
        </div>
        
        <Button
          size="sm"
          onClick={() => onAdd(cptCode)}
          className="bg-success hover:bg-success/90 text-success-foreground flex-shrink-0 h-8 w-8 md:h-9 md:w-9 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};