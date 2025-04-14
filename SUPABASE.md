# Retyping Platform: Supabase Strategy for AI Developer

This README provides a complete step-by-step plan optimized for AI-assisted coding environments (e.g., AI coding agents). It's designed to be followed logically and efficiently for building a retyping-based educational platform using Supabase. The platform supports embedded educational content with multiple paragraphs and unlockable sections triggered by successful retyping events.

## 🎯 Platform Purpose (MVP Simplified)

Track and display:
- Today's retyped words (live feedback)
- Weekly retyped words (progress chart)
- Total retyped words (lifetime count)

Focus only on word count to simplify schema, improve performance, and minimize cost.
Also supports dynamically embedded content sets, each containing multiple paragraphs and a wisdom section, where new titles are revealed upon retyping success.

## ✅ STEP 1: Set Up Database Schema

### 1.1 word_logs – Raw Word Entry Logs

Store every retyping event as a word count.

```sql
CREATE TABLE word_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  word_count int NOT NULL,
  created_at timestamp DEFAULT now()
);
```

### 1.2 word_daily_summary – Daily Snapshot for Weekly Views

Used to build weekly charts or progress feedback.

```sql
CREATE TABLE word_daily_summary (
  user_id uuid,
  date date,
  total_words int,
  PRIMARY KEY (user_id, date)
);
```

### 1.3 access_codes – For User Authentication (No Emails)

```sql
CREATE TABLE access_codes (
  code text PRIMARY KEY,
  code_type text CHECK (code_type IN ('physical', 'digital')),
  user_id uuid, -- nullable until assigned
  is_used boolean DEFAULT false,
  used_at timestamp
);
```

You can prewrite codes such as PH123456 (physical) and DG123456 (digital) and assign them to the respective code_type.

### 1.4 content_sets and paragraphs – Dynamic Typing Units

Used to embed and track progress through educational content blocks.

```sql
CREATE TABLE content_sets (
  id text PRIMARY KEY,
  title text,
  subtitle text
);

CREATE TABLE paragraphs (
  id text PRIMARY KEY,
  content_set_id text REFERENCES content_sets(id),
  content text,
  order_index int,
  completed boolean DEFAULT false
);

CREATE TABLE wisdom_sections (
  id text PRIMARY KEY,
  content_set_id text REFERENCES content_sets(id),
  type text,
  title text,
  content text,
  completed boolean DEFAULT false
);
```

## ✅ STEP 2: Implement Access Code Login

### 2.1 User Input
Input screen where user enters a prewritten access code.

### 2.2 Access Code Logic
```javascript
const { data: codeEntry } = await supabase
  .from('access_codes')
  .select('*')
  .eq('code', enteredCode)
  .eq('is_used', false)
  .single();

if (codeEntry) {
  const userId = crypto.randomUUID();
  await supabase.from('access_codes').update({
    is_used: true,
    user_id: userId,
    used_at: new Date().toISOString()
  }).eq('code', enteredCode);
  localStorage.setItem('user_id', userId);
  localStorage.setItem('access_type', codeEntry.code_type); // optional usage
} else {
  alert('Invalid or used code');
}
```

### 2.3 Store user_id
Keep the user_id in localStorage and use it for all queries.
You may also store code_type for analytics or access filtering later.

## ✅ STEP 3: Live Stats Queries

### 3.1 Today's Words (Live)
```javascript
const today = new Date().toISOString().split('T')[0];
const userId = localStorage.getItem('user_id');

const { data } = await supabase
  .from('word_logs')
  .select('word_count')
  .eq('user_id', userId)
  .gte('created_at', `${today}T00:00:00Z`);

const wordsToday = data.reduce((sum, row) => sum + row.word_count, 0);
```

### 3.2 Weekly Words (from summary)
```javascript
const fromDate = new Date();
fromDate.setDate(fromDate.getDate() - 6);
const from = fromDate.toISOString().split('T')[0];

const { data } = await supabase
  .from('word_daily_summary')
  .select('total_words')
  .eq('user_id', userId)
  .gte('date', from);

const weeklyTotal = data.reduce((sum, row) => sum + row.total_words, 0);
```

### 3.3 Total Words (All Time)
```javascript
const { data } = await supabase
  .from('word_logs')
  .select('word_count')
  .eq('user_id', userId);

const totalWords = data.reduce((sum, row) => sum + row.word_count, 0);
```

## ✅ STEP 4: CRON Job – Daily Word Summary

Run once/day to populate the word_daily_summary table.

### Function Logic (Pseudocode)
```javascript
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const ymd = yesterday.toISOString().split('T')[0];

const { data: users } = await supabase
  .from('access_codes')
  .select('user_id')
  .not('user_id', 'is', null);

for (const user of users) {
  const { data: logs } = await supabase
    .from('word_logs')
    .select('word_count')
    .eq('user_id', user.user_id)
    .gte('created_at', `${ymd}T00:00:00Z`)
    .lte('created_at', `${ymd}T23:59:59Z`);

  const total_words = logs.reduce((sum, log) => sum + log.word_count, 0);

  await supabase.from('word_daily_summary').upsert({
    user_id: user.user_id,
    date: ymd,
    total_words
  });
}
```

CRON schedule: 0 0 * * *

Use Service Role

## ✅ STEP 5: Performance Strategy Summary

| Task | Frequency | Cost Impact | Notes |
|------|-----------|-------------|--------|
| Insert word log | Per task | Low | 1 row per session |
| Read today's words | On page load | Low | Only filter by today |
| CRON summary | Daily | Very low | Run once, store 1 summary row |
| Weekly query | On dashboard | Tiny | Only 7 rows read |
| Total words | Rarely | Medium | Cache in frontend optionally |