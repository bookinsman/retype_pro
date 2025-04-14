# Demo Access Codes for Readleta

This document provides demo access codes and instructions for testing the Readleta application's stats and progress tracking functionality.

## Available Demo Codes

### Digital Access Codes
- `DEMO000` - Pre-assigned to a demo user with usage history (used)
- `DEMO001` - Fresh demo code (unused)
- `DEMO002` - Fresh demo code (unused)
- `DEMO003` - Fresh demo code (unused)
- `TESTCODE` - Easy to remember test code (unused)
- `READLETA` - Branded test code (unused)

### Physical Access Codes
- `PHDEMO01` - Simulated physical code (unused)
- `PHDEMO02` - Simulated physical code (unused)

## Setting Up Demo Accounts

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `src/scripts/add_demo_accounts.sql`
4. Run the SQL script to add the demo codes to your database

## Testing with the Demo Codes

### Fresh Experience
Use one of the unused codes (`DEMO001`, `DEMO002`, `DEMO003`, `TESTCODE`, or `READLETA`) to test the new user experience. These codes will:
- Allow you to sign in as a new user
- Start with zero statistics
- Show all paragraphs as uncompleted

### Pre-populated Experience
The demo user associated with `DEMO000` already has:
- A history of usage over 7 days
- Completed paragraphs 1-5 
- A total of 5,280 words recorded
- Daily stats for the past week

Note: You cannot directly sign in with `DEMO000` as it's already marked as used. The pre-populated stats are useful for viewing in the database to verify that the stats collection is working correctly.

## Implementation Notes

The demo user has the following fixed UUID: `12345678-1234-1234-1234-123456789abc`

This can be useful for debugging purposes if you need to query the database directly to check the user's stats or progress.

## Cleaning Up

To reset the demo environment, you can run the following SQL:

```sql
-- Delete the demo user's data
DELETE FROM user_stats WHERE user_id = '12345678-1234-1234-1234-123456789abc';
DELETE FROM user_daily_stats WHERE user_id = '12345678-1234-1234-1234-123456789abc';
DELETE FROM user_progress WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- Reset all demo access codes
DELETE FROM access_codes WHERE code LIKE 'DEMO%' OR code LIKE 'PHDEMO%' OR code = 'TESTCODE' OR code = 'READLETA';
``` 