import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DocumentationIssue {
  type: 'missing_laterality' | 'incomplete_depth' | 'missing_modifier' | 'bundling_violation' | 'compliance_issue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  code?: string;
  field: string;
  message: string;
  suggestion: string;
  rvuImpact?: number;
  compliance?: {
    policy: string;
    reference: string;
  };
}

interface DocumentationAnalysis {
  issues: DocumentationIssue[];
  completenessScore: number;
  missingElements: string[];
  requiredModifiers: {
    code: string;
    modifier: string;
    reason: string;
  }[];
  complianceWarnings: {
    type: string;
    message: string;
    severity: string;
  }[];
}

interface RealTimeAnalyzerProps {
  dictationText: string;
  selectedCodes: any[];
  specialty?: string;
  onAnalysisUpdate: (analysis: DocumentationAnalysis | null) => void;
}

export const RealTimeAnalyzer = ({ 
  dictationText, 
  selectedCodes, 
  specialty,
  onAnalysisUpdate 
}: RealTimeAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<DocumentationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce dictation text to avoid too many API calls
  const debouncedText = useDebounce(dictationText, 2000);

  const analyzeDocumentation = useCallback(async (text: string) => {
    // Only analyze if text is substantial enough to be a complete dictation
    if (!text.trim() || text.length < 100) {
      setAnalysis(null);
      onAnalysisUpdate(null);
      return;
    }

    // Check if this appears to be a complete dictation (has procedure details)
    const hasCompleteDictation = text.toLowerCase().includes('procedure') || 
                                text.toLowerCase().includes('surgery') ||
                                text.toLowerCase().includes('operation') ||
                                text.toLowerCase().includes('incision') ||
                                text.split('.').length > 3; // Multiple sentences

    if (!hasCompleteDictation) {
      setAnalysis(null);
      onAnalysisUpdate(null);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-documentation', {
        body: { 
          dictationText: text,
          selectedCodes,
          specialty
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      onAnalysisUpdate(data);
    } catch (err) {
      console.error('Documentation analysis error:', err);
      setError(err.message || 'Failed to analyze documentation');
      setAnalysis(null);
      onAnalysisUpdate(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedCodes, specialty, onAnalysisUpdate]);

  useEffect(() => {
    analyzeDocumentation(debouncedText);
  }, [debouncedText, analyzeDocumentation]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Analyzing documentation...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!analysis || !dictationText.trim()) {
    return null;
  }

  const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
  const highIssues = analysis.issues.filter(i => i.severity === 'high');

  return (
    <div className="space-y-4">
      {/* Completeness Score */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-green-800">Documentation Completeness</h3>
            <p className="text-sm text-green-600">
              Score: {analysis.completenessScore}% - {
                analysis.completenessScore >= 90 ? 'Excellent' :
                analysis.completenessScore >= 75 ? 'Good' :
                analysis.completenessScore >= 60 ? 'Fair' : 'Needs Improvement'
              }
            </p>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {analysis.completenessScore}%
          </div>
        </div>
      </Card>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Critical Issues ({criticalIssues.length})</div>
              {criticalIssues.map((issue, index) => (
                <div key={index} className="text-sm">
                  <strong>{issue.field}:</strong> {issue.message}
                  <div className="text-xs text-muted-foreground mt-1">
                    💡 {issue.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* All Issues */}
      {analysis.issues.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Documentation Issues ({analysis.issues.length})</h3>
          <div className="space-y-3">
            {analysis.issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                {getSeverityIcon(issue.severity)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-${getSeverityColor(issue.severity)}-600`}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                    {issue.code && (
                      <Badge variant="secondary" className="font-mono">
                        {issue.code}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium">{issue.message}</div>
                  <div className="text-xs text-muted-foreground">
                    💡 {issue.suggestion}
                  </div>
                  {issue.rvuImpact && issue.rvuImpact > 0 && (
                    <div className="text-xs text-green-600 font-medium">
                      Potential RVU Impact: +{issue.rvuImpact}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Required Modifiers */}
      {analysis.requiredModifiers.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <h3 className="font-medium text-amber-800 mb-2">Required Modifiers</h3>
          <div className="space-y-2">
            {analysis.requiredModifiers.map((mod, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono">{mod.code}</Badge>
                <Badge variant="secondary">{mod.modifier}</Badge>
                <span className="text-amber-700">{mod.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Compliance Warnings */}
      {analysis.complianceWarnings.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
          <h3 className="font-medium text-red-800 mb-2">Compliance Warnings</h3>
          <div className="space-y-2">
            {analysis.complianceWarnings.map((warning, index) => (
              <div key={index} className="text-sm text-red-700">
                <Badge variant="outline" className="text-red-600 mr-2">
                  {warning.severity.toUpperCase()}
                </Badge>
                {warning.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Missing Elements */}
      {analysis.missingElements.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">Missing Documentation Elements</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missingElements.map((element, index) => (
              <Badge key={index} variant="outline" className="text-blue-700">
                {element}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};