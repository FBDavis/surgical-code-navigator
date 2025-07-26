-- Complete Database Schema Setup (Simplified)
-- This file combines all migrations into one comprehensive setup

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Create profiles table
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
  specialty_id UUID,
  default_rvu_rate NUMERIC(10,2) DEFAULT 65.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint to auth.users
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique constraint on user_id
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);

-- Create surgical specialties table
CREATE TABLE public.surgical_specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  abbreviation TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case requirements table
CREATE TABLE public.case_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialty_id UUID NOT NULL REFERENCES public.surgical_specialties(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  min_required INTEGER NOT NULL DEFAULT 0,
  max_allowed INTEGER,
  description TEXT,
  cpt_codes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_name TEXT NOT NULL,
  procedure_date DATE NOT NULL,
  specialty_id UUID REFERENCES public.surgical_specialties(id),
  primary_cpt_code TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case codes table
CREATE TABLE public.case_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cpt_code TEXT NOT NULL,
  description TEXT,
  rvu_value NUMERIC(10,2),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resident cases table
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

-- Create onboarding progress table
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

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- Create friend groups table
CREATE TABLE public.friend_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false,
  group_code TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8)
);

-- Create friend group members table
CREATE TABLE public.friend_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.friend_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  UNIQUE(group_id, user_id)
);

-- Create achievement types table
CREATE TABLE public.achievement_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  category TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_type_id UUID NOT NULL REFERENCES public.achievement_types(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB,
  week_earned TEXT,
  ai_generated BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_type_id, week_earned)
);

-- Create weekly assessments table
CREATE TABLE public.weekly_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  assessment_data JSONB NOT NULL,
  ai_insights TEXT,
  funny_awards JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Create leaderboard entries table
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_rvu NUMERIC DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  rank_position INTEGER,
  specialty_breakdown JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_start)
);

-- Create contact discoveries table
CREATE TABLE public.contact_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discovered_user_id UUID NOT NULL,
  discovery_method TEXT DEFAULT 'contact_match',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, discovered_user_id)
);

-- ============================================================================
-- SUBSCRIPTION AND REFERRAL TABLES
-- ============================================================================

-- Create subscribers table
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  email TEXT NOT NULL UNIQUE,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'enterprise')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription reminders table
CREATE TABLE public.subscription_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('trial_ending', 'payment_due', 'subscription_expiring')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id),
  referred_user_id UUID REFERENCES auth.users(id),
  referral_code TEXT NOT NULL,
  referred_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral rewards table
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  referral_id UUID NOT NULL REFERENCES public.referrals(id),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('subscription_credit', 'feature_unlock', 'bonus_rvu')),
  reward_value TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- MESSAGING TABLES
-- ============================================================================

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message attachments table
CREATE TABLE public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- FEEDBACK AND AUDIT TABLES
-- ============================================================================

-- Create case requirement feedback table
CREATE TABLE public.case_requirement_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  requirement_id UUID NOT NULL REFERENCES public.case_requirements(id),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('suggestion', 'correction', 'question')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surgical_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resident_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_requirement_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SIMPLIFIED RLS POLICIES
-- ============================================================================

-- Profiles policies
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

-- Surgical specialties policies (viewable by all authenticated users)
CREATE POLICY "Surgical specialties are viewable by all authenticated users"
ON public.surgical_specialties
FOR SELECT
TO authenticated
USING (true);

-- Case requirements policies (viewable by all authenticated users)
CREATE POLICY "Case requirements are viewable by all authenticated users"
ON public.case_requirements
FOR SELECT
TO authenticated
USING (true);

-- Cases policies
CREATE POLICY "Authenticated users can only access their own cases" 
ON public.cases 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Case codes policies
CREATE POLICY "Authenticated users can only access codes for their own cases" 
ON public.case_codes 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Resident cases policies
CREATE POLICY "Authenticated users can view their own resident cases" 
ON public.resident_cases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own resident cases" 
ON public.resident_cases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own resident cases" 
ON public.resident_cases
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own resident cases" 
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

-- Onboarding progress policies
CREATE POLICY "Authenticated users can manage their own onboarding progress" 
ON public.onboarding_progress 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Friend groups policies (simplified)
CREATE POLICY "Authenticated users can create friend groups" 
ON public.friend_groups
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view their own groups" 
ON public.friend_groups 
FOR SELECT 
TO authenticated
USING (created_by = auth.uid() OR is_public = true);

CREATE POLICY "Group creators can update their groups" 
ON public.friend_groups
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Friend group members policies (simplified)
CREATE POLICY "Authenticated users can view group members" 
ON public.friend_group_members
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can join groups" 
ON public.friend_group_members
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Achievement types policies (viewable by everyone)
CREATE POLICY "Achievement types are viewable by everyone" 
ON public.achievement_types
FOR SELECT 
TO authenticated
USING (true);

-- User achievements policies
CREATE POLICY "Users can view all achievements" 
ON public.user_achievements
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "System can create achievements" 
ON public.user_achievements
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Weekly assessments policies
CREATE POLICY "Authenticated users can view their assessments" 
ON public.weekly_assessments
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create assessments" 
ON public.weekly_assessments
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Leaderboard policies (viewable by everyone)
CREATE POLICY "Leaderboards are viewable by everyone" 
ON public.leaderboard_entries
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "System can manage leaderboards" 
ON public.leaderboard_entries
FOR ALL 
TO authenticated
USING (true);

-- Contact discoveries policies
CREATE POLICY "Authenticated users can view contact discoveries" 
ON public.contact_discoveries
FOR SELECT 
TO authenticated
USING ((auth.uid() = user_id) OR (auth.uid() = discovered_user_id));

CREATE POLICY "Authenticated users can create contact discoveries" 
ON public.contact_discoveries
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Subscribers policies
CREATE POLICY "Authenticated users can view their own subscription" 
ON public.subscribers
FOR SELECT 
TO authenticated
USING ((user_id = auth.uid()) OR (email = auth.email()));

CREATE POLICY "Authenticated users can update their own subscription" 
ON public.subscribers
FOR UPDATE 
TO authenticated
USING ((user_id = auth.uid()) OR (email = auth.email()));

-- Subscription reminders policies
CREATE POLICY "Authenticated users can manage their reminders" 
ON public.subscription_reminders
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Referrals policies
CREATE POLICY "Authenticated users can view their referrals" 
ON public.referrals
FOR SELECT 
TO authenticated
USING ((referrer_user_id = auth.uid()) OR (referred_user_id = auth.uid()));

CREATE POLICY "Authenticated users can update their referrals" 
ON public.referrals
FOR UPDATE 
TO authenticated
USING (referrer_user_id = auth.uid());

CREATE POLICY "Authenticated users can create referrals" 
ON public.referrals
FOR INSERT 
TO authenticated
WITH CHECK (referrer_user_id = auth.uid());

-- Referral rewards policies
CREATE POLICY "Authenticated users can view their rewards" 
ON public.referral_rewards
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Conversations policies (simplified)
CREATE POLICY "Authenticated users can view conversations" 
ON public.conversations
FOR SELECT 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Conversation participants policies (simplified)
CREATE POLICY "Authenticated users can view participants" 
ON public.conversation_participants
FOR SELECT 
TO authenticated
USING (true);

-- Messages policies (simplified)
CREATE POLICY "Authenticated users can view messages" 
ON public.messages
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can send messages" 
ON public.messages
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Message attachments policies (simplified)
CREATE POLICY "Authenticated users can view attachments" 
ON public.message_attachments
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create attachments" 
ON public.message_attachments
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Case requirement feedback policies
CREATE POLICY "Authenticated users can view their own feedback" 
ON public.case_requirement_feedback
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can submit feedback" 
ON public.case_requirement_feedback
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Audit logs policies
CREATE POLICY "Authenticated users can view their own audit logs" 
ON public.audit_logs
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create trigger for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  -- Create profile with essential fields
  -- Extract data from user_metadata (what's passed during signup)
  INSERT INTO profiles (
    user_id, 
    email, 
    display_name, 
    license_number, 
    practice_name,
    institution,
    user_role,
    subspecialty,
    year_of_training,
    default_rvu_rate
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.user_metadata->>'display_name', NEW.user_metadata->>'name', NEW.email),
    COALESCE(NEW.user_metadata->>'license_number', ''),
    COALESCE(NEW.user_metadata->>'practice_name', ''),
    COALESCE(NEW.user_metadata->>'institution', ''),
    COALESCE(NEW.user_metadata->>'user_role', ''),
    COALESCE(NEW.user_metadata->>'subspecialty', ''),
    CASE 
      WHEN NEW.user_metadata->>'year_of_training' IS NOT NULL 
      THEN (NEW.user_metadata->>'year_of_training')::integer 
      ELSE NULL 
    END,
    65.00
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Initialize onboarding progress
  INSERT INTO onboarding_progress (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surgical_specialties_updated_at
  BEFORE UPDATE ON public.surgical_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_requirements_updated_at
  BEFORE UPDATE ON public.case_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resident_cases_updated_at
  BEFORE UPDATE ON public.resident_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_groups_updated_at
  BEFORE UPDATE ON public.friend_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leaderboard_entries_updated_at
  BEFORE UPDATE ON public.leaderboard_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres, authenticated, anon;
GRANT ALL ON public.surgical_specialties TO postgres, authenticated, anon;
GRANT ALL ON public.case_requirements TO postgres, authenticated, anon;
GRANT ALL ON public.cases TO postgres, authenticated, anon;
GRANT ALL ON public.case_codes TO postgres, authenticated, anon;
GRANT ALL ON public.resident_cases TO postgres, authenticated, anon;
GRANT ALL ON public.onboarding_progress TO postgres, authenticated, anon;
GRANT ALL ON public.friend_groups TO postgres, authenticated, anon;
GRANT ALL ON public.friend_group_members TO postgres, authenticated, anon;
GRANT ALL ON public.achievement_types TO postgres, authenticated, anon;
GRANT ALL ON public.user_achievements TO postgres, authenticated, anon;
GRANT ALL ON public.weekly_assessments TO postgres, authenticated, anon;
GRANT ALL ON public.leaderboard_entries TO postgres, authenticated, anon;
GRANT ALL ON public.contact_discoveries TO postgres, authenticated, anon;
GRANT ALL ON public.subscribers TO postgres, authenticated, anon;
GRANT ALL ON public.subscription_reminders TO postgres, authenticated, anon;
GRANT ALL ON public.referrals TO postgres, authenticated, anon;
GRANT ALL ON public.referral_rewards TO postgres, authenticated, anon;
GRANT ALL ON public.conversations TO postgres, authenticated, anon;
GRANT ALL ON public.conversation_participants TO postgres, authenticated, anon;
GRANT ALL ON public.messages TO postgres, authenticated, anon;
GRANT ALL ON public.message_attachments TO postgres, authenticated, anon;
GRANT ALL ON public.case_requirement_feedback TO postgres, authenticated, anon;
GRANT ALL ON public.audit_logs TO postgres, authenticated, anon;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO postgres, authenticated, anon;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

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

-- Insert funny achievement types
INSERT INTO public.achievement_types (name, description, icon, category, rarity, criteria) VALUES
('Foot King', 'Completed 25+ foot and ankle procedures', '👑', 'specialty', 'rare', '{"specialty": "foot_ankle", "min_cases": 25}'),
('Making Big People Little', 'Performed 10+ bariatric procedures', '⚖️', 'specialty', 'epic', '{"procedure_type": "bariatric", "min_cases": 10}'),
('Gallbladder Collector', 'Performed 10+ cholecystectomies', '🪣', 'procedure', 'common', '{"cpt_codes": ["47562", "47563", "47564"], "min_cases": 10}'),
('Joint Master', 'Completed 15+ joint replacement surgeries', '🦴', 'specialty', 'rare', '{"procedure_type": "joint_replacement", "min_cases": 15}'),
('Spine Warrior', 'Performed 20+ spine procedures', '🏴‍☠️', 'specialty', 'epic', '{"specialty": "spine", "min_cases": 20}'),
('Heart Whisperer', 'Completed 10+ cardiac procedures', '❤️', 'specialty', 'legendary', '{"specialty": "cardiac", "min_cases": 10}'),
('RVU Machine', 'Generated 1000+ RVUs in a week', '🚀', 'performance', 'epic', '{"weekly_rvu": 1000}'),
('Case Crusher', 'Completed 50+ cases in a week', '💪', 'volume', 'rare', '{"weekly_cases": 50}'),
('Night Owl', 'Performed 5+ emergency cases after midnight', '🦉', 'timing', 'rare', '{"emergency_night_cases": 5}'),
('Speed Demon', 'Completed cases with exceptional efficiency', '⚡', 'efficiency', 'epic', '{"efficiency_score": 90}');

-- ============================================================================
-- COMPLETE SETUP
-- ============================================================================

-- Final verification
SELECT 'Database schema setup completed successfully!' as status; 