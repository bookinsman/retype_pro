# Supabase Setup for Typing Statistics

This document explains how to set up the Supabase database for the typing statistics system. The system tracks word counts through completed typing sessions and provides statistics for daily, weekly, and all-time performance.

## Database Schema

### 1. Sessions Table

This table stores each completed typing session with:

```sql
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

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_timestamp_idx ON sessions (timestamp);
```

### 2. Daily Totals Table

This table automatically aggregates word counts by day:

```sql
CREATE TABLE IF NOT EXISTS daily_totals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  total_words INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS daily_totals_user_id_idx ON daily_totals (user_id);
CREATE INDEX IF NOT EXISTS daily_totals_date_idx ON daily_totals (date);
```

## Database Triggers

### 1. Update Daily Totals Trigger

This trigger automatically updates the daily totals when a new session is added:

```sql
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

CREATE TRIGGER update_daily_totals_trigger
AFTER INSERT ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_daily_totals();
```

### 2. Updated Timestamp Trigger

This trigger automatically updates the `updated_at` column:

```sql
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON daily_totals
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

## Views

### 1. Weekly Stats View

This view provides weekly statistics for each user:

```sql
CREATE OR REPLACE VIEW user_weekly_stats AS
SELECT 
  user_id,
  date_trunc('week', date) AS week_start,
  SUM(total_words) AS weekly_words,
  COUNT(DISTINCT date) AS active_days
FROM daily_totals
GROUP BY user_id, date_trunc('week', date);
```

### 2. User Rankings View

This view provides user rankings based on total words:

```sql
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
```

## Setup Instructions

1. Copy the full SQL script from `src/scripts/setup_typing_database.sql`
2. Open your Supabase project
3. Go to the SQL Editor
4. Paste the SQL script
5. Run the script to create all tables, triggers, and views

## Integration with the Application

The application uses the following flow to track typing stats:

1. When a user completes a paragraph or wisdom section, the application:
   - Records both the original text and typed text in the `sessions` table
   - Calculates the word count automatically
   - The database trigger automatically updates `daily_totals`

2. When viewing statistics:
   - Today's words are fetched from `daily_totals` for the current date
   - Weekly stats are fetched from `daily_totals` for the last 7 days
   - All-time total is fetched by summing all entries in `daily_totals`

This approach provides real-time updates without the need for cron jobs or localStorage hacks. 