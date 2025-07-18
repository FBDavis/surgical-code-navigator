-- Add role and onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_role TEXT CHECK (user_role IN ('practicing_surgeon', 'resident', 'fellow', 'scribe', 'coder', 'admin')),
ADD COLUMN subspecialty TEXT,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN year_of_training INTEGER,
ADD COLUMN institution TEXT,
ADD COLUMN board_certification TEXT[];

-- Update specialty column to reference surgical_specialties table
ALTER TABLE public.profiles 
DROP COLUMN specialty;

ALTER TABLE public.profiles 
ADD COLUMN specialty_id UUID REFERENCES public.surgical_specialties(id);

-- Create onboarding_progress table to track setup steps
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role_selected BOOLEAN DEFAULT false,
  specialty_selected BOOLEAN DEFAULT false,
  preferences_set BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own onboarding progress"
ON public.onboarding_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update the handle_new_user function to include onboarding
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize onboarding progress
  INSERT INTO public.onboarding_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Add trigger
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();