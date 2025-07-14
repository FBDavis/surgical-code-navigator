import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Camera, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DictationCardProps {
  onSubmit: (text: string, type: 'voice' | 'photo' | 'text') => void;
  isProcessing?: boolean;
}

export const DictationCard = ({ onSubmit, isProcessing }: DictationCardProps) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
    try {
      // In a real app with Capacitor, you'd use the Camera plugin
      setText('Photo captured - would be processed for text extraction');
      onSubmit('Photo captured - would be processed for text extraction', 'photo');
    } catch (error) {
      console.error('Error accessing camera:', error);
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
              disabled={isProcessing}
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
              disabled={isProcessing}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <Textarea
          placeholder="Describe the surgical procedure, or use voice/camera input above..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-32 resize-none border-medical-accent/20 focus:border-primary"
          disabled={isProcessing}
        />
        
        <Button 
          onClick={handleSubmit}
          disabled={!text.trim() || isProcessing}
          className="w-full bg-gradient-primary hover:bg-primary-hover transition-all duration-200"
        >
          <Send className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Find CPT Codes'}
        </Button>
      </div>
    </Card>
  );
};