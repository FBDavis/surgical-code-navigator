-- Seed achievement types data
INSERT INTO public.achievement_types (name, description, icon, category, rarity, criteria) VALUES
-- Volume Achievements
('First Steps', 'Complete your first surgical case', '🏥', 'volume', 'common', '{"cases_completed": 1}'),
('Getting Started', 'Complete 5 surgical cases', '⚕️', 'volume', 'common', '{"cases_completed": 5}'),
('Case Machine', 'Complete 25 surgical cases', '🔥', 'volume', 'rare', '{"cases_completed": 25}'),
('Century Club', 'Complete 100 surgical cases', '💯', 'volume', 'epic', '{"cases_completed": 100}'),
('Master Surgeon', 'Complete 500 surgical cases', '👑', 'volume', 'legendary', '{"cases_completed": 500}'),

-- Performance Achievements  
('RVU Rookie', 'Generate your first 50 RVU', '🌟', 'performance', 'common', '{"total_rvu": 50}'),
('RVU Specialist', 'Generate 500 RVU in total', '⭐', 'performance', 'rare', '{"total_rvu": 500}'),
('RVU Expert', 'Generate 2000 RVU in total', '🏆', 'performance', 'epic', '{"total_rvu": 2000}'),
('RVU Legend', 'Generate 10000 RVU in total', '👨‍⚕️', 'performance', 'legendary', '{"total_rvu": 10000}'),

-- Specialty Achievements
('Precision Pro', 'Complete 10 minimally invasive procedures', '🎯', 'specialty', 'rare', '{"minimally_invasive": 10}'),
('Speed Demon', 'Complete 5 cases in one day', '⚡', 'specialty', 'epic', '{"cases_per_day": 5}'),
('Night Owl', 'Complete emergency surgery after midnight', '🦉', 'specialty', 'rare', '{"emergency_cases": 1}'),
('Weekend Warrior', 'Complete surgeries on both Saturday and Sunday', '🗓️', 'specialty', 'rare', '{"weekend_cases": 2}'),

-- AI Generated Awards (for weekly assessments)
('Coffee Connoisseur', 'Had the most caffeine-dependent week', '☕', 'ai_generated', 'common', '{}'),
('Efficiency Expert', 'Completed cases with exceptional speed', '🚀', 'ai_generated', 'rare', '{}'),
('Code Whisperer', 'Perfect CPT code accuracy all week', '🔮', 'ai_generated', 'epic', '{}'),
('Multitasker Supreme', 'Handled the most diverse case types', '🎭', 'ai_generated', 'rare', '{}'),
('Steady Eddie', 'Most consistent performance all week', '📈', 'ai_generated', 'common', '{}');

-- Create a function to automatically award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS TRIGGER AS $$
DECLARE
  user_cases_count INT;
  user_total_rvu NUMERIC;
  achievement_record RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COUNT(*),
    COALESCE(SUM(total_rvu), 0)
  INTO user_cases_count, user_total_rvu
  FROM cases 
  WHERE user_id = NEW.user_id;

  -- Check each achievement type
  FOR achievement_record IN 
    SELECT * FROM achievement_types 
    WHERE category IN ('volume', 'performance')
  LOOP
    -- Check if user already has this achievement
    IF NOT EXISTS (
      SELECT 1 FROM user_achievements 
      WHERE user_id = NEW.user_id AND achievement_type_id = achievement_record.id
    ) THEN
      -- Check volume achievements
      IF achievement_record.category = 'volume' AND 
         user_cases_count >= (achievement_record.criteria->>'cases_completed')::int THEN
        INSERT INTO user_achievements (user_id, achievement_type_id) 
        VALUES (NEW.user_id, achievement_record.id);
      END IF;
      
      -- Check performance achievements  
      IF achievement_record.category = 'performance' AND 
         user_total_rvu >= (achievement_record.criteria->>'total_rvu')::numeric THEN
        INSERT INTO user_achievements (user_id, achievement_type_id) 
        VALUES (NEW.user_id, achievement_record.id);
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check achievements when cases are updated
CREATE TRIGGER check_achievements_on_case_update
  AFTER INSERT OR UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_achievements();

-- Function to update leaderboards
CREATE OR REPLACE FUNCTION public.update_leaderboards()
RETURNS void AS $$
DECLARE
  current_week_start DATE;
  current_week_end DATE;
  current_month_start DATE;
  current_month_end DATE;
BEGIN
  -- Calculate current week
  current_week_start := date_trunc('week', CURRENT_DATE);
  current_week_end := current_week_start + INTERVAL '6 days';
  
  -- Calculate current month
  current_month_start := date_trunc('month', CURRENT_DATE);
  current_month_end := current_month_start + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Update weekly leaderboard
  DELETE FROM leaderboard_entries WHERE period_type = 'weekly' AND period_start = current_week_start;
  
  INSERT INTO leaderboard_entries (user_id, period_type, period_start, period_end, total_cases, total_rvu)
  SELECT 
    c.user_id,
    'weekly',
    current_week_start,
    current_week_end,
    COUNT(*),
    COALESCE(SUM(c.total_rvu), 0)
  FROM cases c
  WHERE c.procedure_date >= current_week_start 
    AND c.procedure_date <= current_week_end
  GROUP BY c.user_id
  HAVING COUNT(*) > 0;
  
  -- Update ranks for weekly
  UPDATE leaderboard_entries 
  SET rank_position = rankings.rank
  FROM (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY total_rvu DESC, total_cases DESC) as rank
    FROM leaderboard_entries 
    WHERE period_type = 'weekly' AND period_start = current_week_start
  ) rankings
  WHERE leaderboard_entries.user_id = rankings.user_id 
    AND period_type = 'weekly' 
    AND period_start = current_week_start;
    
  -- Update monthly leaderboard
  DELETE FROM leaderboard_entries WHERE period_type = 'monthly' AND period_start = current_month_start;
  
  INSERT INTO leaderboard_entries (user_id, period_type, period_start, period_end, total_cases, total_rvu)
  SELECT 
    c.user_id,
    'monthly',
    current_month_start,
    current_month_end,
    COUNT(*),
    COALESCE(SUM(c.total_rvu), 0)
  FROM cases c
  WHERE c.procedure_date >= current_month_start 
    AND c.procedure_date <= current_month_end
  GROUP BY c.user_id
  HAVING COUNT(*) > 0;
  
  -- Update ranks for monthly
  UPDATE leaderboard_entries 
  SET rank_position = rankings.rank
  FROM (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY total_rvu DESC, total_cases DESC) as rank
    FROM leaderboard_entries 
    WHERE period_type = 'monthly' AND period_start = current_month_start
  ) rankings
  WHERE leaderboard_entries.user_id = rankings.user_id 
    AND period_type = 'monthly' 
    AND period_start = current_month_start;
    
  -- Update all-time leaderboard
  DELETE FROM leaderboard_entries WHERE period_type = 'all_time';
  
  INSERT INTO leaderboard_entries (user_id, period_type, period_start, period_end, total_cases, total_rvu)
  SELECT 
    c.user_id,
    'all_time',
    '2024-01-01'::date,
    CURRENT_DATE,
    COUNT(*),
    COALESCE(SUM(c.total_rvu), 0)
  FROM cases c
  GROUP BY c.user_id
  HAVING COUNT(*) > 0;
  
  -- Update ranks for all-time
  UPDATE leaderboard_entries 
  SET rank_position = rankings.rank
  FROM (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY total_rvu DESC, total_cases DESC) as rank
    FROM leaderboard_entries 
    WHERE period_type = 'all_time'
  ) rankings
  WHERE leaderboard_entries.user_id = rankings.user_id 
    AND period_type = 'all_time';
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Call the function to initialize leaderboards
SELECT update_leaderboards();