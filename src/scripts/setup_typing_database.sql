-- Script to set up the database tables and triggers for the typing statistics system

-- Sessions table - stores raw typing session data
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_text TEXT NOT NULL,
  typed_text TEXT NOT NULL,
  word_count INTEGER NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paragraph_id UUID,
  wisdom_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_timestamp_idx ON sessions (timestamp);

-- Daily totals table - aggregates word counts by day
CREATE TABLE IF NOT EXISTS daily_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_words INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS daily_totals_user_id_idx ON daily_totals (user_id);
CREATE INDEX IF NOT EXISTS daily_totals_date_idx ON daily_totals (date);

-- Function to update daily totals when a new session is added
CREATE OR REPLACE FUNCTION update_daily_totals()
RETURNS TRIGGER AS $$
DECLARE
  session_date DATE;
BEGIN
  -- Get the date from the session timestamp
  session_date := DATE(NEW.timestamp);
  
  -- Insert or update the daily total
  INSERT INTO daily_totals (user_id, date, total_words)
  VALUES (NEW.user_id, session_date, NEW.word_count)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    total_words = daily_totals.total_words + NEW.word_count,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily totals when a new session is added
DROP TRIGGER IF EXISTS update_daily_totals_trigger ON sessions;
CREATE TRIGGER update_daily_totals_trigger
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_daily_totals();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on daily_totals
DROP TRIGGER IF EXISTS set_timestamp ON daily_totals;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON daily_totals
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create a view to show weekly statistics for each user
CREATE OR REPLACE VIEW user_weekly_stats AS
SELECT 
  user_id,
  date_trunc('week', date) AS week_start,
  SUM(total_words) AS weekly_words,
  COUNT(DISTINCT date) AS active_days
FROM daily_totals
GROUP BY user_id, date_trunc('week', date);

-- Create a view to show user rankings by total words
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
  user_id,
  SUM(total_words) AS total_words,
  COUNT(DISTINCT date) AS active_days,
  SUM(total_words) / GREATEST(COUNT(DISTINCT date), 1) AS avg_words_per_active_day,
  MIN(date) AS first_active_day,
  MAX(date) AS last_active_day
FROM daily_totals
GROUP BY user_id
ORDER BY total_words DESC; 