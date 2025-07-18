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
import { CalendarIcon, Download, Plus, Trash2, CheckCircle, Clock, User } from 'lucide-react';
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
    const { data, error } = await supabase
      .from('surgical_specialties')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading specialties:', error);
      return;
    }

    setSpecialties(data || []);
    if (data && data.length > 0) {
      setSelectedSpecialty(data[0].id);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resident & Fellow Case Tracker</h1>
          <p className="text-muted-foreground">
            Track your surgical cases and monitor progress toward specialty requirements
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
          <h2 className="text-xl font-semibold mb-4">Case Requirements Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((requirement) => {
              const progress = calculateProgress(requirement);
              return (
                <div key={requirement.id} className="p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{requirement.category}</h3>
                        {requirement.subcategory && (
                          <p className="text-sm text-muted-foreground">
                            {requirement.subcategory}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={progress.current >= progress.required ? 'default' : 'secondary'}
                      >
                        {progress.current}/{progress.required}
                      </Badge>
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
                  </div>
                </div>
              );
            })}
          </div>
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
    </div>
  );
};

export default ResidentTracker;