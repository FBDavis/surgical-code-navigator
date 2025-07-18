-- Create surgical specialties and their case requirements
CREATE TABLE public.surgical_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case requirements for each specialty
CREATE TABLE public.case_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty_id UUID NOT NULL REFERENCES public.surgical_specialties(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- e.g., "Major Cases", "Minimally Invasive", "Trauma"
  subcategory TEXT, -- e.g., "Laparoscopic", "Endoscopic"
  min_required INTEGER NOT NULL DEFAULT 0,
  max_allowed INTEGER,
  description TEXT,
  cpt_codes TEXT[], -- Array of relevant CPT codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resident/fellow case tracking
CREATE TABLE public.resident_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  specialty_id UUID NOT NULL REFERENCES public.surgical_specialties(id),
  requirement_id UUID REFERENCES public.case_requirements(id),
  case_date DATE NOT NULL,
  case_name TEXT NOT NULL,
  primary_cpt_code TEXT,
  role TEXT CHECK (role IN ('primary_surgeon', 'first_assist', 'observer')),
  notes TEXT,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.surgical_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for surgical_specialties (readable by all authenticated users)
CREATE POLICY "Surgical specialties are viewable by all authenticated users"
ON public.surgical_specialties
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for case_requirements (readable by all authenticated users)
CREATE POLICY "Case requirements are viewable by all authenticated users"
ON public.case_requirements
FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for resident_cases
CREATE POLICY "Users can view their own resident cases"
ON public.resident_cases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resident cases"
ON public.resident_cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resident cases"
ON public.resident_cases
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resident cases"
ON public.resident_cases
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Supervisors can view/verify cases they supervise
CREATE POLICY "Supervisors can view cases they verify"
ON public.resident_cases
FOR SELECT
TO authenticated
USING (auth.uid() = verified_by);

CREATE POLICY "Supervisors can update verification status"
ON public.resident_cases
FOR UPDATE
TO authenticated
USING (auth.uid() = verified_by)
WITH CHECK (auth.uid() = verified_by);

-- Add update triggers
CREATE TRIGGER update_surgical_specialties_updated_at
BEFORE UPDATE ON public.surgical_specialties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_requirements_updated_at
BEFORE UPDATE ON public.case_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resident_cases_updated_at
BEFORE UPDATE ON public.resident_cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert common surgical specialties
INSERT INTO public.surgical_specialties (name, abbreviation, description) VALUES
('General Surgery', 'GS', 'General surgical procedures'),
('Orthopedic Surgery', 'ORTHO', 'Musculoskeletal system surgery'),
('Neurosurgery', 'NS', 'Brain, spine, and nervous system surgery'),
('Cardiovascular Surgery', 'CVS', 'Heart and vascular surgery'),
('Plastic Surgery', 'PS', 'Reconstructive and cosmetic surgery'),
('Otolaryngology', 'ENT', 'Ear, nose, throat, and head/neck surgery'),
('Ophthalmology', 'OPHT', 'Eye surgery'),
('Urology', 'URO', 'Urinary tract and male reproductive system'),
('Obstetrics and Gynecology', 'OBGYN', 'Women''s reproductive health surgery'),
('Thoracic Surgery', 'TS', 'Chest cavity surgery'),
('Vascular Surgery', 'VS', 'Blood vessel surgery'),
('Anesthesiology', 'ANES', 'Pain management and anesthesia procedures'),
('Emergency Medicine', 'EM', 'Emergency procedures'),
('Radiology', 'RAD', 'Image-guided procedures'),
('Pathology', 'PATH', 'Tissue examination and procedures');

-- Insert sample case requirements for General Surgery (ACGME standards)
INSERT INTO public.case_requirements (specialty_id, category, subcategory, min_required, description, cpt_codes)
SELECT 
  id,
  'Major Cases',
  'General',
  200,
  'Total major cases as primary surgeon',
  ARRAY['47562', '47563', '44970', '49505', '49507']
FROM public.surgical_specialties WHERE abbreviation = 'GS';

INSERT INTO public.case_requirements (specialty_id, category, subcategory, min_required, description, cpt_codes)
SELECT 
  id,
  'Minimally Invasive Surgery',
  'Laparoscopic',
  75,
  'Laparoscopic procedures',
  ARRAY['47562', '44970', '49650', '49651']
FROM public.surgical_specialties WHERE abbreviation = 'GS';

-- Insert sample requirements for Orthopedic Surgery
INSERT INTO public.case_requirements (specialty_id, category, subcategory, min_required, description, cpt_codes)
SELECT 
  id,
  'Major Cases',
  'General',
  200,
  'Total major orthopedic cases',
  ARRAY['27447', '29827', '25607', '23412']
FROM public.surgical_specialties WHERE abbreviation = 'ORTHO';

INSERT INTO public.case_requirements (specialty_id, category, subcategory, min_required, description, cpt_codes)
SELECT 
  id,
  'Arthroscopic Surgery',
  'Knee',
  25,
  'Knee arthroscopy procedures',
  ARRAY['29881', '29882', '29883']
FROM public.surgical_specialties WHERE abbreviation = 'ORTHO';

INSERT INTO public.case_requirements (specialty_id, category, subcategory, min_required, description, cpt_codes)
SELECT 
  id,
  'Arthroscopic Surgery',
  'Shoulder',
  15,
  'Shoulder arthroscopy procedures',
  ARRAY['29827', '29826', '29806']
FROM public.surgical_specialties WHERE abbreviation = 'ORTHO';