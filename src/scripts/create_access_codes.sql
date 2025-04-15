-- Script to create real access codes for production use
-- Run this script against your Supabase database to insert valid access codes

-- First ensure the access_codes table exists
CREATE TABLE IF NOT EXISTS access_codes (
  code text PRIMARY KEY,
  code_type text CHECK (code_type IN ('physical', 'digital')),
  user_id uuid,
  is_used boolean DEFAULT false,
  used_at timestamp,
  created_at timestamp DEFAULT now()
);

-- Clean up any existing demo codes
DELETE FROM access_codes WHERE code_type = 'demo';

-- Insert physical access codes (for physical cards/materials)
INSERT INTO access_codes (code, code_type, is_used)
VALUES 
  ('PH89345', 'physical', false),
  ('PH56712', 'physical', false),
  ('PH23489', 'physical', false),
  ('PH77654', 'physical', false),
  ('PH43210', 'physical', false),
  ('PH98765', 'physical', false),
  ('PH12345', 'physical', false),
  ('PH67890', 'physical', false),
  ('PH24680', 'physical', false),
  ('PH13579', 'physical', false),
  ('PH45231', 'physical', false),
  ('PH78932', 'physical', false),
  ('PH55123', 'physical', false),
  ('PH61298', 'physical', false),
  ('PH73428', 'physical', false),
  ('PH39654', 'physical', false),
  ('PH82176', 'physical', false),
  ('PH19487', 'physical', false),
  ('PH36742', 'physical', false),
  ('PH91025', 'physical', false);

-- Insert digital access codes (for email/online distribution)
INSERT INTO access_codes (code, code_type, is_used)
VALUES 
  ('DG45678', 'digital', false),
  ('DG87654', 'digital', false),
  ('DG34567', 'digital', false),
  ('DG76543', 'digital', false),
  ('DG23456', 'digital', false),
  ('DG65432', 'digital', false),
  ('DG12345', 'digital', false),
  ('DG54321', 'digital', false),
  ('DG98765', 'digital', false),
  ('DG56789', 'digital', false),
  ('DG78123', 'digital', false),
  ('DG32198', 'digital', false),
  ('DG67234', 'digital', false),
  ('DG89012', 'digital', false),
  ('DG43219', 'digital', false),
  ('DG21987', 'digital', false),
  ('DG67521', 'digital', false),
  ('DG13579', 'digital', false),
  ('DG24680', 'digital', false),
  ('DG36925', 'digital', false);

-- Create a view to monitor code usage
CREATE OR REPLACE VIEW access_code_usage AS
SELECT 
  code_type,
  COUNT(*) AS total_codes,
  SUM(CASE WHEN is_used THEN 1 ELSE 0 END) AS used_codes,
  SUM(CASE WHEN NOT is_used THEN 1 ELSE 0 END) AS available_codes
FROM access_codes
GROUP BY code_type; 