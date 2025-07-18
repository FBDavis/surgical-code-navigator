-- Add columns to case_requirements table for AI-generated data and user feedback
ALTER TABLE public.case_requirements 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confidence_level DECIMAL(3,2) DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Manual Entry',
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS user_feedback_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create table for user feedback on case requirements
CREATE TABLE IF NOT EXISTS public.case_requirement_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.case_requirements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correction', 'verification', 'addition', 'deletion')),
  original_value JSONB,
  suggested_value JSONB,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feedback table
ALTER TABLE public.case_requirement_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback table
CREATE POLICY "Users can submit feedback" 
ON public.case_requirement_feedback 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" 
ON public.case_requirement_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feedback" 
ON public.case_requirement_feedback 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to update feedback count
CREATE OR REPLACE FUNCTION public.update_feedback_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.case_requirements 
  SET 
    user_feedback_count = (
      SELECT COUNT(*) 
      FROM public.case_requirement_feedback 
      WHERE requirement_id = COALESCE(NEW.requirement_id, OLD.requirement_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.requirement_id, OLD.requirement_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update feedback count
DROP TRIGGER IF EXISTS update_requirement_feedback_count ON public.case_requirement_feedback;
CREATE TRIGGER update_requirement_feedback_count
  AFTER INSERT OR DELETE ON public.case_requirement_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feedback_count();

-- Add trigger for updated_at on feedback table
DROP TRIGGER IF EXISTS update_feedback_updated_at ON public.case_requirement_feedback;
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.case_requirement_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();