import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Calendar, Image, FileText, Users, Trophy, Save, Edit, Plus, Minus } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import WallpaperGenerator from "@/components/WallpaperGenerator";
import TopCodesWallpaper from "@/components/TopCodesWallpaper";
import ScheduleCalendar from "@/components/ScheduleCalendar";
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

interface ParsedSchedule {
  cases: SurgicalCase[];
  summary: {
    totalCases: number;
    uniqueCPTCodes: string[];
    totalRVU?: number;
  };
}

const CameraSchedule = () => {
  const [extractedText, setExtractedText] = useState<string>("");
  const [parsedSchedule, setParsedSchedule] = useState<ParsedSchedule | null>(null);
  const [isParsingSchedule, setIsParsingSchedule] = useState(false);
  const [isSavingCases, setIsSavingCases] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [hasParsingError, setHasParsingError] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("capture");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageCaptured = async (imageData: string, text: string) => {
    setIsProcessingPhoto(true);
    setCapturedImage(imageData);
    setExtractedText(text);
    setHasParsingError(false);
    
    toast({
      title: "Processing Photo",
      description: "Extracting cases and applying CPT codes...",
    });
    
    if (text.trim()) {
      await parseScheduleWithCodes(text);
    }
    
    setIsProcessingPhoto(false);
  };

  const parseScheduleWithCodes = async (text: string) => {
    try {
      setIsParsingSchedule(true);
      setHasParsingError(false);
      
      // First parse the schedule structure
      const { data, error } = await supabase.functions.invoke('parse-surgery-schedule', {
        body: { extractedText: text }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Then automatically get the primary CPT code for each case
      const casesWithCodes = await Promise.all(
        data.cases.map(async (case_: SurgicalCase) => {
          try {
            console.log(`Getting CPT codes for procedure: ${case_.procedure}`);
            const { data: codeData, error: codeError } = await supabase.functions.invoke('search-cpt-codes', {
              body: { procedureDescription: case_.procedure }
            });

            console.log(`CPT code response for "${case_.procedure}":`, { codeData, codeError });

            if (!codeError && codeData?.primaryCodes?.length > 0) {
              // Take only the most relevant primary code (highest RVU)
              const primaryCode = codeData.primaryCodes[0];
              const relevantCode = {
                code: primaryCode.code,
                description: primaryCode.description,
                rvu: primaryCode.rvu || 0
              };
              
              return {
                ...case_,
                cptCodes: [relevantCode], // Only one primary code
                selected: true
              };
            }
            
            return { ...case_, selected: true };
          } catch (codeError) {
            console.warn(`Failed to get CPT codes for: ${case_.procedure}`, codeError);
            return { ...case_, selected: true };
          }
        })
      );

      const enhancedData = {
        ...data,
        cases: casesWithCodes,
        summary: {
          ...data.summary,
          totalRVU: casesWithCodes.reduce((total, case_) => {
            const caseRVU = case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0;
            return total + caseRVU;
          }, 0)
        }
      };

      setParsedSchedule(enhancedData);
      
      // Automatically switch to Cases tab after processing
      setActiveTab("parsed");
      
      toast({
        title: "Schedule processed successfully",
        description: `Found ${enhancedData.cases?.length || 0} cases with CPT codes automatically applied`,
      });
    } catch (error) {
      console.error("Error parsing schedule:", error);
      setHasParsingError(true);
      toast({
        title: "Error",
        description: "Failed to parse the surgery schedule. Check the extracted text for issues.",
        variant: "destructive",
      });
    } finally {
      setIsParsingSchedule(false);
    }
  };

  const parseSchedule = async (text: string) => {
    await parseScheduleWithCodes(text);
  };

  const getAllCPTCodes = (): CPTCode[] => {
    if (!parsedSchedule) return [];
    
    const allCodes: CPTCode[] = [];
    parsedSchedule.cases.forEach(case_ => {
      case_.cptCodes.forEach(code => {
        // Avoid duplicates
        if (!allCodes.find(c => c.code === code.code)) {
          allCodes.push(code);
        }
      });
    });
    return allCodes;
  };

  const toggleCaseSelection = (index: number) => {
    if (!parsedSchedule) return;
    
    const updatedCases = [...parsedSchedule.cases];
    updatedCases[index].selected = !updatedCases[index].selected;
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases
    });
  };

  const toggleAllCases = () => {
    if (!parsedSchedule) return;
    
    const allSelected = parsedSchedule.cases.every(c => c.selected);
    const updatedCases = parsedSchedule.cases.map(c => ({ ...c, selected: !allSelected }));
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases
    });
  };

  const addCPTCode = (caseIndex: number) => {
    if (!parsedSchedule) return;
    
    const updatedCases = [...parsedSchedule.cases];
    updatedCases[caseIndex].cptCodes.push({
      code: "",
      description: "",
      rvu: 0
    });
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases
    });
  };

  const removeCPTCode = (caseIndex: number, codeIndex: number) => {
    if (!parsedSchedule) return;
    
    const updatedCases = [...parsedSchedule.cases];
    updatedCases[caseIndex].cptCodes.splice(codeIndex, 1);
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases
    });
  };

  const updateCPTCode = (caseIndex: number, codeIndex: number, field: string, value: string | number) => {
    if (!parsedSchedule) return;
    
    const updatedCases = [...parsedSchedule.cases];
    updatedCases[caseIndex].cptCodes[codeIndex] = {
      ...updatedCases[caseIndex].cptCodes[codeIndex],
      [field]: value
    };
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases
    });
  };

  const saveCasesToCalendar = async (selectedOnly: boolean = true) => {
    if (!parsedSchedule) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save cases to your calendar",
        variant: "destructive",
      });
      return;
    }

    const casesToSave = selectedOnly 
      ? parsedSchedule.cases.filter(c => c.selected)
      : parsedSchedule.cases;

    if (casesToSave.length === 0) {
      toast({
        title: "No Cases Selected",
        description: "Please select at least one case to save",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingCases(true);
      
      for (const case_ of casesToSave) {
        // Create the case
        const { data: newCase, error: caseError } = await supabase
          .from('cases')
          .insert({
            user_id: user.id,
            case_name: case_.procedure,
            procedure_description: case_.procedure,
            procedure_date: case_.date ? `${case_.date}T${case_.time || '00:00'}:00` : null,
            notes: `Imported from schedule scan. Surgeon: ${case_.surgeon || 'N/A'}`,
            status: 'scheduled'
          })
          .select()
          .single();

        if (caseError) throw caseError;

        // Add CPT codes for the case
        if (case_.cptCodes && case_.cptCodes.length > 0) {
          const codeInserts = case_.cptCodes.map((code, index) => ({
            user_id: user.id,
            case_id: newCase.id,
            cpt_code: code.code,
            description: code.description,
            rvu: code.rvu || 0,
            is_primary: index === 0,
            position: index + 1
          }));

          const { error: codesError } = await supabase
            .from('case_codes')
            .insert(codeInserts);

          if (codesError) throw codesError;
        }
      }

      toast({
        title: "Cases saved successfully",
        description: `${casesToSave.length} cases added to your calendar`,
      });

      // Clear the parsed schedule after saving
      setParsedSchedule(null);
      setExtractedText("");
      setCapturedImage(null);

    } catch (error) {
      console.error('Error saving cases:', error);
      toast({
        title: "Error",
        description: "Failed to save cases to calendar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCases(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Camera className="w-8 h-8" />
          Surgery Schedule Scanner
        </h1>
        <p className="text-muted-foreground">
          Capture surgery schedules and generate medical reference wallpapers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full ${hasParsingError ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Capture
          </TabsTrigger>
          {hasParsingError && (
            <TabsTrigger value="extracted" className="flex items-center gap-2 text-destructive">
              <FileText className="w-4 h-4" />
              Text (Error)
            </TabsTrigger>
          )}
          <TabsTrigger value="parsed" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="wallpaper" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-4">
          {isProcessingPhoto && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Processing photo and applying CPT codes...</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          <CameraCapture 
            onImageCaptured={handleImageCaptured}
            title="Capture Surgery Schedule"
            description="Take a photo of your surgery schedule to extract cases and CPT codes"
          />
          
          {capturedImage && (
            <Card>
              <CardHeader>
                <CardTitle>Captured Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img 
                  src={capturedImage} 
                  alt="Captured schedule" 
                  className="w-full max-w-2xl mx-auto rounded-lg border"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {hasParsingError && (
          <TabsContent value="extracted" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Extracted Text (Parsing Failed)</CardTitle>
              </CardHeader>
              <CardContent>
                {extractedText ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive mb-2">
                        ⚠️ There was an error parsing this text. Please review and try again.
                      </p>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                      {extractedText}
                    </pre>
                    <Button 
                      onClick={() => parseScheduleWithCodes(extractedText)}
                      disabled={isParsingSchedule}
                    >
                      {isParsingSchedule ? "Parsing..." : "Re-parse Schedule"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No text extracted yet. Please capture an image first.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="parsed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Parsed Surgery Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parsedSchedule ? (
                  <div className="space-y-6">
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

                   <div className="space-y-4">
                     <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                         <Checkbox
                           id="select-all"
                           checked={parsedSchedule.cases.every(c => c.selected)}
                           onCheckedChange={toggleAllCases}
                         />
                         <Label htmlFor="select-all" className="text-sm text-muted-foreground">
                           Select All Cases ({parsedSchedule.cases.filter(c => c.selected).length} selected)
                         </Label>
                       </div>
                       <div className="flex gap-2">
                         <Button 
                           onClick={() => saveCasesToCalendar(true)}
                           disabled={isSavingCases || !user || !parsedSchedule.cases.some(c => c.selected)}
                           className="flex items-center gap-2"
                           variant="default"
                           size="sm"
                         >
                           <Save className="w-4 h-4" />
                           {isSavingCases ? "Saving..." : "Save Selected"}
                         </Button>
                         <Button 
                           onClick={() => saveCasesToCalendar(false)}
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
                                    onCheckedChange={() => toggleCaseSelection(index)}
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
                              </div>
                              
                              {/* CPT Codes Section */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-primary" />
                                    CPT Codes & RVUs
                                  </Label>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addCPTCode(index)}
                                    className="h-7 px-2"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Code
                                  </Button>
                                </div>
                                
                                {case_.cptCodes && case_.cptCodes.length > 0 ? (
                                  <div className="space-y-2">
                                    {case_.cptCodes.map((code, codeIndex) => (
                                      <div key={codeIndex} className="p-3 border rounded-lg bg-muted/50">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant={codeIndex === 0 ? "default" : "secondary"} className="text-xs">
                                            {codeIndex === 0 ? "PRIMARY" : "SECONDARY"}
                                          </Badge>
                                          <div className="text-sm font-medium text-primary">
                                            RVU: {code.rvu || 0}
                                          </div>
                                          <div className="ml-auto">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => removeCPTCode(index, codeIndex)}
                                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <Input
                                            placeholder="CPT Code"
                                            value={code.code}
                                            onChange={(e) => updateCPTCode(index, codeIndex, 'code', e.target.value)}
                                            className="h-8 font-mono"
                                          />
                                          <Input
                                            placeholder="Description"
                                            value={code.description}
                                            onChange={(e) => updateCPTCode(index, codeIndex, 'description', e.target.value)}
                                            className="h-8 md:col-span-2"
                                          />
                                        </div>
                                        <div className="mt-2">
                                          <Input
                                            type="number"
                                            step="0.1"
                                            placeholder="RVU Value"
                                            value={code.rvu || 0}
                                            onChange={(e) => updateCPTCode(index, codeIndex, 'rvu', parseFloat(e.target.value) || 0)}
                                            className="h-8 w-24"
                                          />
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Case Total */}
                                    <div className="flex justify-between items-center p-2 bg-primary/10 rounded-lg border border-primary/20">
                                      <span className="text-sm font-medium text-primary">Case Total RVU:</span>
                                      <span className="text-lg font-bold text-primary">
                                        {case_.cptCodes.reduce((sum, code) => sum + (code.rvu || 0), 0).toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                                    <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm mb-2">No CPT codes identified for this procedure</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addCPTCode(index)}
                                    >
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add CPT Code
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Enhanced Add to Calendar Section */}
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
                            <div className="text-2xl font-bold text-primary">
                              {parsedSchedule.cases.filter(c => c.selected).length}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Selected Cases</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">
                              {parsedSchedule.cases
                                .filter(c => c.selected)
                                .reduce((total, case_) => total + (case_.cptCodes?.length || 0), 0)}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Total Codes</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">
                              {parsedSchedule.cases
                                .filter(c => c.selected)
                                .reduce((total, case_) => 
                                  total + (case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0), 0
                                ).toFixed(1)}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Total RVU</div>
                          </div>
                          <div className="text-center p-4 bg-white/50 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">
                              ${(parsedSchedule.cases
                                .filter(c => c.selected)
                                .reduce((total, case_) => 
                                  total + (case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0), 0
                                ) * 65).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">Est. Value</div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button 
                            onClick={() => saveCasesToCalendar(true)}
                            disabled={isSavingCases || !user || !parsedSchedule.cases.some(c => c.selected)}
                            className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-8 py-3"
                            size="lg"
                          >
                            <Save className="w-5 h-5" />
                            {isSavingCases ? "Adding to Calendar..." : "Add Selected to Calendar"}
                          </Button>
                          <Button 
                            onClick={() => saveCasesToCalendar(false)}
                            disabled={isSavingCases || !user}
                            variant="outline"
                            size="lg"
                            className="px-8 py-3"
                          >
                            <Save className="w-5 h-5 mr-2" />
                            Add All Cases
                          </Button>
                        </div>
                        
                        {parsedSchedule.cases.filter(c => c.selected).length === 0 && (
                          <div className="text-center mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Please select at least one case to add to your calendar
                            </p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No cases parsed yet. Please capture and parse a schedule first.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallpaper" className="space-y-4">
          {parsedSchedule && getAllCPTCodes().length > 0 ? (
            <WallpaperGenerator 
              cptCodes={getAllCPTCodes()}
              surgeonName={parsedSchedule.cases[0]?.surgeon?.replace('Dr. ', '') || ''}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No CPT codes available for wallpaper generation. Please capture and parse a schedule first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {user ? (
            <ScheduleCalendar 
              selectedDate={selectedCalendarDate}
              onDateSelect={setSelectedCalendarDate}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  Please sign in to view your surgery calendar.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default CameraSchedule;