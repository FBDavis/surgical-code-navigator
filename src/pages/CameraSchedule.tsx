import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Camera, Calendar, Image, FileText, Users, Trophy, Save } from "lucide-react";
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
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageCaptured = async (imageData: string, text: string) => {
    setCapturedImage(imageData);
    setExtractedText(text);
    
    if (text.trim()) {
      await parseSchedule(text);
    }
  };

  const parseSchedule = async (text: string) => {
    try {
      setIsParsingSchedule(true);
      
      const { data, error } = await supabase.functions.invoke('parse-surgery-schedule', {
        body: { extractedText: text }
      });

      if (error) {
        throw new Error(error.message);
      }

      setParsedSchedule(data);
      
      toast({
        title: "Schedule parsed successfully",
        description: `Found ${data.cases?.length || 0} cases with ${data.summary?.uniqueCPTCodes?.length || 0} unique CPT codes`,
      });
    } catch (error) {
      console.error("Error parsing schedule:", error);
      toast({
        title: "Error",
        description: "Failed to parse the surgery schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsParsingSchedule(false);
    }
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

  const saveCasesToCalendar = async () => {
    if (!parsedSchedule) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save cases to your calendar",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingCases(true);
      
      for (const case_ of parsedSchedule.cases) {
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
        description: `${parsedSchedule.cases.length} cases added to your calendar`,
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

      <Tabs defaultValue="capture" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Capture
          </TabsTrigger>
          <TabsTrigger value="extracted" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Text
          </TabsTrigger>
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
          <TabsTrigger value="topcodes" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Top Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="space-y-4">
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

        <TabsContent value="extracted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text</CardTitle>
            </CardHeader>
            <CardContent>
              {extractedText ? (
                <div className="space-y-4">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                    {extractedText}
                  </pre>
                  <Button 
                    onClick={() => parseSchedule(extractedText)}
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
                      <div className="text-2xl font-bold">{parsedSchedule.summary.uniqueCPTCodes.length}</div>
                      <div className="text-sm text-muted-foreground">Unique CPT Codes</div>
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
                      <div className="text-sm text-muted-foreground">
                        {user ? "Ready to save to your calendar" : "Sign in required to save cases"}
                      </div>
                      <Button 
                        onClick={saveCasesToCalendar}
                        disabled={isSavingCases || !user}
                        className="flex items-center gap-2"
                        variant={user ? "default" : "outline"}
                      >
                        <Save className="w-4 h-4" />
                        {isSavingCases ? "Saving..." : user ? "Save to Calendar" : "Sign In to Save"}
                      </Button>
                    </div>

                    {parsedSchedule.cases.map((case_, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{case_.procedure}</h4>
                                {case_.patientIdentifier && (
                                  <p className="text-sm text-muted-foreground">
                                    Patient: {case_.patientIdentifier}
                                  </p>
                                )}
                                {case_.surgeon && (
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {case_.surgeon}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                {case_.date && <div>{case_.date}</div>}
                                {case_.time && <div>{case_.time}</div>}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {case_.cptCodes && case_.cptCodes.length > 0 ? (
                                case_.cptCodes.map((code, codeIndex) => (
                                  <Badge 
                                    key={codeIndex} 
                                    variant={codeIndex === 0 ? "default" : "secondary"}
                                    className={codeIndex === 0 ? "bg-primary" : ""}
                                  >
                                    {code.code} - {code.description}
                                    {code.rvu && ` (${code.rvu} RVU)`}
                                    {codeIndex === 0 && " [PRIMARY]"}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  No CPT codes identified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

        <TabsContent value="topcodes" className="space-y-4">
          <TopCodesWallpaper />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CameraSchedule;