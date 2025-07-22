import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Plus, Minus, Save, Trophy, Users, Calendar, Clock, Check, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CPTCode {
  code: string;
  description: string;
  rvu?: number;
}

interface SurgicalCase {
  patientIdentifier?: string;
  procedure: string;
  cptCodes: CPTCode[];
  surgeon?: string;
  date?: string;
  time?: string;
  selected?: boolean;
}

interface CaseEditorProps {
  case_: SurgicalCase;
  caseIndex: number;
  onUpdate: (updatedCase: SurgicalCase) => void;
  trigger?: React.ReactNode;
}

const CaseEditor = ({ case_, caseIndex, onUpdate, trigger }: CaseEditorProps) => {
  const [editingCase, setEditingCase] = useState<SurgicalCase>(case_);
  const [isOpen, setIsOpen] = useState(false);
  const [isCompletingCase, setIsCompletingCase] = useState(false);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = () => {
    onUpdate(editingCase);
    setIsOpen(false);
  };

  const handleCompleteCase = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete cases.",
        variant: "destructive",
      });
      return;
    }

    if (!editingCase.procedure || editingCase.cptCodes.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add a procedure description and at least one CPT code.",
        variant: "destructive",
      });
      return;
    }

    setIsCompletingCase(true);
    try {
      // Create the case in the database
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          case_name: editingCase.procedure,
          procedure_description: editingCase.procedure,
          patient_mrn: editingCase.patientIdentifier,
          procedure_date: editingCase.date,
          total_rvu: totalRVU,
          estimated_value: totalRVU * 65, // Default RVU rate
          status: 'active',
          user_id: user.id
        })
        .select()
        .single();

      if (caseError) throw caseError;

      // Add CPT codes
      const codeInserts = editingCase.cptCodes.map((code, index) => ({
        case_id: newCase.id,
        cpt_code: code.code,
        description: code.description,
        rvu: code.rvu || 0,
        is_primary: index === 0,
        position: index + 1,
        user_id: user.id
      }));

      const { error: codesError } = await supabase
        .from('case_codes')
        .insert(codeInserts);

      if (codesError) throw codesError;

      toast({
        title: "Case Completed",
        description: "Case has been successfully added to your database.",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error completing case:', error);
      toast({
        title: "Error",
        description: "Failed to complete case. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompletingCase(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!editingCase.date) {
      toast({
        title: "Missing Date",
        description: "Please select a date before adding to calendar.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCalendar(true);
    try {
      // Here you would integrate with calendar functionality
      // For now, we'll just show a success message
      toast({
        title: "Added to Calendar",
        description: "Case has been added to your calendar as an add-on case.",
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast({
        title: "Error",
        description: "Failed to add case to calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCalendar(false);
    }
  };

  const addCPTCode = () => {
    setEditingCase({
      ...editingCase,
      cptCodes: [...editingCase.cptCodes, { code: "", description: "", rvu: 0 }]
    });
  };

  const removeCPTCode = (codeIndex: number) => {
    const updatedCodes = [...editingCase.cptCodes];
    updatedCodes.splice(codeIndex, 1);
    setEditingCase({
      ...editingCase,
      cptCodes: updatedCodes
    });
  };

  const updateCPTCode = (codeIndex: number, field: keyof CPTCode, value: string | number) => {
    const updatedCodes = [...editingCase.cptCodes];
    updatedCodes[codeIndex] = {
      ...updatedCodes[codeIndex],
      [field]: value
    };
    setEditingCase({
      ...editingCase,
      cptCodes: updatedCodes
    });
  };

  const updateCaseField = (field: keyof SurgicalCase, value: string) => {
    setEditingCase({
      ...editingCase,
      [field]: value
    });
  };

  const totalRVU = editingCase.cptCodes.reduce((sum, code) => sum + (code.rvu || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8">
            <Edit className="w-4 h-4 mr-1" />
            Edit Case
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Case {caseIndex + 1}: {editingCase.procedure}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Case Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="procedure">Procedure Description</Label>
                  <Textarea
                    id="procedure"
                    value={editingCase.procedure}
                    onChange={(e) => updateCaseField('procedure', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="patient">Patient Identifier</Label>
                    <Input
                      id="patient"
                      value={editingCase.patientIdentifier || ''}
                      onChange={(e) => updateCaseField('patientIdentifier', e.target.value)}
                      placeholder="Patient ID or Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="surgeon">Surgeon</Label>
                    <Input
                      id="surgeon"
                      value={editingCase.surgeon || ''}
                      onChange={(e) => updateCaseField('surgeon', e.target.value)}
                      placeholder="Surgeon name"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingCase.date || ''}
                    onChange={(e) => updateCaseField('date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="time" className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={editingCase.time || ''}
                    onChange={(e) => updateCaseField('time', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CPT Codes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  CPT Codes & RVUs
                </CardTitle>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total RVU</div>
                    <div className="text-2xl font-bold text-primary">{totalRVU.toFixed(1)}</div>
                  </div>
                  <Button onClick={addCPTCode} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Code
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingCase.cptCodes.length > 0 ? (
                <div className="space-y-4">
                  {editingCase.cptCodes.map((code, codeIndex) => (
                    <div key={codeIndex} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={codeIndex === 0 ? "default" : "secondary"}>
                          {codeIndex === 0 ? "PRIMARY" : "SECONDARY"}
                        </Badge>
                        <div className="text-sm font-medium text-primary">
                          RVU: {code.rvu || 0}
                        </div>
                        <div className="ml-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeCPTCode(codeIndex)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`code-${codeIndex}`}>CPT Code</Label>
                          <Input
                            id={`code-${codeIndex}`}
                            placeholder="CPT Code"
                            value={code.code}
                            onChange={(e) => updateCPTCode(codeIndex, 'code', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor={`desc-${codeIndex}`}>Description</Label>
                          <Input
                            id={`desc-${codeIndex}`}
                            placeholder="Procedure description"
                            value={code.description}
                            onChange={(e) => updateCPTCode(codeIndex, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <Label htmlFor={`rvu-${codeIndex}`}>RVU Value</Label>
                        <Input
                          id={`rvu-${codeIndex}`}
                          type="number"
                          step="0.1"
                          placeholder="RVU Value"
                          value={code.rvu || 0}
                          onChange={(e) => updateCPTCode(codeIndex, 'rvu', parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No CPT codes added yet</p>
                  <Button onClick={addCPTCode} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add First CPT Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAddToCalendar} 
              disabled={isAddingToCalendar}
              className="flex items-center gap-2"
            >
              {isAddingToCalendar ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
              {isAddingToCalendar ? "Adding..." : "Add to Calendar"}
            </Button>
            <Button onClick={handleSave} variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
            <Button 
              onClick={handleCompleteCase} 
              disabled={isCompletingCase}
              className="flex items-center gap-2"
            >
              {isCompletingCase ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isCompletingCase ? "Completing..." : "Complete Case"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CaseEditor;