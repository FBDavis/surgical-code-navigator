import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExtractedTextViewerProps {
  extractedText: string;
  isParsingSchedule: boolean;
  hasParsingError: boolean;
  onReparse: () => void;
}

const ExtractedTextViewer = ({ 
  extractedText, 
  isParsingSchedule, 
  hasParsingError,
  onReparse 
}: ExtractedTextViewerProps) => {
  if (!extractedText) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Extracted Text</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No text extracted yet. Please capture an image first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={hasParsingError ? "text-destructive" : ""}>
          Extracted Text {hasParsingError && "(Parsing Failed)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hasParsingError && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive mb-2">
                ⚠️ There was an error parsing this text. Please review and try again.
              </p>
            </div>
          )}
          
          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
            {extractedText}
          </pre>
          
          <Button 
            onClick={onReparse}
            disabled={isParsingSchedule}
          >
            {isParsingSchedule ? "Parsing..." : "Re-parse Schedule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExtractedTextViewer;