-- Migration: Fix profile foreign key constraint and permissions
-- This migration addresses the issues we encountered during manual troubleshooting

-- Drop and recreate the profiles table with correct foreign key reference
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT,
  display_name TEXT,
  license_number TEXT,
  practice_name TEXT,
  institution TEXT,
  user_role TEXT CHECK (user_role IN ('practicing_surgeon', 'resident', 'fellow', 'scribe', 'coder', 'admin')),
  subspecialty TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  year_of_training INTEGER,
  board_certification TEXT[],
  specialty_id UUID REFERENCES public.surgical_specialties(id),
  default_rvu_rate NUMERIC(10,2) DEFAULT 65.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres, authenticated, anon;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Update the handle_new_user function to be simpler and more reliable
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create profile with only essential fields to avoid conflicts
  INSERT INTO public.profiles (user_id, email, display_name, license_number, default_rvu_rate)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'license_number', ''),
    65.00
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column(); 