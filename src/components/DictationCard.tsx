import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Camera, Send, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DictationCardProps {
  onSubmit: (text: string, type: 'voice' | 'photo' | 'text') => void;
  isProcessing?: boolean;
}

export const DictationCard = ({ onSubmit, isProcessing }: DictationCardProps) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);
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

  const handleCameraCapture = async () => {
    setIsCapturingPhoto(true);
    try {
      // Try Capacitor camera first (for mobile)
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (image.base64String) {
        await processImage(image.base64String);
      }
    } catch (capacitorError) {
      console.log('Capacitor camera not available, falling back to file input');
      // Fallback to file input for web
      fileInputRef.current?.click();
    } finally {
      setIsCapturingPhoto(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setIsCapturingPhoto(true);
    try {
      const base64 = await fileToBase64(file);
      await processImage(base64);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process the image.",
        variant: "destructive",
      });
    } finally {
      setIsCapturingPhoto(false);
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
    try {
      const { data, error } = await supabase.functions.invoke('extract-text-from-image', {
        body: { imageBase64: base64String }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const extractedText = data.extractedText;
      setText(extractedText);
      
      toast({
        title: "Text Extracted",
        description: "Successfully extracted text from image.",
      });

      // Automatically submit the extracted text
      onSubmit(extractedText, 'photo');
    } catch (error) {
      console.error('Error extracting text:', error);
      toast({
        title: "Extraction Failed",
        description: "Unable to extract text from image. Please try again.",
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
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCameraCapture}
              disabled={isProcessing || isCapturingPhoto || isRecording}
              className={cn(
                "transition-all duration-200",
                isCapturingPhoto && "animate-pulse"
              )}
            >
              {isCapturingPhoto ? <Upload className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
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
          className="w-full bg-gradient-primary hover:bg-primary-hover transition-all duration-200"
        >
          <Send className="w-4 h-4 mr-2" />
          {isProcessing || isCapturingPhoto ? 'Processing...' : 'Find CPT Codes'}
        </Button>

        {/* Hidden file input for web fallback */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
      </div>
    </Card>
  );
};