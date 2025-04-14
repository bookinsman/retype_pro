# Supabase Integration Setup

This document provides steps to set up the Supabase integration for the Retyping Platform.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Configuration Steps

### 1. Set Up Database Schema

1. Navigate to the SQL Editor in your Supabase project dashboard
2. Copy and paste the contents of `src/scripts/setup_supabase.sql` into the SQL Editor
3. Run the SQL script to set up all required tables and initial data

### 2. Set Up Environment Variables

1. Rename `.env.example` to `.env` (if not already done)
2. Update the `.env` file with your Supabase project credentials:
   ```
   REACT_APP_SUPABASE_URL=your-project-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```
   - Find your URL in Supabase Dashboard → Settings → API
   - Find your anon key in Supabase Dashboard → Settings → API → Project API keys

### 3. Test Access Codes

The SQL script has created the following test access codes:
- Physical codes: PH123456, PH123457
- Digital codes: DG123456, DG123457

You can use these to test the access code login functionality.

## Data Structure

### Access Codes
- Used for authentication without requiring emails
- One-time use codes that assign a UUID to each user
- Code types (physical/digital) can be used for analytics

### Word Tracking
- `word_logs` table tracks each retyping session
- `word_daily_summary` aggregates daily totals for performance

### Content Sets
- Contains paragraphs and wisdom sections that users retype
- Progress is tracked per user

## Daily Summary CRON Job

For production, set up a scheduled function in Supabase to run once per day to:
1. Aggregate the word counts for each user
2. Insert the totals into the `word_daily_summary` table

This enables efficient weekly progress reporting without querying all logs.

## Important Notes

- User IDs are stored in localStorage for simplicity
- In a production environment, consider adding more robust authentication
- The current implementation focuses on tracking word counts and paragraphs completed 