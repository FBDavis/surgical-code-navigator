import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, Download, Image as ImageIcon, Loader, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TopCode {
  cpt_code: string;
  description: string;
  count: number;
  total_rvu: number;
  avg_rvu: number;
}

interface TopCodesWallpaperProps {
  onWallpaperGenerated?: (wallpaperUrl: string) => void;
}

const TopCodesWallpaper = ({ onWallpaperGenerated }: TopCodesWallpaperProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTopCodes, setIsLoadingTopCodes] = useState(false);
  const [generatedWallpaper, setGeneratedWallpaper] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('medical');
  const [topCodes, setTopCodes] = useState<TopCode[]>([]);
  const [selectedCount, setSelectedCount] = useState<string>('10');
  const [surgeonName, setSurgeonName] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadTopCodes();
      loadSurgeonName();
    }
  }, [user, selectedCount]);

  const loadSurgeonName = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user?.id)
        .single();
      
      if (profile?.display_name) {
        setSurgeonName(profile.display_name);
      }
    } catch (error) {
      console.error('Error loading surgeon name:', error);
    }
  };

  const loadTopCodes = async () => {
    if (!user) return;
    
    try {
      setIsLoadingTopCodes(true);
      
      const { data: codes, error } = await supabase
        .from('case_codes')
        .select(`
          cpt_code,
          description,
          rvu
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Group by CPT code and calculate statistics
      const codeStats = codes?.reduce((acc: Record<string, TopCode>, code) => {
        const key = code.cpt_code;
        if (!acc[key]) {
          acc[key] = {
            cpt_code: code.cpt_code,
            description: code.description,
            count: 0,
            total_rvu: 0,
            avg_rvu: 0
          };
        }
        acc[key].count += 1;
        acc[key].total_rvu += code.rvu || 0;
        return acc;
      }, {}) || {};

      // Calculate averages and sort by usage count
      const sortedCodes = Object.values(codeStats)
        .map(code => ({
          ...code,
          avg_rvu: code.total_rvu / code.count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, parseInt(selectedCount));

      setTopCodes(sortedCodes);
    } catch (error) {
      console.error('Error loading top codes:', error);
      toast({
        title: "Error",
        description: "Failed to load your top codes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTopCodes(false);
    }
  };

  const generateWallpaper = async () => {
    if (topCodes.length === 0) {
      toast({
        title: "No codes available",
        description: "You need to have cases with CPT codes to generate a wallpaper",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const cptCodes = topCodes.map(code => ({
        code: code.cpt_code,
        description: code.description,
        rvu: code.avg_rvu
      }));

      const { data, error } = await supabase.functions.invoke('generate-wallpaper', {
        body: {
          cptCodes,
          surgeonName,
          theme: selectedTheme,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.wallpaper) {
        setGeneratedWallpaper(data.wallpaper);
        onWallpaperGenerated?.(data.wallpaper);
        
        toast({
          title: "Wallpaper generated successfully",
          description: "Your top codes wallpaper is ready to download",
        });
      }
    } catch (error) {
      console.error("Error generating wallpaper:", error);
      toast({
        title: "Error",
        description: "Failed to generate wallpaper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadWallpaper = () => {
    if (!generatedWallpaper) return;

    const link = document.createElement('a');
    link.href = generatedWallpaper;
    link.download = `top-codes-wallpaper-${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your wallpaper is being downloaded",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Generate Top Codes Wallpaper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code-count">Number of Top Codes</Label>
              <Select value={selectedCount} onValueChange={setSelectedCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Blue</SelectItem>
                  <SelectItem value="surgical">Surgical Green</SelectItem>
                  <SelectItem value="professional">Professional Gray</SelectItem>
                  <SelectItem value="modern">Modern Purple</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgeon-name">Surgeon Name</Label>
              <Input
                id="surgeon-name"
                placeholder="Dr. Smith"
                value={surgeonName}
                onChange={(e) => setSurgeonName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Your Top CPT Codes</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTopCodes}
                disabled={isLoadingTopCodes}
              >
                {isLoadingTopCodes ? <Loader className="w-4 h-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
            
            {isLoadingTopCodes ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {topCodes.length > 0 ? (
                  topCodes.map((code, index) => (
                    <div
                      key={`${code.cpt_code}-${index}`}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          #{index + 1}
                        </Badge>
                        <div>
                          <div className="font-medium">{code.cpt_code}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {code.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">{code.count} uses</div>
                        <div className="text-muted-foreground">
                          {code.avg_rvu.toFixed(1)} avg RVU
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center p-4">
                    No CPT codes found. Create some cases first to see your top codes.
                  </p>
                )}
              </div>
            )}
          </div>

          <Button 
            onClick={generateWallpaper} 
            disabled={isGenerating || topCodes.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating Wallpaper...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Top Codes Wallpaper
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWallpaper && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Wallpaper
              <Button onClick={downloadWallpaper} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img 
                src={generatedWallpaper} 
                alt="Generated top codes wallpaper" 
                className="w-full rounded-lg border shadow-lg"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TopCodesWallpaper;