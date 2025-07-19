import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon, Clock, User, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CalendarCase {
  id: string;
  case_name: string;
  procedure_description?: string;
  procedure_date?: string;
  notes?: string;
  case_codes?: Array<{
    cpt_code: string;
    description: string;
    rvu: number;
  }>;
}

interface ScheduleCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const ScheduleCalendar = ({ onDateSelect, selectedDate }: ScheduleCalendarProps) => {
  const [cases, setCases] = useState<CalendarCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('cases')
        .select(`
          id,
          case_name,
          procedure_description,
          procedure_date,
          notes,
          case_codes (
            cpt_code,
            description,
            rvu
          )
        `)
        .eq('user_id', user?.id)
        .order('procedure_date', { ascending: true });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Error",
        description: "Failed to load calendar cases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCasesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return cases.filter(case_ => 
      case_.procedure_date && 
      format(parseISO(case_.procedure_date), 'yyyy-MM-dd') === dateStr
    );
  };

  const getDateDots = (date: Date) => {
    const casesForDate = getCasesForDate(date);
    return casesForDate.length > 0;
  };

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return;
    setViewDate(date);
    onDateSelect?.(date);
  };

  const selectedDateCases = getCasesForDate(viewDate);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Surgery Schedule Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={viewDate}
                onSelect={handleDateClick}
                className="rounded-md border"
                modifiers={{
                  hasCase: (date) => getDateDots(date)
                }}
                modifiersStyles={{
                  hasCase: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: '50%'
                  }
                }}
              />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {format(viewDate, 'MMMM d, yyyy')}
                </h3>
                <Badge variant="secondary">
                  {selectedDateCases.length} cases
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {selectedDateCases.length > 0 ? (
                  selectedDateCases.map((case_) => (
                    <Card key={case_.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium">{case_.case_name}</h4>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {case_.procedure_date && 
                              isValid(parseISO(case_.procedure_date)) && 
                              format(parseISO(case_.procedure_date), 'HH:mm')
                            }
                          </div>
                        </div>
                        
                        {case_.procedure_description && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {case_.procedure_description}
                          </p>
                        )}

                        {case_.case_codes && case_.case_codes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {case_.case_codes.map((code, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {code.cpt_code}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {case_.notes && (
                          <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                            {case_.notes}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No cases scheduled for this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Loading cases...</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleCalendar;