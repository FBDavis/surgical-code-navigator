-- Add specialty field to profiles table
DO $$
BEGIN
    -- Add the specialty enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_specialty') THEN
        CREATE TYPE public.medical_specialty AS ENUM (
            'orthopedics',
            'general_surgery', 
            'plastic_surgery',
            'ent',
            'cardiothoracic',
            'neurosurgery',
            'urology',
            'gynecology',
            'ophthalmology',
            'dermatology',
            'gastroenterology',
            'emergency_medicine',
            'family_medicine',
            'internal_medicine',
            'radiology',
            'anesthesiology',
            'pathology',
            'psychiatry',
            'pediatrics',
            'oncology'
        );
    END IF;
END $$;

-- Add specialty column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS specialty public.medical_specialty;

-- Add specialty colors and branding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS specialty_theme jsonb DEFAULT '{
  "primary_color": "195 100% 28%",
  "accent_color": "195 50% 88%",
  "name": "General Medicine"
}'::jsonb;