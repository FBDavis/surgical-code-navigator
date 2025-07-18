-- Create subscribers table for subscription management
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT DEFAULT 'premium',
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  free_months_remaining INTEGER DEFAULT 1, -- First month free
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referrals table for tracking referral program
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referrer_email TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'signed_up', 'converted', 'expired')),
  reward_granted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create referral_rewards table for tracking free months earned
CREATE TABLE public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE CASCADE NOT NULL,
  reward_type TEXT DEFAULT 'free_month' CHECK (reward_type IN ('free_month', 'discount')),
  reward_value INTEGER DEFAULT 1, -- months or percentage
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription_reminders table for popup reminders
CREATE TABLE public.subscription_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('trial_ending', 'refer_friend', 'upgrade_prompt', 'payment_failed')),
  shown_count INTEGER DEFAULT 0,
  last_shown TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  dismissed_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_reminders ENABLE ROW LEVEL SECURITY;

-- Subscribers policies
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Insert subscription" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Referrals policies
CREATE POLICY "Users can view their referrals" ON public.referrals
FOR SELECT USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "Users can create referrals" ON public.referrals
FOR INSERT WITH CHECK (referrer_user_id = auth.uid());

CREATE POLICY "Users can update their referrals" ON public.referrals
FOR UPDATE USING (referrer_user_id = auth.uid());

-- Referral rewards policies
CREATE POLICY "Users can view their rewards" ON public.referral_rewards
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can manage rewards" ON public.referral_rewards
FOR ALL WITH CHECK (true);

-- Subscription reminders policies
CREATE POLICY "Users can manage their reminders" ON public.subscription_reminders
FOR ALL USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referral_rewards_user ON public.referral_rewards(user_id);
CREATE INDEX idx_reminders_user_type ON public.subscription_reminders(user_id, reminder_type);

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 8-character code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check 
    FROM public.referrals 
    WHERE referral_code = code;
    
    -- Exit loop if code is unique
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle referral conversions
CREATE OR REPLACE FUNCTION handle_referral_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user signed up with a referral code
  IF NEW.user_id IS NOT NULL AND OLD.user_id IS NULL THEN
    -- Update referral status
    UPDATE public.referrals 
    SET 
      status = 'signed_up',
      updated_at = now()
    WHERE id = NEW.id;
    
    -- Check if this becomes a conversion (user subscribes)
    IF EXISTS (
      SELECT 1 FROM public.subscribers 
      WHERE user_id = NEW.referred_user_id 
      AND subscribed = true
    ) THEN
      -- Mark as converted
      UPDATE public.referrals 
      SET 
        status = 'converted',
        conversion_date = now(),
        updated_at = now()
      WHERE id = NEW.id;
      
      -- Grant reward to referrer
      INSERT INTO public.referral_rewards (
        user_id,
        referral_id,
        reward_type,
        reward_value
      ) VALUES (
        NEW.referrer_user_id,
        NEW.id,
        'free_month',
        1
      );
      
      -- Update referrer's free months (max 6 total)
      UPDATE public.subscribers 
      SET 
        free_months_remaining = LEAST(free_months_remaining + 1, 6),
        updated_at = now()
      WHERE user_id = NEW.referrer_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for referral conversions
CREATE TRIGGER trigger_referral_conversion
  AFTER UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_conversion();

-- Function to create referral reminders
CREATE OR REPLACE FUNCTION create_referral_reminders()
RETURNS void AS $$
BEGIN
  -- Create reminders for users who haven't referred anyone yet
  INSERT INTO public.subscription_reminders (user_id, reminder_type)
  SELECT DISTINCT s.user_id, 'refer_friend'
  FROM public.subscribers s
  LEFT JOIN public.referrals r ON s.user_id = r.referrer_user_id
  LEFT JOIN public.subscription_reminders sr ON s.user_id = sr.user_id AND sr.reminder_type = 'refer_friend'
  WHERE s.subscribed = true 
    AND r.referrer_user_id IS NULL 
    AND sr.id IS NULL
    AND s.created_at < now() - INTERVAL '3 days'; -- Only remind after 3 days
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;