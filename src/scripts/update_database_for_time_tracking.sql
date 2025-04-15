-- Script to update the database schema for time tracking

-- Add time_spent_seconds column to sessions table
ALTER TABLE IF EXISTS sessions 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;

-- Add time_spent_seconds column to daily_totals table
ALTER TABLE IF EXISTS daily_totals 
ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;

-- Update the trigger function to also aggregate time spent
CREATE OR REPLACE FUNCTION update_daily_totals()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
BEGIN
  -- Get the date from the session timestamp
  session_date := DATE(NEW.timestamp);
  
  -- Insert or update the daily total
  INSERT INTO daily_totals (user_id, date, total_words, time_spent_seconds)
  VALUES (NEW.user_id, session_date, NEW.word_count, NEW.time_spent_seconds)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    total_words = daily_totals.total_words + NEW.word_count,
    time_spent_seconds = daily_totals.time_spent_seconds + NEW.time_spent_seconds,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the weekly stats view to include time spent
CREATE OR REPLACE VIEW user_weekly_stats AS
SELECT 
  user_id,
  date_trunc('week', date) AS week_start,
  SUM(total_words) AS weekly_words,
  SUM(time_spent_seconds) AS weekly_time_spent,
  COUNT(DISTINCT date) AS active_days
FROM daily_totals
GROUP BY user_id, date_trunc('week', date);

-- Update the user rankings view to include time spent
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
  user_id,
  SUM(total_words) AS total_words,
  SUM(time_spent_seconds) AS total_time_spent,
  COUNT(DISTINCT date) AS active_days,
  SUM(total_words) / GREATEST(COUNT(DISTINCT date), 1) AS avg_words_per_active_day,
  CASE 
    WHEN SUM(time_spent_seconds) > 0 
    THEN (SUM(total_words)::FLOAT / (SUM(time_spent_seconds) / 60.0))::INTEGER
    ELSE 0
  END AS avg_wpm,
  MIN(date) AS first_active_day,
  MAX(date) AS last_active_day
FROM daily_totals
GROUP BY user_id
ORDER BY total_words DESC; 