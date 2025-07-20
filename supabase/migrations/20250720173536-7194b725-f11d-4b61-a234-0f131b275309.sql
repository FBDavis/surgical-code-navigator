-- Add tutorial preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN show_tutorial_on_startup boolean DEFAULT true;

-- Add completed_onboarding to track if user has seen initial tutorial
ALTER TABLE public.profiles
ADD COLUMN completed_onboarding boolean DEFAULT false;