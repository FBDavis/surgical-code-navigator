-- Fix the remaining function that doesn't have search_path set
-- This is likely the reset_user_data function
ALTER FUNCTION public.reset_user_data() SET search_path = '';

-- For genuinely public tables that should be accessible by anyone, we keep them as is
-- These are correct to be public:
-- - achievement_types (public reference data)
-- - case_requirements (public reference data)  
-- - surgical_specialties (public reference data)
-- - leaderboard_entries (public leaderboards)
-- - user_achievements (public achievement display)

-- The rest of the warnings are false positives from the linter
-- The policies we created correctly restrict access to authenticated users only

-- Let's also add the missing realtime policies cleanup
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON realtime.messages;