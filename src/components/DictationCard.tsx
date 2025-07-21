import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Mic, MicOff, Camera, Send, Upload, Image, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealTimeAnalyzer } from '@/components/RealTimeAnalyzer';
import { SmartTemplates } from '@/components/SmartTemplates';

interface DictationCardProps {
  onSubmit: (text: string, type: 'voice' | 'photo' | 'text') => void;
  isProcessing?: boolean;
  selectedCodes?: any[];
  specialty?: string;
}

export const DictationCard = ({ onSubmit, isProcessing, selectedCodes = [], specialty }: DictationCardProps) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
  const [realtimeAnalysis, setRealtimeAnalysis] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        // In a real app, you'd convert this to text using speech recognition
        setText('Voice recording captured - would be converted to text');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsCapturingPhoto(true);
    try {
      // Check if we're in a Capacitor environment
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.();
      
      if (isCapacitor) {
        // Use Capacitor camera for mobile
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });

        if (image.base64String) {
          await processImage(image.base64String);
        }
      } else {
        // For web, we'll use the file input with camera capture
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use rear camera
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const base64 = await fileToBase64(file);
            await processImage(base64);
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      toast({
        title: "Camera Access Failed",
        description: "Unable to access camera. Please try uploading an image file instead.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleSelectFromGallery = async () => {
    setIsCapturingPhoto(true);
    try {
      // Check if we're in a Capacitor environment
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.();
      
      if (isCapacitor) {
        // Use Capacitor camera for mobile gallery selection
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos
        });

        if (image.base64String) {
          await processImage(image.base64String);
        }
      } else {
        // For web, use file input
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      // Only show error if it's not a user cancellation
      if (error.message && !error.message.includes('cancelled') && !error.message.includes('User cancelled')) {
        toast({
          title: "Gallery Access Failed",
          description: "Unable to access photo gallery. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIsCapturingPhoto(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file (JPG, PNG, etc.).",
        variant: "destructive",
      });
      setIsCapturingPhoto(false);
      return;
    }

    console.log('Processing uploaded file:', file.name, file.type);
    setIsCapturingPhoto(true);
    try {
      const base64 = await fileToBase64(file);
      await processImage(base64);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingPhoto(false);
      // Clear the input so the same file can be selected again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (base64String: string) => {
    console.log('Processing image, base64 length:', base64String.length);
    try {
      toast({
        title: "Processing Image",
        description: "Extracting text from image...",
      });

      const { data, error } = await supabase.functions.invoke('extract-text-from-image', {
        body: { imageBase64: base64String }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data.error) {
        console.error('Function returned error:', data.error);
        throw new Error(data.error);
      }

      const extractedText = data.extractedText;
      console.log('Extracted text:', extractedText);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No readable text found in the image');
      }

      setText(extractedText);
      
      toast({
        title: "Text Extracted Successfully",
        description: `Extracted ${extractedText.length} characters of text.`,
      });

      // Automatically submit the extracted text
      onSubmit(extractedText, 'photo');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Text Extraction Failed",
        description: error.message || "Unable to extract text from image. Please try again or type manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text, 'text');
      setText('');
    }
  };

  const handleInsertTemplate = (templateText: string) => {
    const newText = text + (text ? '\n\n' : '') + templateText;
    setText(newText);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-medical-light border-0 shadow-medical">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-card-foreground">Case Dictation</h2>
          <div className="flex gap-2">
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || isCapturingPhoto}
              className={cn(
                "transition-all duration-200",
                isRecording && "animate-pulse"
              )}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing || isCapturingPhoto || isRecording}
                  className={cn(
                    "transition-all duration-200",
                    isCapturingPhoto && "animate-pulse"
                  )}
                >
                  {isCapturingPhoto ? (
                    <Upload className="w-4 h-4" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleTakePhoto}
                  disabled={isProcessing || isCapturingPhoto || isRecording}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleSelectFromGallery}
                  disabled={isProcessing || isCapturingPhoto || isRecording}
                >
                  <Image className="w-4 h-4 mr-2" />
                  Choose from Gallery
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Smart Templates */}
        <SmartTemplates 
          currentText={text}
          specialty={specialty}
          onInsertTemplate={handleInsertTemplate}
        />
        
        <Textarea
          placeholder="Describe the surgical procedure, or use voice/camera input above..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-32 resize-none border-medical-accent/20 focus:border-primary"
          disabled={isProcessing || isCapturingPhoto}
        />
        
        <Button 
          onClick={handleSubmit}
          disabled={!text.trim() || isProcessing || isCapturingPhoto}
          variant="default"
          className="w-full transition-all duration-200"
        >
          <Send className="w-4 h-4 mr-2" />
          {isProcessing || isCapturingPhoto ? 'Processing...' : 'Find CPT Codes'}
        </Button>

        {/* Hidden file input for web */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,image/heic,image/heif"
          style={{ display: 'none' }}
          capture="environment"
        />

        {/* Real-time Analysis */}
        <RealTimeAnalyzer 
          dictationText={text}
          selectedCodes={selectedCodes}
          specialty={specialty}
          onAnalysisUpdate={setRealtimeAnalysis}
        />
      </div>
    </Card>
  );
};