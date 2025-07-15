import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DictationCard } from '@/components/DictationCard';
import { CPTCodeCard } from '@/components/CPTCodeCard';
import { ChatInterface } from '@/components/ChatInterface';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Calculator, 
  DollarSign, 
  FileText, 
  MessageSquare,
  Trash2,
  Save,
  Brain
} from 'lucide-react';

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
}

interface Case {
  id: string;
  name: string;
  patientName?: string;
  date: string;
  codes: CPTCode[];
  notes?: string;
}

export const NewCase = () => {
  const { toast } = useToast();
  const [currentCase, setCurrentCase] = useState<Case>({
    id: crypto.randomUUID(),
    name: 'New Case',
    date: new Date().toISOString().split('T')[0],
    codes: []
  });
  const [searchResults, setSearchResults] = useState<CPTCode[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [rvuRate, setRvuRate] = useState<number>(65); // Default $65 per RVU

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
    const updatedCodes = [...currentCase.codes, code];
    setCurrentCase(prev => ({ ...prev, codes: updatedCodes }));
    toast({
      title: "Code added",
      description: `${code.code} added to case`,
    });
  };

  const handleRemoveCode = (codeToRemove: string) => {
    const updatedCodes = currentCase.codes.filter(code => code.code !== codeToRemove);
    setCurrentCase(prev => ({ ...prev, codes: updatedCodes }));
    toast({
      title: "Code removed",
      description: `${codeToRemove} removed from case`,
    });
  };

  const totalRVUs = currentCase.codes.reduce((sum, code) => sum + code.rvu, 0);
  const estimatedValue = totalRVUs * rvuRate;

  const handleSaveCase = () => {
    // TODO: Implement case saving to database
    toast({
      title: "Case saved",
      description: `${currentCase.name} has been saved`,
    });
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
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleOptimizeBilling} variant="outline" size="sm">
                <Brain className="h-4 w-4 mr-2" />
                Optimize Billing
              </Button>
              <Button onClick={handleSaveCase} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Case
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="caseName">Case Name</Label>
              <Input
                id="caseName"
                value={currentCase.name}
                onChange={(e) => setCurrentCase(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter case name"
              />
            </div>
            <div>
              <Label htmlFor="patientName">Patient Name (Optional)</Label>
              <Input
                id="patientName"
                value={currentCase.patientName || ''}
                onChange={(e) => setCurrentCase(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Enter patient name"
              />
            </div>
            <div>
              <Label htmlFor="caseDate">Date</Label>
              <Input
                id="caseDate"
                type="date"
                value={currentCase.date}
                onChange={(e) => setCurrentCase(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="rvuRate">RVU Compensation Rate ($/RVU)</Label>
            <Input
              id="rvuRate"
              type="number"
              value={rvuRate}
              onChange={(e) => setRvuRate(Number(e.target.value))}
              placeholder="65"
              className="w-32"
            />
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
      {currentCase.codes.length > 0 && (
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
              {currentCase.codes.map((code) => (
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
          selectedCodes={currentCase.codes}
          searchResults={searchResults}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};