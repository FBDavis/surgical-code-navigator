import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Calendar, Image, FileText } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import WallpaperGenerator from "@/components/WallpaperGenerator";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ExtractedTextViewer from "@/components/schedule/ExtractedTextViewer";
import ParsedCasesList from "@/components/schedule/ParsedCasesList";
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
    
    try {
      if (text.trim()) {
        await parseScheduleWithCodes(text);
      }
    } finally {
      setIsProcessingPhoto(false);
    }
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

  const updateCase = (index: number, updatedCase: SurgicalCase) => {
    if (!parsedSchedule) return;
    
    const updatedCases = [...parsedSchedule.cases];
    updatedCases[index] = updatedCase;
    
    // Recalculate total RVU
    const totalRVU = updatedCases.reduce((total, case_) => {
      const caseRVU = case_.cptCodes?.reduce((sum, code) => sum + (code.rvu || 0), 0) || 0;
      return total + caseRVU;
    }, 0);
    
    setParsedSchedule({
      ...parsedSchedule,
      cases: updatedCases,
      summary: {
        ...parsedSchedule.summary,
        totalRVU
      }
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
            <ExtractedTextViewer
              extractedText={extractedText}
              isParsingSchedule={isParsingSchedule}
              hasParsingError={hasParsingError}
              onReparse={() => parseScheduleWithCodes(extractedText)}
            />
          </TabsContent>
        )}

        <TabsContent value="parsed" className="space-y-4">
          <ParsedCasesList
            parsedSchedule={parsedSchedule}
            isSavingCases={isSavingCases}
            user={user}
            onToggleCaseSelection={toggleCaseSelection}
            onToggleAllCases={toggleAllCases}
            onUpdateCase={updateCase}
            onSaveCases={saveCasesToCalendar}
          />
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