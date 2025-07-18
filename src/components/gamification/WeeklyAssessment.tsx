import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Zap, Trophy, Calendar, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const WeeklyAssessment = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [currentWeekAssessment, setCurrentWeekAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      loadAssessments();
    }
  }, [user]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(10);

      if (error) throw error;

      setAssessments(data || []);
      
      // Check if we have current week assessment
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      const currentWeek = data?.find(a => a.week_start === weekStartStr);
      setCurrentWeekAssessment(currentWeek || null);
    } catch (error) {
      console.error('Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyAssessment = async () => {
    setGenerating(true);
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data, error } = await supabase.functions.invoke('weekly-ai-assessment', {
        body: {
          user_id: user.id,
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0]
        }
      });

      if (error) throw error;

      toast({
        title: "Weekly Assessment Generated! 🎉",
        description: "Your AI insights and funny awards are ready!",
      });

      loadAssessments();
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast({
        title: "Assessment Failed",
        description: "Could not generate weekly assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const AssessmentCard = ({ assessment }: { assessment: any }) => (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Weekly Assessment
            </CardTitle>
            <CardDescription>
              {formatWeekRange(assessment.week_start, assessment.week_end)}
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-gradient-to-r from-purple-400 to-pink-500 text-white border-0">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Generated
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-6">
        {/* AI Insights */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Insights
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {assessment.ai_insights}
          </p>
        </div>

        {/* Performance Stats */}
        {assessment.assessment_data && (
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {assessment.assessment_data.total_cases || 0}
              </p>
              <p className="text-xs text-muted-foreground">Cases</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {Number(assessment.assessment_data.total_rvu || 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">RVU</p>
            </div>
          </div>
        )}

        {/* Funny Awards */}
        {assessment.funny_awards && assessment.funny_awards.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Funny Awards
            </h4>
            <div className="space-y-3">
              {assessment.funny_awards.map((award: any, index: number) => (
                <div key={index} className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{award.emoji}</span>
                    <div className="flex-1">
                      <h5 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {award.title}
                      </h5>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        {award.description}
                      </p>
                      {award.criteria_met && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {award.criteria_met}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Weekly AI Assessment</h2>
        <p className="text-muted-foreground">
          Get personalized insights and funny awards for your surgical performance
        </p>
      </div>

      {/* Generate Current Week Button */}
      {!currentWeekAssessment && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-purple-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready for This Week's Assessment?</h3>
            <p className="text-muted-foreground mb-6">
              Let AI analyze your cases and generate funny awards based on your performance!
            </p>
            <Button 
              onClick={generateWeeklyAssessment}
              disabled={generating}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Zap className="h-4 w-4 mr-2" />
              {generating ? 'Generating Assessment...' : 'Generate AI Assessment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Week Assessment */}
      {currentWeekAssessment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">This Week</h3>
            <Button 
              onClick={generateWeeklyAssessment}
              disabled={generating}
              variant="outline"
              size="sm"
            >
              <Zap className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          </div>
          <AssessmentCard assessment={currentWeekAssessment} />
        </div>
      )}

      {/* Historical Assessments */}
      {assessments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Assessment History
          </h3>
          
          <div className="space-y-4">
            {assessments
              .filter(a => a.id !== currentWeekAssessment?.id)
              .map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))
            }
          </div>
        </div>
      )}

      {/* Empty State */}
      {assessments.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assessments Yet</h3>
            <p className="text-muted-foreground">
              Generate your first AI assessment to see personalized insights and funny awards!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};