import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DictationCard } from '@/components/DictationCard';
import { CPTCodeCard } from '@/components/CPTCodeCard';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Calculator, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Trash2,
  Save,
  Brain,
  AlertCircle
} from 'lucide-react';
import { TutorialTooltip } from '@/components/TutorialTooltip';
import { newCaseTutorial } from '@/components/TutorialData';

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
}

interface CaseData {
  case_name: string;
  patient_mrn?: string;
  procedure_date?: string;
  procedure_description?: string;
  notes?: string;
}

export const NewCase = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState<CaseData>({
    case_name: 'New Case',
    procedure_date: new Date().toISOString().split('T')[0],
  });
  const [selectedCodes, setSelectedCodes] = useState<CPTCode[]>([]);
  const [searchResults, setSearchResults] = useState<CPTCode[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [rvuRate, setRvuRate] = useState<number>(profile?.default_rvu_rate || 65);

  // Handle pre-populated codes from navigation state
  useEffect(() => {
    if (location.state?.codes) {
      setSelectedCodes(location.state.codes);
      if (location.state.procedureDescription) {
        setCaseData(prev => ({
          ...prev,
          procedure_description: location.state.procedureDescription
        }));
      }
      if (location.state.caseName) {
        setCaseData(prev => ({
          ...prev,
          case_name: location.state.caseName
        }));
      }
    }
  }, [location.state]);

  // Update RVU rate when profile loads
  useEffect(() => {
    if (profile?.default_rvu_rate) {
      setRvuRate(profile.default_rvu_rate);
    }
  }, [profile]);

  // Redirect if not authenticated
  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            Please sign in to create and manage cases.
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSearch = async (text: string, type: 'voice' | 'photo' | 'text') => {
    setIsProcessing(true);
    setLastQuery(text);
    
    try {
      const { data, error } = await supabase.functions.invoke('search-cpt-codes', {
        body: { procedureDescription: text }
      });

      if (error) throw error;

      setSearchResults(data?.codes || []);
      toast({
        title: "Search completed",
        description: `Found ${data?.codes?.length || 0} relevant codes`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for codes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCode = (code: CPTCode) => {
    // Prevent duplicate codes
    if (selectedCodes.some(c => c.code === code.code)) {
      toast({
        title: "Code already added",
        description: `${code.code} is already in this case`,
        variant: "destructive",
      });
      return;
    }

    const updatedCodes = [...selectedCodes, code];
    setSelectedCodes(updatedCodes);
    toast({
      title: "Code added",
      description: `${code.code} added to case`,
    });
  };

  const handleRemoveCode = (codeToRemove: string) => {
    const updatedCodes = selectedCodes.filter(code => code.code !== codeToRemove);
    setSelectedCodes(updatedCodes);
    toast({
      title: "Code removed",
      description: `${codeToRemove} removed from case`,
    });
  };

  const totalRVUs = selectedCodes.reduce((sum, code) => sum + code.rvu, 0);
  const estimatedValue = totalRVUs * rvuRate;

  const handleSaveCase = async () => {
    if (!user) return;
    
    if (!caseData.case_name.trim()) {
      toast({
        title: "Case name required",
        description: "Please enter a case name before saving",
        variant: "destructive",
      });
      return;
    }

    if (selectedCodes.length === 0) {
      toast({
        title: "No codes selected",
        description: "Please add at least one CPT code to the case",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Insert case
      const { data: caseResult, error: caseError } = await supabase
        .from('cases')
        .insert({
          user_id: user.id,
          case_name: caseData.case_name,
          patient_mrn: caseData.patient_mrn || null,
          procedure_date: caseData.procedure_date || null,
          procedure_description: caseData.procedure_description || null,
          notes: caseData.notes || null,
          total_rvu: totalRVUs,
          estimated_value: estimatedValue,
          status: 'active'
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Insert case codes
      const caseCodesData = selectedCodes.map((code, index) => ({
        case_id: caseResult.id,
        user_id: user.id,
        cpt_code: code.code,
        description: code.description,
        rvu: code.rvu,
        category: code.category,
        modifiers: code.modifiers || null,
        position: index + 1,
        is_primary: index === 0
      }));

      const { error: codesError } = await supabase
        .from('case_codes')
        .insert(caseCodesData);

      if (codesError) throw codesError;

      toast({
        title: "Case saved successfully",
        description: "Your case has been saved with " + selectedCodes.length + " codes",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/viewcases')}
          >
            View All Cases
          </Button>
        ),
      });

      // Reset form
      setCaseData({
        case_name: 'New Case',
        procedure_date: new Date().toISOString().split('T')[0],
      });
      setSelectedCodes([]);
      setSearchResults([]);
      setLastQuery('');

    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: "Error saving case",
        description: "There was an error saving your case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimizeBilling = () => {
    // TODO: Implement AI-powered billing optimization
    toast({
      title: "Optimizing billing arrangement",
      description: "AI recommendations coming soon...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Case Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Case Management
              <TutorialTooltip {...newCaseTutorial} />
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleOptimizeBilling} variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Optimize Billing
              </Button>
              <Button 
                onClick={handleSaveCase} 
                disabled={isSaving || selectedCodes.length === 0 || !caseData.case_name.trim()}
                variant="default" 
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Case'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="caseName">Case Name *</Label>
              <Input
                id="caseName"
                value={caseData.case_name}
                onChange={(e) => setCaseData(prev => ({ ...prev, case_name: e.target.value }))}
                placeholder="Enter case name"
                required
              />
            </div>
            <div>
              <Label htmlFor="patientMrn">Patient MRN (HIPAA Compliant)</Label>
              <Input
                id="patientMrn"
                value={caseData.patient_mrn || ''}
                onChange={(e) => setCaseData(prev => ({ ...prev, patient_mrn: e.target.value }))}
                placeholder="Medical Record Number"
              />
            </div>
            <div>
              <Label htmlFor="procedureDate">Procedure Date</Label>
              <Input
                id="procedureDate"
                type="date"
                value={caseData.procedure_date}
                onChange={(e) => setCaseData(prev => ({ ...prev, procedure_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="procedureDescription">Procedure Description</Label>
              <Textarea
                id="procedureDescription"
                value={caseData.procedure_description || ''}
                onChange={(e) => setCaseData(prev => ({ ...prev, procedure_description: e.target.value }))}
                placeholder="Brief description of the procedure"
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label htmlFor="caseNotes">Case Notes</Label>
              <Textarea
                id="caseNotes"
                value={caseData.notes || ''}
                onChange={(e) => setCaseData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for this case"
                className="min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="rvuRate">RVU Compensation Rate ($/RVU)</Label>
              <Input
                id="rvuRate"
                type="number"
                step="0.01"
                value={rvuRate}
                onChange={(e) => setRvuRate(Number(e.target.value))}
                placeholder="65.00"
                className="w-32"
              />
            </div>
            {profile?.default_rvu_rate && rvuRate !== profile.default_rvu_rate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRvuRate(profile.default_rvu_rate!)}
                className="mt-6"
              >
                Use Profile Default (${profile.default_rvu_rate})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Code Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Codes to Case
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DictationCard 
            onSubmit={handleSearch}
            isProcessing={isProcessing}
          />
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((code) => (
                <CPTCodeCard
                  key={code.code}
                  cptCode={code}
                  onAdd={() => handleAddCode(code)}
                  compensationRate={rvuRate}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Case Codes */}
      {selectedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Case Codes</CardTitle>
              <Button 
                onClick={() => setShowChat(true)}
                variant="outline"
                size="sm"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Get AI Recommendations
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedCodes.map((code) => (
                <div key={code.code} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="font-mono">
                        {code.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {code.category}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{code.description}</p>
                    {code.modifiers && code.modifiers.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {code.modifiers.map((modifier) => (
                          <Badge key={modifier} variant="outline" className="text-xs">
                            {modifier}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{code.rvu} RVU</div>
                      <div className="text-xs text-muted-foreground">
                        ${(code.rvu * rvuRate).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveCode(code.code)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  <span className="font-medium">Case Totals</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{totalRVUs.toFixed(1)} RVU</div>
                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <DollarSign className="h-4 w-4" />
                    {estimatedValue.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          procedureDescription={lastQuery}
          selectedCodes={selectedCodes}
          searchResults={searchResults}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};