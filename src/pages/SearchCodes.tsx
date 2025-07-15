import { useState } from 'react';
import { DictationCard } from '@/components/DictationCard';
import { CPTCodeCard } from '@/components/CPTCodeCard';
import { ChatInterface } from '@/components/ChatInterface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, CheckCircle, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TutorialTooltip } from '@/components/TutorialTooltip';
import { searchCodesTutorial } from '@/components/TutorialData';

interface CPTCode {
  code: string;
  description: string;
  rvu: number;
  modifiers?: string[];
  category: string;
}

export const SearchCodes = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<CPTCode[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<CPTCode[]>([]);
  const [lastQuery, setLastQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();

  // Mock CPT codes for demonstration
  const mockResults: CPTCode[] = [
    {
      code: '47562',
      description: 'Laparoscopic cholecystectomy',
      rvu: 10.61,
      modifiers: ['59', '78'],
      category: 'Surgery'
    },
    {
      code: '47563',
      description: 'Laparoscopic cholecystectomy with cholangiography',
      rvu: 12.33,
      modifiers: ['59'],
      category: 'Surgery'
    },
    {
      code: '76998',
      description: 'Ultrasonic guidance, intraoperative',
      rvu: 1.58,
      modifiers: ['26'],
      category: 'Radiology'
    },
  ];

  const handleSearch = async (text: string, type: 'voice' | 'photo' | 'text') => {
    setIsProcessing(true);
    setLastQuery(text);

    try {
      const { data, error } = await supabase.functions.invoke('search-cpt-codes', {
        body: { procedureDescription: text }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const codes = data.codes || [];
      setSearchResults(codes);
      
      toast({
        title: "CPT Codes Found",
        description: `Found ${codes.length} relevant codes for your procedure`,
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Unable to process your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCode = (code: CPTCode) => {
    if (!selectedCodes.find(c => c.code === code.code)) {
      setSelectedCodes([...selectedCodes, code]);
      toast({
        title: "Code Added",
        description: `${code.code} added to your bill`,
      });
    }
  };

  const handleRemoveCode = (codeToRemove: string) => {
    setSelectedCodes(selectedCodes.filter(code => code.code !== codeToRemove));
    toast({
      title: "Code Removed",
      description: `${codeToRemove} removed from your bill`,
    });
  };

  const totalRVUs = selectedCodes.reduce((sum, code) => sum + code.rvu, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Find CPT Codes</h1>
        <TutorialTooltip {...searchCodesTutorial} />
      </div>

      <Card className="p-4 bg-medical-light border-medical-accent/20 mb-4">
        <p className="text-sm text-muted-foreground mb-3">
          AI-powered CPT code search is configured and ready to use with your OpCoder AI Key.
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open('https://supabase.com/dashboard/project/vkvneoujpipapcxgdopg/settings/functions', '_blank')}
          >
            View Supabase Secrets
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Your OpCoder AI Key is configured in Supabase Edge Function Secrets.
        </p>
      </Card>

      <DictationCard onSubmit={handleSearch} isProcessing={isProcessing} />

      {isProcessing && (
        <Card className="p-6 text-center bg-gradient-card border-medical-accent/10">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Analyzing procedure description...</p>
          </div>
        </Card>
      )}

      {lastQuery && searchResults.length > 0 && (
        <Card className="p-4 bg-medical-light border-medical-accent/20">
          <div className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary">Analyzed Procedure:</p>
              <p className="text-sm text-muted-foreground mt-1">{lastQuery}</p>
            </div>
          </div>
        </Card>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recommended CPT Codes</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with AI
              </Button>
              <Badge variant="outline" className="border-primary text-primary">
                {searchResults.length} codes found
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {searchResults.map((code) => (
              <CPTCodeCard
                key={code.code}
                cptCode={code}
                onAdd={handleAddCode}
                compensationRate={52} // Mock compensation rate
              />
            ))}
          </div>
        </div>
      )}

      {selectedCodes.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="text-lg font-semibold text-card-foreground">Selected for Billing</h2>
          </div>
          
          <div className="space-y-3">
            {selectedCodes.map((code) => (
              <div key={code.code} className="flex items-center justify-between p-3 bg-card rounded-lg border border-success/20">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono border-success text-success">
                    {code.code}
                  </Badge>
                  <span className="text-sm text-card-foreground">{code.description}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-success">{code.rvu} RVU</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCode(code.code)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-success/20">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-card-foreground">Total RVUs:</span>
              <span className="text-xl font-bold text-success">{totalRVUs.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-muted-foreground">Estimated Value:</span>
              <span className="text-lg font-semibold text-success">${(totalRVUs * 52).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {showChat && lastQuery && (
        <div className="space-y-4">
          <ChatInterface
            procedureDescription={lastQuery}
            selectedCodes={selectedCodes}
            searchResults={searchResults}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
};