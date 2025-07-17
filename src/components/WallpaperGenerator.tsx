import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Image as ImageIcon, Loader, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CPTCode {
  code: string;
  description: string;
  rvu?: number;
}

interface WallpaperGeneratorProps {
  cptCodes: CPTCode[];
  surgeonName?: string;
  onWallpaperGenerated?: (wallpaperUrl: string) => void;
}

const WallpaperGenerator = ({ 
  cptCodes, 
  surgeonName, 
  onWallpaperGenerated 
}: WallpaperGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWallpaper, setGeneratedWallpaper] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>('medical');
  const [customSurgeonName, setCustomSurgeonName] = useState(surgeonName || '');
  const { toast } = useToast();

  const generateWallpaper = async () => {
    if (cptCodes.length === 0) {
      toast({
        title: "No CPT codes",
        description: "Please provide CPT codes to generate a wallpaper",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-wallpaper', {
        body: {
          cptCodes,
          surgeonName: customSurgeonName,
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
          description: "Your medical reference wallpaper is ready to download",
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
    link.download = `medical-wallpaper-${new Date().toISOString().split('T')[0]}.png`;
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
            <Palette className="w-5 h-5" />
            Generate Medical Wallpaper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="surgeon-name">Surgeon Name (Optional)</Label>
              <Input
                id="surgeon-name"
                placeholder="Dr. Smith"
                value={customSurgeonName}
                onChange={(e) => setCustomSurgeonName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>CPT Codes to Include ({cptCodes.length})</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {cptCodes.map((code, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {code.code} - {code.description.substring(0, 30)}
                  {code.description.length > 30 ? '...' : ''}
                  {code.rvu && ` (${code.rvu} RVU)`}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={generateWallpaper} 
            disabled={isGenerating || cptCodes.length === 0}
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
                Generate Wallpaper
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
                alt="Generated medical wallpaper" 
                className="w-full rounded-lg border shadow-lg"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WallpaperGenerator;