import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { History, TrendingUp, Copy, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CommonProcedure {
  code: string;
  description: string;
  count: number;
  rvu: number;
  lastUsed: string;
}

interface CommonProceduresProps {
  onAddToCase?: (code: string, description: string, rvu: number) => void;
}

export const CommonProcedures = ({ onAddToCase }: CommonProceduresProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [procedures, setProcedures] = useState<CommonProcedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCommonProcedures();
    }
  }, [user]);

  const fetchCommonProcedures = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const { data: codes, error } = await supabase
        .from('case_codes')
        .select(`
          cpt_code,
          description,
          rvu,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate frequency and get most recent usage
      const codeFrequency: { [key: string]: { count: number; rvu: number; description: string; lastUsed: string } } = {};
      
      codes?.forEach(code => {
        const key = code.cpt_code;
        if (codeFrequency[key]) {
          codeFrequency[key].count++;
          // Keep the most recent date
          if (new Date(code.created_at) > new Date(codeFrequency[key].lastUsed)) {
            codeFrequency[key].lastUsed = code.created_at;
          }
        } else {
          codeFrequency[key] = {
            count: 1,
            rvu: code.rvu || 0,
            description: code.description,
            lastUsed: code.created_at
          };
        }
      });

      const sortedProcedures = Object.entries(codeFrequency)
        .sort(([,a], [,b]) => b.count - a.count)
        .map(([code, data]) => ({
          code,
          description: data.description,
          count: data.count,
          rvu: data.rvu,
          lastUsed: new Date(data.lastUsed).toLocaleDateString()
        }));

      setProcedures(sortedProcedures);
    } catch (error) {
      console.error('Error fetching common procedures:', error);
      toast({
        title: "Error",
        description: "Failed to load common procedures",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `CPT code ${code} copied to clipboard`
    });
  };

  const handleAddToCase = (procedure: CommonProcedure) => {
    if (onAddToCase) {
      onAddToCase(procedure.code, procedure.description, procedure.rvu);
      toast({
        title: "Added to Case",
        description: `${procedure.code} added to current case`
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Common Procedures</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Most Used Procedures</h1>
      </div>

      {procedures.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No procedures yet</h3>
            <p className="text-muted-foreground">
              Start creating cases to see your most frequently used procedures here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {procedures.map((procedure, index) => (
            <Card key={procedure.code} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg font-mono">{procedure.code}</CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        #{index + 1}
                      </Badge>
                      <Badge variant="outline">
                        Used {procedure.count} time{procedure.count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {procedure.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>RVU: {procedure.rvu.toFixed(2)}</span>
                      <span>Last used: {procedure.lastUsed}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(procedure.code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {onAddToCase && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAddToCase(procedure)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Case
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
