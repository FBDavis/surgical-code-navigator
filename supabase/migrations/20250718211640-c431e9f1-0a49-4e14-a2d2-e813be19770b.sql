-- Update RLS policy to allow public read access to surgical specialties for demo purposes
DROP POLICY IF EXISTS "Surgical specialties are viewable by all authenticated users" ON public.surgical_specialties;

CREATE POLICY "Surgical specialties are viewable by everyone" 
ON public.surgical_specialties 
FOR SELECT 
USING (true);

-- Update case requirements to also be viewable by everyone for demo purposes
DROP POLICY IF EXISTS "Case requirements are viewable by all authenticated users" ON public.case_requirements;

CREATE POLICY "Case requirements are viewable by everyone" 
ON public.case_requirements 
FOR SELECT 
USING (true);