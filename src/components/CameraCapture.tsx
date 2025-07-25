import { useState } from "react";
import { Camera } from "@capacitor/camera";
import { CameraResultType, CameraSource } from "@capacitor/camera";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera as CameraIcon, Image, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CameraCaptureProps {
  onImageCaptured: (imageData: string, extractedText: string) => void;
  title?: string;
  description?: string;
}

const CameraCapture = ({ 
  onImageCaptured, 
  title = "Capture Surgery Schedule",
  description = "Take a photo of your surgery schedule to extract cases and CPT codes"
}: CameraCaptureProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const takePicture = async () => {
    console.log('Starting camera capture...');
    try {
      setIsProcessing(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        console.log('Image captured successfully, extracting text...');
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
        
        // Extract text from the image with timeout
        console.log('Calling extract-text-from-image function...');
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Text extraction timeout - please try again')), 30000)
        );
        
        const extractPromise = supabase.functions.invoke('extract-text-from-image', {
          body: { imageBase64: image.base64String }
        });
        
        const { data, error } = await Promise.race([extractPromise, timeoutPromise]) as any;

        console.log('Extract text response:', { data, error });
        console.log('Full response data:', JSON.stringify(data, null, 2));
        console.log('Full error details:', JSON.stringify(error, null, 2));

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Failed to extract text from image');
        }

        if (!data) {
          console.error('No data returned from edge function');
          throw new Error('No response data from text extraction service');
        }

        const extractedText = data?.extractedText || '';
        console.log('Extracted text length:', extractedText.length);
        onImageCaptured(`data:image/jpeg;base64,${image.base64String}`, extractedText);
        
        toast({
          title: "Image processed successfully",
          description: "Text has been extracted from your surgery schedule",
        });
      }
    } catch (error) {
      console.error("Detailed error taking picture:", error);
      console.error("Error taking picture:", error);
      toast({
        title: "Error",
        description: "Failed to capture or process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      setIsProcessing(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (image.base64String) {
        setCapturedImage(`data:image/jpeg;base64,${image.base64String}`);
        
        // Extract text from the image with timeout
        console.log('Calling extract-text-from-image function for gallery image...');
        
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Text extraction timeout - please try again')), 30000)
        );
        
        const extractPromise = supabase.functions.invoke('extract-text-from-image', {
          body: { imageBase64: image.base64String }
        });
        
        const { data, error } = await Promise.race([extractPromise, timeoutPromise]) as any;

        console.log('Extract text response:', { data, error });

        if (error) {
          throw new Error(error.message || 'Failed to extract text from image');
        }

        const extractedText = data?.extractedText || '';
        onImageCaptured(`data:image/jpeg;base64,${image.base64String}`, extractedText);
        
        toast({
          title: "Image processed successfully",
          description: "Text has been extracted from your image",
        });
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      toast({
        title: "Error",
        description: "Failed to select or process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {capturedImage && (
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full max-w-md mx-auto rounded-lg border"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={takePicture} 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <CameraIcon className="w-4 h-4" />
              )}
              {isProcessing ? "Processing..." : "Take Photo"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={selectFromGallery} 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Select from Gallery
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;