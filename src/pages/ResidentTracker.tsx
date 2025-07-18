import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Download, Plus, Trash2, CheckCircle, Clock, User, AlertTriangle, ThumbsUp, ThumbsDown, Edit, Sparkles, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Specialty {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
}

interface CaseRequirement {
  id: string;
  category: string;
  subcategory: string;
  min_required: number;
  max_allowed?: number;
  description: string;
  cpt_codes: string[];
  ai_generated?: boolean;
  confidence_level?: number;
  source?: string;
  needs_review?: boolean;
  user_feedback_count?: number;
}

interface RequirementFeedback {
  id: string;
  feedback_type: 'correction' | 'verification' | 'addition' | 'deletion';
  description: string;
  suggested_value?: any;
  status: 'pending' | 'approved' | 'rejected';
}

interface ResidentCase {
  id: string;
  case_date: string;
  case_name: string;
  primary_cpt_code: string;
  role: 'primary_surgeon' | 'first_assist' | 'observer';
  notes?: string;
  verified: boolean;
  requirement_id?: string;
}

const ResidentTracker = () => {
  const { user } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [requirements, setRequirements] = useState<CaseRequirement[]>([]);
  const [residentCases, setResidentCases] = useState<ResidentCase[]>([]);
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<CaseRequirement | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'correction' as const,
    description: '',
    suggested_min: '',
    suggested_max: '',
    suggested_description: '',
    suggested_cpt_codes: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCase, setNewCase] = useState({
    case_date: new Date(),
    case_name: '',
    primary_cpt_code: '',
    role: 'primary_surgeon' as const,
    notes: '',
    requirement_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      loadRequirements();
      loadResidentCases();
    }
  }, [selectedSpecialty]);

  const loadSpecialties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('surgical_specialties')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading specialties:', error);
        setError('Failed to load specialties. Please try refreshing the page.');
        return;
      }

      setSpecialties(data || []);
      if (data && data.length > 0) {
        setSelectedSpecialty(data[0].id);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRequirements = async () => {
    if (!selectedSpecialty) return;

    const { data, error } = await supabase
      .from('case_requirements')
      .select('*')
      .eq('specialty_id', selectedSpecialty)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error loading requirements:', error);
      return;
    }

    setRequirements(data || []);
  };

  const loadResidentCases = async () => {
    if (!selectedSpecialty || !user) return;

    const { data, error } = await supabase
      .from('resident_cases')
      .select('*')
      .eq('user_id', user.id)
      .eq('specialty_id', selectedSpecialty)
      .order('case_date', { ascending: false });

    if (error) {
      console.error('Error loading resident cases:', error);
      return;
    }

    setResidentCases((data || []).map(case_ => ({
      ...case_,
      role: case_.role as 'primary_surgeon' | 'first_assist' | 'observer'
    })));
  };

  const addCase = async () => {
    if (!user || !selectedSpecialty) return;

    const { error } = await supabase
      .from('resident_cases')
      .insert([{
        user_id: user.id,
        specialty_id: selectedSpecialty,
        case_date: format(newCase.case_date, 'yyyy-MM-dd'),
        case_name: newCase.case_name,
        primary_cpt_code: newCase.primary_cpt_code,
        role: newCase.role,
        notes: newCase.notes,
        requirement_id: newCase.requirement_id || null
      }]);

    if (error) {
      console.error('Error adding case:', error);
      toast({
        title: "Error",
        description: "Failed to add case. Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Case Added",
      description: "Case successfully added to your tracker.",
    });

    setNewCase({
      case_date: new Date(),
      case_name: '',
      primary_cpt_code: '',
      role: 'primary_surgeon',
      notes: '',
      requirement_id: ''
    });
    setIsAddingCase(false);
    loadResidentCases();
  };

  const deleteCase = async (caseId: string) => {
    const { error } = await supabase
      .from('resident_cases')
      .delete()
      .eq('id', caseId);

    if (error) {
      console.error('Error deleting case:', error);
      toast({
        title: "Error",
        description: "Failed to delete case.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Case Deleted",
      description: "Case removed from your tracker.",
    });
    loadResidentCases();
  };

  const calculateProgress = (requirement: CaseRequirement) => {
    const relevantCases = residentCases.filter(case_ => 
      requirement.cpt_codes.includes(case_.primary_cpt_code) ||
      case_.requirement_id === requirement.id
    );
    return {
      current: relevantCases.length,
      required: requirement.min_required,
      percentage: Math.min((relevantCases.length / requirement.min_required) * 100, 100)
    };
  };

  const generateReport = () => {
    // This would generate a PDF report
    toast({
      title: "Report Generated",
      description: "Case log report is being prepared for download.",
    });
  };

  const generateACGMEData = async () => {
    if (!selectedSpecialty) return;
    
    const selectedSpec = specialties.find(s => s.id === selectedSpecialty);
    if (!selectedSpec) return;

    setIsGeneratingData(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('gather-acgme-data', {
        body: {
          specialty_id: selectedSpecialty,
          specialty_name: selectedSpec.name
        }
      });

      if (error) {
        console.error('Error generating ACGME data:', error);
        toast({
          title: "Error",
          description: "Failed to generate ACGME data. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "ACGME Data Generated",
        description: `Generated ${data.requirements_generated} case requirements using AI. Please review for accuracy.`,
      });

      // Reload requirements to show new data
      loadRequirements();

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while generating data.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingData(false);
    }
  };

  const submitFeedback = async () => {
    if (!user || !selectedRequirement) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      const suggestedValue = {
        min_required: feedbackForm.suggested_min ? parseInt(feedbackForm.suggested_min) : selectedRequirement.min_required,
        max_allowed: feedbackForm.suggested_max ? parseInt(feedbackForm.suggested_max) : selectedRequirement.max_allowed,
        description: feedbackForm.suggested_description || selectedRequirement.description,
        cpt_codes: feedbackForm.suggested_cpt_codes ? feedbackForm.suggested_cpt_codes.split(',').map(c => c.trim()) : selectedRequirement.cpt_codes
      };

      const { data, error } = await supabase.functions.invoke('submit-requirement-feedback', {
        body: {
          requirement_id: selectedRequirement.id,
          feedback_type: feedbackForm.type,
          original_value: {
            min_required: selectedRequirement.min_required,
            max_allowed: selectedRequirement.max_allowed,
            description: selectedRequirement.description,
            cpt_codes: selectedRequirement.cpt_codes
          },
          suggested_value: suggestedValue,
          description: feedbackForm.description
        }
      });

      if (error) {
        console.error('Error submitting feedback:', error);
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping improve ACGME data accuracy!",
      });

      // Reset form and close dialog
      setFeedbackForm({
        type: 'correction',
        description: '',
        suggested_min: '',
        suggested_max: '',
        suggested_description: '',
        suggested_cpt_codes: ''
      });
      setIsFeedbackDialogOpen(false);
      setSelectedRequirement(null);

      // Reload requirements to show updated feedback count
      loadRequirements();

    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred while submitting feedback.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resident tracker...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resident & Fellow Case Tracker</h1>
          <p className="text-muted-foreground">
            Track your surgical cases and monitor progress toward specialty requirements
            {!user && (
              <span className="block text-sm text-orange-600 mt-1">
                Note: Sign in to save and track your cases permanently
              </span>
            )}
          </p>
        </div>
        <Button onClick={generateReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Specialty Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <Label htmlFor="specialty">Select Specialty</Label>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your specialty" />
            </SelectTrigger>
            <SelectContent>
              {specialties.map((specialty) => (
                <SelectItem key={specialty.id} value={specialty.id}>
                  {specialty.name} ({specialty.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Requirements Progress */}
      {selectedSpecialty && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Case Requirements Progress</h2>
            <div className="flex gap-2">
              <Button 
                onClick={generateACGMEData} 
                disabled={isGeneratingData}
                variant="outline"
              >
                {isGeneratingData ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                {isGeneratingData ? 'Generating...' : 'Generate ACGME Data'}
              </Button>
            </div>
          </div>

          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Requirements Found</h3>
              <p className="text-muted-foreground mb-4">
                Use AI to generate ACGME case requirements for this specialty
              </p>
              <Button onClick={generateACGMEData} disabled={isGeneratingData}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate ACGME Data
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((requirement) => {
                const progress = calculateProgress(requirement);
                return (
                  <div key={requirement.id} className="p-4 border rounded-lg relative">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{requirement.category}</h3>
                            {requirement.ai_generated && (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Generated
                              </Badge>
                            )}
                            {requirement.needs_review && (
                              <Badge variant="outline" className="text-xs bg-yellow-50">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Needs Review
                              </Badge>
                            )}
                          </div>
                          {requirement.subcategory && (
                            <p className="text-sm text-muted-foreground">
                              {requirement.subcategory}
                            </p>
                          )}
                          {requirement.confidence_level && (
                            <p className="text-xs text-muted-foreground">
                              Confidence: {Math.round(requirement.confidence_level * 100)}%
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={progress.current >= progress.required ? 'default' : 'secondary'}
                          >
                            {progress.current}/{progress.required}
                          </Badge>
                          {user && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequirement(requirement);
                                setFeedbackForm({
                                  type: 'correction',
                                  description: '',
                                  suggested_min: requirement.min_required.toString(),
                                  suggested_max: requirement.max_allowed?.toString() || '',
                                  suggested_description: requirement.description,
                                  suggested_cpt_codes: requirement.cpt_codes.join(', ')
                                });
                                setIsFeedbackDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Progress value={progress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {requirement.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {requirement.cpt_codes.map((code) => (
                          <Badge key={code} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                      </div>
                      {requirement.user_feedback_count && requirement.user_feedback_count > 0 && (
                        <p className="text-xs text-blue-600">
                          {requirement.user_feedback_count} user feedback(s) submitted
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Cases List */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Cases</h2>
          <Dialog open={isAddingCase} onOpenChange={setIsAddingCase}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Case Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newCase.case_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newCase.case_date ? format(newCase.case_date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newCase.case_date}
                        onSelect={(date) => setNewCase({ ...newCase, case_date: date || new Date() })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Case Name</Label>
                  <Input
                    value={newCase.case_name}
                    onChange={(e) => setNewCase({ ...newCase, case_name: e.target.value })}
                    placeholder="e.g., Laparoscopic Cholecystectomy"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary CPT Code</Label>
                  <Input
                    value={newCase.primary_cpt_code}
                    onChange={(e) => setNewCase({ ...newCase, primary_cpt_code: e.target.value })}
                    placeholder="e.g., 47562"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Your Role</Label>
                  <Select value={newCase.role} onValueChange={(value: any) => setNewCase({ ...newCase, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary_surgeon">Primary Surgeon</SelectItem>
                      <SelectItem value="first_assist">First Assist</SelectItem>
                      <SelectItem value="observer">Observer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Requirement Category (Optional)</Label>
                  <Select value={newCase.requirement_id} onValueChange={(value) => setNewCase({ ...newCase, requirement_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      {requirements.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.category} - {req.subcategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={newCase.notes}
                    onChange={(e) => setNewCase({ ...newCase, notes: e.target.value })}
                    placeholder="Additional notes about the case..."
                  />
                </div>

                <Button onClick={addCase} className="w-full">
                  Add Case
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {residentCases.map((case_) => (
            <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{case_.case_name}</h3>
                  <Badge variant="outline" className="font-mono">
                    {case_.primary_cpt_code}
                  </Badge>
                  <Badge variant={case_.role === 'primary_surgeon' ? 'default' : 'secondary'}>
                    {case_.role.replace('_', ' ')}
                  </Badge>
                  {case_.verified && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(case_.case_date), 'PPP')}
                  {case_.notes && (
                    <p className="mt-1">{case_.notes}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteCase(case_.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Feedback for ACGME Requirement</DialogTitle>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Help improve ACGME data accuracy by providing feedback on this requirement: 
                  <strong> {selectedRequirement.category}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Feedback Type</Label>
                <Select 
                  value={feedbackForm.type} 
                  onValueChange={(value: any) => setFeedbackForm({ ...feedbackForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="correction">Correction - Fix incorrect data</SelectItem>
                    <SelectItem value="verification">Verification - Confirm accuracy</SelectItem>
                    <SelectItem value="addition">Addition - Add missing information</SelectItem>
                    <SelectItem value="deletion">Deletion - Remove incorrect requirement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Cases Required</Label>
                  <Input
                    type="number"
                    value={feedbackForm.suggested_min}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, suggested_min: e.target.value })}
                    placeholder="e.g., 200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Cases (Optional)</Label>
                  <Input
                    type="number"
                    value={feedbackForm.suggested_max}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, suggested_max: e.target.value })}
                    placeholder="e.g., 300"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={feedbackForm.suggested_description}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, suggested_description: e.target.value })}
                  placeholder="Describe the requirement..."
                />
              </div>

              <div className="space-y-2">
                <Label>CPT Codes (comma-separated)</Label>
                <Input
                  value={feedbackForm.suggested_cpt_codes}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, suggested_cpt_codes: e.target.value })}
                  placeholder="e.g., 47562, 47563, 44970"
                />
              </div>

              <div className="space-y-2">
                <Label>Feedback Description</Label>
                <Textarea
                  value={feedbackForm.description}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, description: e.target.value })}
                  placeholder="Explain your feedback and provide sources if possible..."
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsFeedbackDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitFeedback}
                  disabled={!feedbackForm.description.trim()}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResidentTracker;