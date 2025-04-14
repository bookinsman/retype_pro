-- Add demo access codes for testing stats and progress
-- Run this script in the Supabase SQL Editor

-- Add demo digital access codes
INSERT INTO access_codes (code, code_type, is_used)
VALUES 
  ('DEMO000', 'digital', false),
  ('DEMO001', 'digital', false),
  ('DEMO002', 'digital', false),
  ('DEMO003', 'digital', false),
  ('TESTCODE', 'digital', false),
  ('READLETA', 'digital', false);

-- Add test physical access codes
INSERT INTO access_codes (code, code_type, is_used)
VALUES 
  ('PHDEMO01', 'physical', false),
  ('PHDEMO02', 'physical', false);

-- Optionally, add a pre-registered user with usage history for testing
-- First, generate a UUID (this would normally be done by the application)
DO $$
DECLARE
  demo_user_id uuid := '12345678-1234-1234-1234-123456789abc';
BEGIN
  -- Mark one code as used by this demo user
  UPDATE access_codes 
  SET 
    is_used = true,
    user_id = demo_user_id,
    used_at = NOW() - INTERVAL '7 days'
  WHERE code = 'DEMO000';

  -- Add some sample user stats for this user
  INSERT INTO user_stats (user_id, words, texts, time_spent_seconds, speed)
  VALUES (demo_user_id, 5280, 15, 3600, 88);

  -- Add daily stats for the past week
  INSERT INTO user_daily_stats (user_id, date, total_words)
  VALUES 
    (demo_user_id, CURRENT_DATE - INTERVAL '6 days', 520),
    (demo_user_id, CURRENT_DATE - INTERVAL '5 days', 780),
    (demo_user_id, CURRENT_DATE - INTERVAL '4 days', 350),
    (demo_user_id, CURRENT_DATE - INTERVAL '3 days', 920),
    (demo_user_id, CURRENT_DATE - INTERVAL '2 days', 640),
    (demo_user_id, CURRENT_DATE - INTERVAL '1 day', 1200),
    (demo_user_id, CURRENT_DATE, 870);

  -- Add some progress records
  INSERT INTO user_progress (user_id, content_id, content_type, completed, completed_at)
  VALUES
    (demo_user_id, 'p1', 'paragraph', true, NOW() - INTERVAL '6 days'),
    (demo_user_id, 'p2', 'paragraph', true, NOW() - INTERVAL '5 days'),
    (demo_user_id, 'p3', 'paragraph', true, NOW() - INTERVAL '4 days'),
    (demo_user_id, 'p4', 'paragraph', true, NOW() - INTERVAL '3 days'),
    (demo_user_id, 'p5', 'paragraph', true, NOW() - INTERVAL '2 days'),
    (demo_user_id, 'p6', 'paragraph', false, NULL);
END $$; 