import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DictationCard } from '@/components/DictationCard';
import { CPTCodeCard } from '@/components/CPTCodeCard';
import { ChatInterface } from '@/components/ChatInterface';
import { AddOnCodeFeedback } from '@/components/AddOnCodeFeedback';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, CheckCircle, MessageCircle, BookOpen, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { TutorialTooltip } from '@/components/TutorialTooltip';
import { searchCodesTutorial } from '@/components/TutorialData';

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
  is_primary?: boolean;
  position?: number;
  whenNeeded?: string;
}

interface SearchResponse {
  primaryCodes: CPTCode[];
  associatedCodes: CPTCode[];
}

export const SearchCodes = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [primaryCodes, setPrimaryCodes] = useState<CPTCode[]>([]);
  const [associatedCodes, setAssociatedCodes] = useState<CPTCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<CPTCode[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [dictationSuggestions, setDictationSuggestions] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAnalyzingDictation, setIsAnalyzingDictation] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Record<string, boolean>>({});
  const [showDictationTab, setShowDictationTab] = useState(false);
  const { toast } = useToast();

  // Mock CPT codes for demonstration
  const mockResults: CPTCode[] = [
    {
      code: '47562',
      description: 'Laparoscopic cholecystectomy',
      rvu: 10.61,
      modifiers: ['59', '78'],
      category: 'Surgery'
    },
    {
      code: '47563',
      description: 'Laparoscopic cholecystectomy with cholangiography',
      rvu: 12.33,
      modifiers: ['59'],
      category: 'Surgery'
    },
    {
      code: '76998',
      description: 'Ultrasonic guidance, intraoperative',
      rvu: 1.58,
      modifiers: ['26'],
      category: 'Radiology'
    },
  ];

  const handleSearch = async (text: string, type: 'voice' | 'photo' | 'text') => {
    setIsProcessing(true);
    setLastQuery(text);
    setShowDictationTab(false); // Reset dictation tab when doing new search

    try {
      const { data, error } = await supabase.functions.invoke('search-cpt-codes', {
        body: { 
          procedureDescription: text,
          specialty: user?.user_metadata?.specialty || profile?.specialty_id
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const response = data as SearchResponse;
      setPrimaryCodes(response.primaryCodes || []);
      setAssociatedCodes(response.associatedCodes || []);
      
      toast({
        title: "CPT Codes Found",
        description: `Found ${response.primaryCodes?.length || 0} primary codes and ${response.associatedCodes?.length || 0} associated codes`,
      });

      // Don't automatically analyze dictation - wait for user to select codes
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeDictation = async (dictationText: string) => {
    setIsAnalyzingDictation(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-dictation', {
        body: { dictationText }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setDictationSuggestions(data);
      setShowSuggestions(true);
      
      toast({
        title: "Dictation Analysis Complete",
        description: `Found ${data.suggestedEdits?.length || 0} improvement suggestions`,
      });
    } catch (error) {
      console.error('Error analyzing dictation:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze dictation for improvements.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingDictation(false);
    }
  };

  const handleAddCode = (code: CPTCode) => {
    if (!selectedCodes.find(c => c.code === code.code)) {
      const newSelectedCodes = [...selectedCodes, code];
      setSelectedCodes(newSelectedCodes);
      
      // Show dictation tab when codes are first selected
      if (selectedCodes.length === 0) {
        setShowDictationTab(true);
      }
      
      toast({
        title: "Code Added",
        description: `${code.code} added to case`,
      });
    }
  };

  const handleRemoveCode = (codeToRemove: string) => {
    const newSelectedCodes = selectedCodes.filter(code => code.code !== codeToRemove);
    setSelectedCodes(newSelectedCodes);
    
    // Hide dictation tab if no codes selected
    if (newSelectedCodes.length === 0) {
      setShowDictationTab(false);
    }
    
    toast({
      title: "Code Removed",
      description: `${codeToRemove} removed from case`,
    });
  };

  const handleCreateCase = () => {
    if (selectedCodes.length === 0) {
      toast({
        title: "No Codes Selected",
        description: "Please select at least one CPT code to create a case.",
        variant: "destructive",
      });
      return;
    }

    // Check authentication
    if (!user) {
      // Save selected codes to localStorage and redirect to auth
      const tempData = {
        codes: selectedCodes,
        procedureDescription: lastQuery,
        caseName: `Case - ${lastQuery.substring(0, 50)}${lastQuery.length > 50 ? '...' : ''}`,
        timestamp: Date.now()
      };
      localStorage.setItem('tempCaseData', JSON.stringify(tempData));
      
      toast({
        title: "Sign In Required",
        description: "Please sign in to create a case. Your codes will be saved.",
      });
      
      navigate('/auth?returnTo=' + encodeURIComponent('/new-case'));
      return;
    }

    // Navigate to New Case page with pre-populated codes
    navigate('/new-case', { 
      state: { 
        codes: selectedCodes,
        procedureDescription: lastQuery,
        caseName: `Case - ${lastQuery.substring(0, 50)}${lastQuery.length > 50 ? '...' : ''}`
      } 
    });
  };

  const handleCodeFeedback = (feedback: any) => {
    setFeedbackSubmitted({ ...feedbackSubmitted, [feedback.codeIndex]: true });
  };

  const handleGetDictationRecommendations = async () => {
    if (selectedCodes.length === 0) return;
    
    setIsAnalyzingDictation(true);
    try {
      const codesString = selectedCodes.map(code => `${code.code} (${code.description})`).join(', ');
      const prompt = `Provide brief documentation requirements for billing these CPT codes: ${codesString}. What key elements must be documented in the operative note or procedure documentation to support billing these codes?`;
      
      const { data, error } = await supabase.functions.invoke('chat-cpt-codes', {
        body: { 
          message: prompt,
          procedureDescription: lastQuery,
          selectedCodes: selectedCodes.map(c => c.code)
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setDictationSuggestions({
        documentationRequirements: data.response || data.message,
        selectedCodes: selectedCodes
      });
      setShowSuggestions(true);
      
    } catch (error) {
      console.error('Error getting dictation recommendations:', error);
      toast({
        title: "Failed to Get Recommendations",
        description: "Unable to get dictation recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingDictation(false);
    }
  };

  const totalRVUs = selectedCodes.reduce((sum, code) => sum + code.rvu, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="w-6 h-6 text-primary" />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">Find CPT Codes</h1>
          {(profile?.specialty_id || user?.user_metadata?.specialty) && (
            <div className="text-sm text-muted-foreground">
              Specialized for {profile?.specialty_id || user?.user_metadata?.specialty}
            </div>
          )}
        </div>
        <TutorialTooltip {...searchCodesTutorial} />
      </div>


      <DictationCard 
        onSubmit={handleSearch} 
        isProcessing={isProcessing || isAnalyzingDictation}
        selectedCodes={selectedCodes}
        specialty={profile?.specialty_id || user?.user_metadata?.specialty}
      />

      {(isProcessing || isAnalyzingDictation) && (
        <Card className="p-6 text-center bg-gradient-card border-medical-accent/10">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">
              {isProcessing ? 'Analyzing procedure description...' : 'Analyzing dictation for improvements...'}
            </p>
          </div>
        </Card>
      )}

      {showSuggestions && dictationSuggestions && (
        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">🎯 Suggested Dictation Edits</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(false)}
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Potential RVU Increase</h3>
                <div className="text-2xl font-bold text-green-600">
                  +{dictationSuggestions.totalRvuIncrease?.toFixed(1) || 0} RVU
                </div>
                <div className="text-sm text-muted-foreground">
                  ≈ ${((dictationSuggestions.totalRvuIncrease || 0) * 52).toFixed(0)} additional revenue
                </div>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Improvement Areas</h3>
                <div className="text-2xl font-bold text-blue-600">
                  {dictationSuggestions.suggestedEdits?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">suggested edits</div>
              </div>
            </div>

            {dictationSuggestions.suggestedEdits?.map((edit: any, index: number) => (
              <div key={index} className="bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-yellow-200/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-foreground capitalize">{edit.section}</h4>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    +{edit.rvuImpact} RVU
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-red-600 font-medium">Original: </span>
                    <span className="text-muted-foreground">"{edit.original}"</span>
                  </div>
                  <div>
                    <span className="text-green-600 font-medium">Suggested: </span>
                    <span className="text-foreground">"{edit.suggested}"</span>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Why: </span>
                    <span className="text-muted-foreground">{edit.reason}</span>
                  </div>
                </div>
              </div>
            ))}

            {dictationSuggestions.additionalCodes?.length > 0 && (
              <AddOnCodeFeedback
                additionalCodes={dictationSuggestions.additionalCodes}
                primaryCodes={primaryCodes.map(c => c.code)}
                onFeedbackSubmit={handleCodeFeedback}
              />
            )}

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50">
              <h3 className="font-medium text-green-700 mb-2">✨ Improved Dictation</h3>
              <div className="text-sm text-foreground bg-white/60 dark:bg-black/20 p-3 rounded border">
                {dictationSuggestions.improvedDictation}
              </div>
            </div>
          </div>
        </Card>
      )}

      {lastQuery && (primaryCodes.length > 0 || associatedCodes.length > 0) && (
        <Card className="p-4 bg-medical-light border-medical-accent/20">
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Analyzed Procedure:</p>
              <p className="text-sm text-muted-foreground mt-1">{lastQuery}</p>
            </div>
          </div>
        </Card>
      )}

      {(primaryCodes.length > 0 || associatedCodes.length > 0) && (
        <div className="space-y-6">
          {primaryCodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Primary CPT Codes</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowChat(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat with AI
                  </Button>
                  <Badge variant="outline" className="border-primary text-primary">
                    {primaryCodes.length} primary codes
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                {primaryCodes.map((code) => (
                  <CPTCodeCard
                    key={code.code}
                    cptCode={code}
                    onAdd={handleAddCode}
                    compensationRate={52}
                  />
                ))}
              </div>
            </div>
          )}

          {associatedCodes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Commonly Associated Codes</h2>
                <Badge variant="secondary" className="border-muted-foreground/20">
                  {associatedCodes.length} associated codes
                </Badge>
              </div>
              
              <div className="space-y-3">
                {associatedCodes.map((code) => (
                  <CPTCodeCard
                    key={code.code}
                    cptCode={code}
                    onAdd={handleAddCode}
                    compensationRate={52}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedCodes.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-card-foreground">Selected Case Codes</h2>
          </div>
          
          <Tabs defaultValue="codes" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="codes">Selected Codes</TabsTrigger>
              <TabsTrigger value="dictation" disabled={!showDictationTab}>
                <BookOpen className="w-4 h-4 mr-2" />
                Dictation Requirements
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="codes" className="space-y-3">
              <div className="space-y-3">
                {selectedCodes.map((code) => (
                  <div key={code.code} className="flex items-center justify-between p-3 bg-card rounded-lg border border-success/20">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono border-success text-success">
                        {code.code}
                      </Badge>
                      <span className="text-sm text-card-foreground">{code.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-success">{code.rvu} RVU</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCode(code.code)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-success/20">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-card-foreground">Total RVUs:</span>
                  <span className="text-xl font-bold text-success">{totalRVUs.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Estimated Value:</span>
                  <span className="text-lg font-semibold text-success">${(totalRVUs * 52).toFixed(2)}</span>
                </div>
                <div className="mt-4">
                <Button 
                  onClick={handleCreateCase}
                  className="w-full"
                  disabled={selectedCodes.length === 0}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Case
                </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="dictation" className="space-y-4">
              {!showSuggestions ? (
                <div className="text-center py-8">
                  <Button 
                    onClick={handleGetDictationRecommendations}
                    disabled={isAnalyzingDictation}
                    className="mb-4"
                  >
                    {isAnalyzingDictation ? 'Getting Recommendations...' : 'Get Documentation Requirements'}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered documentation requirements for your selected codes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Documentation Requirements</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50">
                    <div className="text-sm text-foreground whitespace-pre-wrap">
                      {dictationSuggestions?.documentationRequirements}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {showChat && lastQuery && (
        <div className="space-y-4">
          <ChatInterface
            procedureDescription={lastQuery}
            selectedCodes={selectedCodes}
            searchResults={[...primaryCodes, ...associatedCodes]}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
};