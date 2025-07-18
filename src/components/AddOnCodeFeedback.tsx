import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddOnCodeFeedbackProps {
  additionalCodes: {
    code: string;
    description: string;
    rvu: number;
    justification: string;
  }[];
  primaryCodes: string[];
  onFeedbackSubmit: (feedback: any) => void;
}

export const AddOnCodeFeedback = ({ 
  additionalCodes, 
  primaryCodes, 
  onFeedbackSubmit 
}: AddOnCodeFeedbackProps) => {
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({});
  const [submittedFeedback, setSubmittedFeedback] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleFeedback = async (codeIndex: number, type: 'up' | 'down') => {
    const code = additionalCodes[codeIndex];
    const newFeedback = { ...feedback, [codeIndex]: type };
    setFeedback(newFeedback);

    // Submit feedback to learning system
    try {
      const { error } = await supabase.functions.invoke('submit-code-feedback', {
        body: {
          addOnCode: code.code,
          primaryCodes,
          feedback: type,
          justification: code.justification,
          rvu: code.rvu
        }
      });

      if (error) {
        console.error('Feedback submission error:', error);
      }

      setSubmittedFeedback({ ...submittedFeedback, [codeIndex]: true });
      
      toast({
        title: "Feedback Submitted",
        description: `Thank you for helping improve our AI recommendations`,
      });

      onFeedbackSubmit({ codeIndex, type, code });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (!additionalCodes || additionalCodes.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="space-y-3">
        <h3 className="font-medium text-blue-900">💡 AI-Suggested Add-on Codes</h3>
        <p className="text-sm text-blue-700">
          Help us improve by rating these suggestions. Your feedback trains our AI to provide better recommendations.
        </p>
        
        {additionalCodes.map((code, index) => (
          <div key={index} className="bg-white/80 rounded-lg p-3 border border-blue-200/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-300 font-mono">
                    {code.code}
                  </Badge>
                  <Badge variant="secondary" className="text-green-600">
                    {code.rvu} RVU
                  </Badge>
                </div>
                <div className="text-sm font-medium text-blue-900">{code.description}</div>
                <div className="text-xs text-blue-600 mt-1">{code.justification}</div>
              </div>
              
              <div className="flex items-center gap-1 ml-3">
                {submittedFeedback[index] ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Thanks!</span>
                  </div>
                ) : (
                  <>
                    <Button
                      variant={feedback[index] === 'up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback(index, 'up')}
                      className="h-8 w-8 p-0"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={feedback[index] === 'down' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleFeedback(index, 'down')}
                      className="h-8 w-8 p-0"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};