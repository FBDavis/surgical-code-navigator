import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar, Save, Edit, Trophy, Users } from "lucide-react";
import CaseEditor from "./CaseEditor";

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

interface ParsedSchedule {
  cases: SurgicalCase[];
  summary: {
    totalCases: number;
    uniqueCPTCodes: string[];
    totalRVU?: number;
  };
}

interface ParsedCasesListProps {
  parsedSchedule: ParsedSchedule | null;
  isSavingCases: boolean;
  user: any;
  onToggleCaseSelection: (index: number) => void;
  onToggleAllCases: () => void;
  onUpdateCase: (index: number, updatedCase: SurgicalCase) => void;
  onSaveCases: (selectedOnly: boolean) => void;
}

const ParsedCasesList = ({
  parsedSchedule,
  isSavingCases,
  user,
  onToggleCaseSelection,
  onToggleAllCases,
  onUpdateCase,
  onSaveCases
}: ParsedCasesListProps) => {
  if (!parsedSchedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Parsed Surgery Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No cases parsed yet. Please capture and parse a schedule first.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedCases = parsedSchedule.cases.filter(c => c.selected);
  const allSelected = parsedSchedule.cases.every(c => c.selected);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Parsed Surgery Cases
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{parsedSchedule.summary.totalCases}</div>
              <div className="text-sm text-muted-foreground">Total Cases</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {parsedSchedule.cases.reduce((total, case_) => total + (case_.cptCodes?.length || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total CPT Codes</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {parsedSchedule.summary.totalRVU?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Total RVU</div>
            </div>
          </div>

          {/* Case Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={onToggleAllCases}
              />
              <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                Select All Cases ({selectedCases.length} selected)
              </Label>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => onSaveCases(true)}
                disabled={isSavingCases || !user || selectedCases.length === 0}
                className="flex items-center gap-2"
                variant="default"
                size="sm"
              >
                <Save className="w-4 h-4" />
                {isSavingCases ? "Saving..." : "Save Selected"}
              </Button>
              <Button 
                onClick={() => onSaveCases(false)}
                disabled={isSavingCases || !user}
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
                <Save className="w-4 h-4" />
                Save All
              </Button>
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-4">
            {parsedSchedule.cases.map((case_, index) => (
              <Card key={index} className={`relative border transition-all duration-200 ${
                case_.selected 
                  ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              }`}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Case Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={case_.selected}
                          onCheckedChange={() => onToggleCaseSelection(index)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              Case {index + 1}
                            </Badge>
                            {case_.selected && (
                              <Badge variant="default" className="text-xs bg-primary">
                                Selected
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-lg text-foreground leading-tight mb-2">
                            {case_.procedure}
                          </h4>
                          <div className="space-y-1">
                            {case_.patientIdentifier && (
                              <p className="text-sm text-muted-foreground">
                                Patient: {case_.patientIdentifier}
                              </p>
                            )}
                            {case_.surgeon && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                Surgeon: {case_.surgeon}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {case_.date && (
                            <Badge variant="secondary" className="mb-1">
                              {case_.date}
                            </Badge>
                          )}
                          {case_.time && (
                            <div>
                              <Badge variant="secondary">
                                {case_.time}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CaseEditor
                          case_={case_}
                          caseIndex={index}
                          onUpdate={(updatedCase) => onUpdateCase(index, updatedCase)}
                          trigger={
                            <Button variant="outline" size="sm" className="h-8">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          }
                        />
                      </div>
                    </div>
                    
                    {/* CPT Codes Summary */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">CPT Codes</span>
                      </div>
                      {case_.cptCodes && case_.cptCodes.length > 0 ? (
                        <div className="space-y-2">
                          {case_.cptCodes.map((code, codeIndex) => (
                            <div key={codeIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                              <div className="flex items-center gap-2">
                                <Badge variant={codeIndex === 0 ? "default" : "secondary"} className="text-xs">
                                  {codeIndex === 0 ? "PRIMARY" : "SECONDARY"}
                                </Badge>
                                <span className="font-mono text-sm">{code.code}</span>
                                <span className="text-sm text-muted-foreground">{code.description}</span>
                              </div>
                              <div className="text-sm font-medium text-primary">
                                RVU: {code.rvu || 0}
                              </div>
                            </div>
                          ))}
                          <div className="flex justify-between items-center p-2 bg-primary/10 rounded border border-primary/20">
                            <span className="text-sm font-medium text-primary">Case Total RVU:</span>
                            <span className="text-lg font-bold text-primary">
                              {case_.cptCodes.reduce((sum, code) => sum + (code.rvu || 0), 0).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 border-2 border-dashed rounded text-center text-muted-foreground">
                          <p className="text-sm">No CPT codes identified for this procedure</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save to Calendar Summary */}
          {selectedCases.length > 0 && (
            <div className="mt-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-primary mb-2">Ready to Add to Calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Review your selected cases and add them to your surgery calendar
                </p>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-white/50 rounded-lg border">
                  <div className="text-2xl font-bold text-primary">{selectedCases.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">Selected Cases</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg border">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCases.reduce((total, case_) => total + (case_.cptCodes?.length || 0), 0)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Total Codes</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg border">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCases.reduce((total, case_) => 
                      total + (case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0), 0
                    ).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Total RVU</div>
                </div>
                <div className="text-center p-4 bg-white/50 rounded-lg border">
                  <div className="text-2xl font-bold text-primary">
                    ${(selectedCases.reduce((total, case_) => 
                      total + (case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0), 0
                    ) * 65).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Est. Value</div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => onSaveCases(true)}
                  disabled={isSavingCases || !user}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-8 py-3"
                  size="lg"
                >
                  <Save className="w-5 h-5" />
                  {isSavingCases ? "Adding to Calendar..." : "Add Selected to Calendar"}
                </Button>
                <Button 
                  onClick={() => onSaveCases(false)}
                  disabled={isSavingCases || !user}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Add All Cases
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParsedCasesList;