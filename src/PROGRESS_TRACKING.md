# Progress Tracking Strategy

## Current Issues

Our app is experiencing problems with tracking user progress:

1. **User access and authentication** - We're creating demo users but not properly storing their access in the `access_codes` table
2. **Progress tracking** - The app uses complex table structures that don't match the schema in SUPABASE.md
3. **Error handling** - Too many fallbacks to localStorage instead of using the simplified schema

## Correct Approach (Based on SUPABASE.md)

The schema in SUPABASE.md defines these simpler tables:

1. `word_logs` - Store each retyping event as a word count
2. `word_daily_summary` - Daily summary of words for weekly charts
3. `access_codes` - For user authentication 
4. `content_sets` and `paragraphs` - For tracking content progress

## Implementation Fix

### 1. User Authentication

```javascript
// When a user logs in with an access code:
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
  localStorage.setItem('access_type', codeEntry.code_type);
}
```

### 2. Tracking Word Count

```javascript
// After completing a paragraph:
const wordCount = text.trim().split(/\s+/).length;

await supabase
  .from('word_logs')
  .insert({
    user_id: userId,
    word_count: wordCount
  });
```

### 3. Getting Today's Progress

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

### 4. Getting Weekly Progress

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

### 5. Getting Total Words

```javascript
const { data } = await supabase
  .from('word_logs')
  .select('word_count')
  .eq('user_id', userId);

const totalWords = data.reduce((sum, row) => sum + row.word_count, 0);
```

## Implementation Plan

1. Verify that the database tables match the schema in SUPABASE.md
2. Update the access code authentication to create proper user IDs
3. Simplify word tracking to use `word_logs` instead of complex progress tables
4. Use the simplified queries from SUPABASE.md for statistics retrieval
5. Keep the localStorage fallbacks, but make them secondary to the simplified Supabase approach

By following this simplified approach:
- Tables will be correctly structured per SUPABASE.md
- We'll avoid the current database errors
- User progress will be properly saved
- The UI will correctly display statistics 