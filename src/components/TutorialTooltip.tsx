import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TutorialStep {
  title: string;
  content: string;
  highlight?: string;
  tips?: string[];
}

interface TutorialTooltipProps {
  title: string;
  steps: TutorialStep[];
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const TutorialTooltip = ({ 
  title, 
  steps, 
  position = 'bottom',
  className 
}: TutorialTooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className={cn(
          "absolute z-50 w-80",
          positionClasses[position]
        )}>
          <Card className="shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground">
                  {title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
                <div className="flex-1 bg-muted rounded-full h-1">
                  <div 
                    className="bg-primary rounded-full h-1 transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm text-foreground mb-2">
                  {steps[currentStep].title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {steps[currentStep].content}
                </p>
              </div>

              {steps[currentStep].highlight && (
                <div className="p-2 bg-primary/10 rounded-md border border-primary/20">
                  <p className="text-xs text-primary font-medium">
                    💡 {steps[currentStep].highlight}
                  </p>
                </div>
              )}

              {steps[currentStep].tips && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tips:</p>
                  <ul className="space-y-1">
                    {steps[currentStep].tips!.map((tip, index) => (
                      <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="h-7 text-xs"
                >
                  <ChevronLeft className="h-3 w-3 mr-1" />
                  Previous
                </Button>
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="h-7 text-xs"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep !== steps.length - 1 && (
                    <ChevronRight className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};