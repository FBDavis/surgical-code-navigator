import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  BookOpen, 
  CheckCircle,
  ArrowRight,
  GraduationCap,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Tutorial types
export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  element?: string; // CSS selector for highlighting
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: string;
  tips?: string[];
  action?: {
    type: 'click' | 'navigate' | 'wait';
    target?: string;
    delay?: number;
  };
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'advanced' | 'workflow' | 'analytics';
  icon: string;
  steps: TutorialStep[];
  prerequisite?: string[];
  estimatedTime: number; // in minutes
}

// Tutorial Context
interface TutorialContextType {
  activeTutorial: Tutorial | null;
  currentStep: number;
  isActive: boolean;
  completedTutorials: string[];
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  markCompleted: (tutorialId: string) => void;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
};

// Tutorial Provider
interface TutorialProviderProps {
  children: ReactNode;
}

export const TutorialProvider = ({ children }: TutorialProviderProps) => {
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
  const { user, profile } = useAuth();

  // Load completed tutorials from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`tutorial-progress-${user.id}`);
      if (saved) {
        setCompletedTutorials(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save completed tutorials to localStorage
  const saveProgress = (completed: string[]) => {
    if (user) {
      localStorage.setItem(`tutorial-progress-${user.id}`, JSON.stringify(completed));
      setCompletedTutorials(completed);
    }
  };

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    setActiveTutorial(null);
    setCurrentStep(0);
    setIsActive(false);
  };

  const completeTutorial = () => {
    if (activeTutorial) {
      const updated = [...completedTutorials, activeTutorial.id];
      saveProgress(updated);
    }
    setActiveTutorial(null);
    setCurrentStep(0);
    setIsActive(false);
  };

  const markCompleted = (tutorialId: string) => {
    if (!completedTutorials.includes(tutorialId)) {
      const updated = [...completedTutorials, tutorialId];
      saveProgress(updated);
    }
  };

  const value = {
    activeTutorial,
    currentStep,
    isActive,
    completedTutorials,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
    markCompleted,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {isActive && activeTutorial && (
        <TutorialOverlay />
      )}
    </TutorialContext.Provider>
  );
};

// Tutorial Overlay Component
const TutorialOverlay = () => {
  const { activeTutorial, currentStep, nextStep, prevStep, skipTutorial } = useTutorial();
  
  if (!activeTutorial) return null;

  const step = activeTutorial.steps[currentStep];
  const progress = ((currentStep + 1) / activeTutorial.steps.length) * 100;

  // Highlight target element
  useEffect(() => {
    if (step.element) {
      const element = document.querySelector(step.element);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('tutorial-highlight');
        return () => element.classList.remove('tutorial-highlight');
      }
    }
  }, [step.element]);

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100]" />
      
      {/* Tutorial card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">
                  {activeTutorial.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {activeTutorial.steps.length}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ~{activeTutorial.estimatedTime} min
                </span>
              </div>
              
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.content}
              </p>
            </div>

            {step.highlight && (
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  💡 {step.highlight}
                </p>
              </div>
            )}

            {step.tips && step.tips.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Quick Tips:</p>
                <ul className="space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipTutorial}
                  className="h-9 text-muted-foreground"
                >
                  Skip Tour
                </Button>
                
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="h-9"
                >
                  {currentStep === activeTutorial.steps.length - 1 ? (
                    <>
                      Complete
                      <CheckCircle className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Tutorial Hub Component
interface TutorialHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialHub = ({ isOpen, onClose }: TutorialHubProps) => {
  const { startTutorial, completedTutorials } = useTutorial();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const availableFeatures = [
    { id: 'basics', name: 'Basic Navigation', description: 'Learn to navigate the app' },
    { id: 'search', name: 'Code Search', description: 'Find CPT codes quickly' },
    { id: 'cases', name: 'Case Management', description: 'Create and manage cases' },
    { id: 'schedules', name: 'Schedule Scanner', description: 'Import surgery schedules' },
    { id: 'workflow', name: 'Full Case Workflow', description: 'End-to-end case process' },
    { id: 'rvu', name: 'RVU Tracking', description: 'Track and analyze RVUs' },
    { id: 'resident', name: 'Resident Case Logs', description: 'Log training cases' },
    { id: 'secondary', name: 'Secondary Codes', description: 'Add additional procedure codes' },
    { id: 'analytics', name: 'Analytics Dashboard', description: 'View reports and insights' },
    { id: 'messages', name: 'Team Messaging', description: 'Communicate with colleagues' },
  ];

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures([...selectedFeatures, featureId]);
    } else {
      setSelectedFeatures(selectedFeatures.filter(id => id !== featureId));
    }
  };

  const startSelectedTutorials = () => {
    // For now, start with basics if selected, otherwise first selected feature
    const firstFeature = selectedFeatures.includes('basics') ? 'basics' : selectedFeatures[0];
    if (firstFeature) {
      // You would implement the actual tutorial starting logic here
      console.log('Starting tutorials for:', selectedFeatures);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="h-6 w-6 text-primary" />
            Welcome to OpCoder!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              Let's get you started with a guided tour
            </p>
            <p className="text-sm text-muted-foreground">
              Select the features you'd like to learn about. We'll create a personalized tutorial experience for you.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">What would you like to learn about?</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableFeatures.map((feature) => (
                <Card 
                  key={feature.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md border",
                    selectedFeatures.includes(feature.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleFeatureToggle(feature.id, !selectedFeatures.includes(feature.id))}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        checked={selectedFeatures.includes(feature.id)}
                        onChange={() => {}}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-foreground">
                            {feature.name}
                          </h4>
                          {completedTutorials.includes(feature.id) && (
                            <CheckCircle className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Skip for now
            </Button>
            
            <Button 
              onClick={startSelectedTutorials}
              disabled={selectedFeatures.length === 0}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Tutorial ({selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Tutorial trigger button component
interface TutorialTriggerProps {
  tutorial?: Tutorial;
  variant?: 'icon' | 'button' | 'card';
  className?: string;
  children?: ReactNode;
}

export const TutorialTrigger = ({ 
  tutorial, 
  variant = 'icon', 
  className,
  children 
}: TutorialTriggerProps) => {
  const { startTutorial } = useTutorial();

  const handleClick = () => {
    if (tutorial) {
      startTutorial(tutorial);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className={cn("h-8 w-8 p-0 text-muted-foreground hover:text-primary", className)}
      >
        <BookOpen className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className={cn("", className)}
    >
      {children || (
        <>
          <BookOpen className="h-4 w-4 mr-2" />
          Start Tutorial
        </>
      )}
    </Button>
  );
};