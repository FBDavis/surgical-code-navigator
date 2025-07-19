-- Fix function search paths for security
-- This prevents search_path injection attacks

-- Update existing functions to set search_path
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.generate_referral_code() SET search_path = '';
ALTER FUNCTION public.handle_referral_conversion() SET search_path = '';
ALTER FUNCTION public.create_referral_reminders() SET search_path = '';
ALTER FUNCTION public.update_feedback_count() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SET search_path = '';
ALTER FUNCTION public.audit_trigger() SET search_path = '';

-- Update RLS policies to require authentication (remove anonymous access)
-- Only keep anonymous access for truly public data

-- Remove anonymous access from user-specific tables
DROP POLICY IF EXISTS "Users can only access codes for their own cases" ON public.case_codes;
CREATE POLICY "Authenticated users can only access codes for their own cases" 
ON public.case_codes 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only access their own cases" ON public.cases;
CREATE POLICY "Authenticated users can only access their own cases" 
ON public.cases 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own onboarding progress" ON public.onboarding_progress;
CREATE POLICY "Authenticated users can manage their own onboarding progress" 
ON public.onboarding_progress 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
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

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscribers;
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

-- Update other user-specific policies
DROP POLICY IF EXISTS "Users can manage their reminders" ON public.subscription_reminders;
CREATE POLICY "Authenticated users can manage their reminders" 
ON public.subscription_reminders 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their rewards" ON public.referral_rewards;
CREATE POLICY "Authenticated users can view their rewards" 
ON public.referral_rewards 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can update their referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
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

-- Update resident cases policies
DROP POLICY IF EXISTS "Users can view their own resident cases" ON public.resident_cases;
DROP POLICY IF EXISTS "Users can insert their own resident cases" ON public.resident_cases;
DROP POLICY IF EXISTS "Users can update their own resident cases" ON public.resident_cases;
DROP POLICY IF EXISTS "Users can delete their own resident cases" ON public.resident_cases;
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

-- Update weekly assessments policy
DROP POLICY IF EXISTS "Users can view their assessments" ON public.weekly_assessments;
CREATE POLICY "Authenticated users can view their assessments" 
ON public.weekly_assessments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Update user roles policy
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Authenticated users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Update audit logs policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Update case requirement feedback policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.case_requirement_feedback;
DROP POLICY IF EXISTS "Users can submit feedback" ON public.case_requirement_feedback;
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

-- Update contact discoveries policies
DROP POLICY IF EXISTS "Users can view contact discoveries" ON public.contact_discoveries;
DROP POLICY IF EXISTS "Users can create contact discoveries" ON public.contact_discoveries;
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

-- Update conversation and messaging policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can view conversations they participate in" 
ON public.conversations 
FOR SELECT 
TO authenticated
USING (id IN ( SELECT conversation_participants.conversation_id
   FROM conversation_participants
  WHERE (conversation_participants.user_id = auth.uid())));
CREATE POLICY "Authenticated users can create conversations" 
ON public.conversations 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
CREATE POLICY "Authenticated users can view participants in their conversations" 
ON public.conversation_participants 
FOR SELECT 
TO authenticated
USING (conversation_id IN ( SELECT conversation_participants_1.conversation_id
   FROM conversation_participants conversation_participants_1
  WHERE (conversation_participants_1.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Authenticated users can view messages in their conversations" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (conversation_id IN ( SELECT conversation_participants.conversation_id
   FROM conversation_participants
  WHERE (conversation_participants.user_id = auth.uid())));
CREATE POLICY "Authenticated users can send messages to their conversations" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK ((auth.uid() = user_id) AND (conversation_id IN ( SELECT conversation_participants.conversation_id
   FROM conversation_participants
  WHERE (conversation_participants.user_id = auth.uid()))));

DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON public.message_attachments;
DROP POLICY IF EXISTS "Users can create attachments for their messages" ON public.message_attachments;
CREATE POLICY "Authenticated users can view attachments in their conversations" 
ON public.message_attachments 
FOR SELECT 
TO authenticated
USING (message_id IN ( SELECT m.id
   FROM (messages m
     JOIN conversation_participants cp ON ((m.conversation_id = cp.conversation_id)))
  WHERE (cp.user_id = auth.uid())));
CREATE POLICY "Authenticated users can create attachments for their messages" 
ON public.message_attachments 
FOR INSERT 
TO authenticated
WITH CHECK (message_id IN ( SELECT messages.id
   FROM messages
  WHERE (messages.user_id = auth.uid())));

-- Update friend group policies
DROP POLICY IF EXISTS "Users can view groups they're in or public groups" ON public.friend_groups;
DROP POLICY IF EXISTS "Users can create friend groups" ON public.friend_groups;
CREATE POLICY "Authenticated users can view groups they're in or public groups" 
ON public.friend_groups 
FOR SELECT 
TO authenticated
USING ((is_public = true) OR (created_by = auth.uid()) OR (id IN ( SELECT friend_group_members.group_id
   FROM friend_group_members
  WHERE (friend_group_members.user_id = auth.uid()))));
CREATE POLICY "Authenticated users can create friend groups" 
ON public.friend_groups 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can view group members in their groups" ON public.friend_group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.friend_group_members;
CREATE POLICY "Authenticated users can view group members in their groups" 
ON public.friend_group_members 
FOR SELECT 
TO authenticated
USING (group_id IN ( SELECT friend_groups.id
   FROM friend_groups
  WHERE ((friend_groups.created_by = auth.uid()) OR (friend_groups.is_public = true) OR (friend_groups.id IN ( SELECT friend_group_members_1.group_id
           FROM friend_group_members friend_group_members_1
          WHERE (friend_group_members_1.user_id = auth.uid()))))));
CREATE POLICY "Authenticated users can join groups" 
ON public.friend_group_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);