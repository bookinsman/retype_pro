import { createClient } from '@supabase/supabase-js';
import { ContentSet, Paragraph, WisdomSection } from './contentService';

// Replace with your Supabase URL and anon key
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://iohkmaljqbgfklhrlmyg.supabase.co';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaGttYWxqcWJnZmtsaHJsbXlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NTE3NTcsImV4cCI6MjA2MDIyNzc1N30.W1fRSc0lXj1KUEgDnUSkls3tkX2Y_z2NySFg4NDaFRk';

// Custom fetch to properly add headers
const customFetch = (url: RequestInfo | URL, options?: RequestInit) => {
  const headers = new Headers(options?.headers);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  headers.set('apikey', supabaseAnonKey);
  
  return fetch(url, {
    ...options,
    headers
  });
};

// Create Supabase client with required headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    fetch: customFetch
  }
});

// ========================
// ACCESS CODE FUNCTIONS
// ========================
export async function validateAccessCode(enteredCode: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
  codeType?: string;
}> {
  try {
    // Check if the code exists and is not used
    const { data: codeEntry, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', enteredCode)
      .eq('is_used', false)
      .single();

    if (error || !codeEntry) {
      return { success: false, error: 'Neteisingas arba jau panaudotas kodas.' };
    }

    // Generate a new user ID
    const userId = crypto.randomUUID();
    
    // Mark the code as used
    const { error: updateError } = await supabase
      .from('access_codes')
      .update({
        is_used: true,
        user_id: userId,
        used_at: new Date().toISOString()
      })
      .eq('code', enteredCode);

    if (updateError) {
      console.error('Error updating access code:', updateError);
      return { success: false, error: 'Klaida aktyvuojant kodą. Bandykite vėliau.' };
    }

    // Store the user ID and code type in localStorage
    localStorage.setItem('user_id', userId);
    localStorage.setItem('access_type', codeEntry.code_type);

    return { 
      success: true, 
      userId, 
      codeType: codeEntry.code_type 
    };
  } catch (error) {
    console.error('Access code validation error:', error);
    return { success: false, error: 'Serverio klaida. Bandykite vėliau.' };
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getCurrentUserId();
}

// Get the current user ID
export function getCurrentUserId(): string | null {
  // Try to get existing user ID
  const userId = localStorage.getItem('user_id');
  
  // If no user ID exists, create a demo user
  if (!userId) {
    const demoUserId = 'DEMO-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('user_id', demoUserId);
    localStorage.setItem('access_type', 'demo');
    console.log('Created demo user ID:', demoUserId);
    return demoUserId;
  }
  
  return userId;
}

// ========================
// CONTENT FUNCTIONS
// ========================

// Content fetching functions
export async function fetchContentSet(): Promise<ContentSet | null> {
  console.log('Fetching content set from Supabase', supabaseUrl);
  
  try {
    // First verify the connection to Supabase
    console.log('Testing Supabase connection...');
    try {
      // Test connection with a simple query to content_sets table instead of connection_test
      const { data: connectionTest, error: connectionError } = await supabase
        .from('content_sets')
        .select('count')
        .limit(1);
        
      if (connectionError) {
        console.error('Supabase connection test failed:', connectionError);
      } else {
        console.log('Supabase connection successful');
      }
    } catch (connectionTestError) {
      console.error('Failed to test Supabase connection:', connectionTestError);
    }
    
    // Get active content set
    console.log('Requesting content_sets from Supabase');
    const { data: contentSetData, error: contentSetError } = await supabase
      .from('content_sets')
      .select('*')
      .limit(1);
    
    if (contentSetError) {
      console.error('Error fetching content set:', contentSetError.message, contentSetError.details, contentSetError.hint);
      return null;
    }
    
    if (!contentSetData || contentSetData.length === 0) {
      console.error('No content sets found in the database');
      return null;
    }
    
    // Handle array result - take the first item from the array
    const contentSet = Array.isArray(contentSetData) ? contentSetData[0] : contentSetData;
    
    if (!contentSet || !contentSet.id) {
      console.error('Content set has no ID, data received:', contentSetData);
      return null;
    }
    
    console.log('Content set fetched successfully:', contentSet.id);
    
    // Get paragraphs for this content set
    console.log('Requesting paragraphs for content set:', contentSet.id);
    const { data: paragraphsData, error: paragraphsError } = await supabase
      .from('paragraphs')
      .select('*')
      .eq('content_set_id', contentSet.id)
      .order('order_index', { ascending: true });
    
    if (paragraphsError) {
      console.error('Error fetching paragraphs:', paragraphsError.message, paragraphsError.details, paragraphsError.hint);
      return null;
    }
    
    if (!paragraphsData || paragraphsData.length === 0) {
      console.error('No paragraphs found for content set:', contentSet.id);
      return null;
    }
    
    console.log('Paragraphs fetched successfully, count:', paragraphsData.length);
    
    // Get wisdom sections for this content set
    console.log('Requesting wisdom sections for content set:', contentSet.id);
    const { data: wisdomData, error: wisdomError } = await supabase
      .from('wisdom_sections')
      .select('*')
      .eq('content_set_id', contentSet.id);
    
    if (wisdomError) {
      console.error('Error fetching wisdom sections:', wisdomError.message, wisdomError.details, wisdomError.hint);
      return null;
    }
    
    if (!wisdomData) {
      console.error('No wisdom sections found for content set:', contentSet.id);
      return null;
    }
    
    console.log('Wisdom sections fetched successfully, count:', wisdomData.length);
    
    const userId = getCurrentUserId();
    console.log('Current user ID for progress tracking:', userId);
    let paragraphProgress: Record<string, boolean> = {};
    let wisdomProgress: Record<string, boolean> = {};
    
    // If user is authenticated, get their progress
    if (userId) {
      console.log('Fetching user progress for user:', userId);
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);
      
      if (progressError) {
        console.warn('Error fetching user progress:', progressError.message);
      }
      
      if (progressData) {
        console.log('User progress fetched successfully, count:', progressData.length);
        progressData.forEach((item: {
          content_id: string;
          content_type: string;
          completed: boolean;
        }) => {
          if (item.content_type === 'paragraph') {
            paragraphProgress[item.content_id] = item.completed;
          } else if (item.content_type === 'wisdom') {
            wisdomProgress[item.content_id] = item.completed;
          }
        });
      }
    }
    
    // Format paragraphs with completion status
    const paragraphs: Paragraph[] = paragraphsData.map((p: {
      id: string;
      content: string;
      order_index: number;
    }) => ({
      id: p.id,
      content: p.content,
      order: p.order_index,
      completed: paragraphProgress[p.id] || false
    }));
    
    // Format wisdom sections with completion status
    const wisdomSections: WisdomSection[] = wisdomData.map((w: {
      id: string;
      type: "quote";
      title: string;
      content: string;
    }) => ({
      id: w.id,
      type: w.type,
      title: w.title,
      content: w.content,
      completed: wisdomProgress[w.id] || false
    }));
    
    const result = {
      id: contentSet.id,
      title: contentSet.title,
      subtitle: contentSet.subtitle,
      paragraphs,
      wisdomSections
    };
    
    console.log('Content set assembled successfully with', paragraphs.length, 'paragraphs and', wisdomSections.length, 'wisdom sections');
    return result;
  } catch (error) {
    console.error('Unexpected error in fetchContentSet:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return null;
  }
}

// ========================
// PROGRESS TRACKING
// ========================

// Update content progress (paragraph or wisdom section)
export async function updateContentProgress(
  contentId: string, 
  contentType: 'paragraph' | 'wisdom',
  completed: boolean
): Promise<boolean> {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return false;
  }
  
  try {
    // Check if progress record exists
    const { data: existingProgress, error: lookupError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single();
    
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('Error checking for existing progress:', lookupError);
      // Save progress locally as fallback
      saveProgressLocally(userId, contentId, contentType, completed);
      return true; // Return success to keep the app working
    }
    
    if (existingProgress) {
      // Update existing record
      const { error } = await supabase
        .from('user_progress')
        .update({ 
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', existingProgress.id);
        
      if (error) {
        console.error('Error updating progress in database:', error);
        // Save progress locally as fallback
        saveProgressLocally(userId, contentId, contentType, completed);
      }
        
      return true; // Return success to keep the app working
    } else {
      // Create new record
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: userId,
          content_id: contentId,
          content_type: contentType,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        });
        
      if (error) {
        console.error('Error creating progress in database:', error);
        // Save progress locally as fallback
        saveProgressLocally(userId, contentId, contentType, completed);
      }
        
      return true; // Return success to keep the app working
    }
  } catch (error) {
    console.error('Exception in updateContentProgress:', error);
    // Save progress locally as fallback
    saveProgressLocally(userId, contentId, contentType, completed);
    return true; // Return success to keep the app working
  }
}

// Save progress locally when Supabase fails
function saveProgressLocally(
  userId: string,
  contentId: string,
  contentType: 'paragraph' | 'wisdom',
  completed: boolean
): void {
  try {
    // Get existing local progress
    const localProgressKey = `${userId}_local_progress`;
    const existingProgressJson = localStorage.getItem(localProgressKey);
    let progressData: Record<string, { type: string; completed: boolean }> = {};
    
    if (existingProgressJson) {
      try {
        progressData = JSON.parse(existingProgressJson);
      } catch (e) {
        console.error('Error parsing local progress data:', e);
      }
    }
    
    // Update the progress data
    progressData[contentId] = {
      type: contentType,
      completed: completed
    };
    
    // Save back to localStorage
    localStorage.setItem(localProgressKey, JSON.stringify(progressData));
    console.log('Progress saved locally as fallback');
  } catch (e) {
    console.error('Error saving progress locally:', e);
  }
}

// ========================
// WORD COUNT TRACKING
// ========================

// Log completed words
export async function logWordCount(wordCount: number): Promise<boolean> {
  // Update user stats with the word count
  return updateUserStats({ words: wordCount });
}

// Get today's word count
export async function getTodayWordCount(): Promise<number> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found, returning 0 word count');
      return 0;
    }

    // Try to get from local storage first
    const localStats = getLocalStats(userId);
    if (localStats !== null) {
      return localStats.todayWords;
    }

    const today = new Date().toISOString().split('T')[0];

    // Make a simpler request that won't trigger 406
    try {
      const { data, error } = await supabase
        .from('user_daily_stats')
        .select('total_words')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error) {
        // If the error is 'No rows found', it's normal for new users
        if (error.code === 'PGRST116') {
          return 0; // No data for today yet
        }
        console.error('Error fetching today\'s word count:', error);
        return 0;
      }

      return data?.total_words || 0;
    } catch (requestError) {
      console.log('Error fetching stats:', requestError);
      return 0;
    }
  } catch (e) {
    console.error('Exception in getTodayWordCount:', e);
    return 0; // Return 0 on any error
  }
}

// Get weekly word count
export async function getWeeklyWordCount(): Promise<number> {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return 0;
  }

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 6);
  const from = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_daily_stats')
    .select('total_words')
    .eq('user_id', userId)
    .gte('date', from);

  if (error) {
    console.error('Error fetching weekly word count:', error);
    return 0;
  }

  return data?.reduce((sum, row) => sum + row.total_words, 0) || 0;
}

// Get total word count (all time)
export async function getTotalWordCount(): Promise<number> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('User not authenticated');
      return 0;
    }

    // Try to get from local storage first
    const localStats = getLocalStats(userId);
    if (localStats !== null) {
      return localStats.totalWords;
    }

    // First try to get from user_stats table for better performance
    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .select('words')
      .eq('user_id', userId)
      .single();

    if (!userStatsError && userStats) {
      return userStats.words;
    }

    // Fallback to summing daily stats if user_stats not available
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('total_words')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching total word count:', error);
      return 0;
    }

    return data?.reduce((sum, row) => sum + row.total_words, 0) || 0;
  } catch (e) {
    console.error('Error in getTotalWordCount:', e);
    return 0;
  }
}

// Get daily word counts for the past week
export async function getWeeklyStats(): Promise<{ date: string; count: number }[]> {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  
  return fetchWeeklyStats(weekAgo, today);
}

// Fetch user stats for a date range
async function fetchWeeklyStats(
  startDate: Date,
  endDate: Date
): Promise<{ date: string; count: number }[]> {
  const userId = getCurrentUserId();
  if (!userId) {
    console.error('User not authenticated');
    return [];
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('user_daily_stats')
    .select('date, total_words')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', endDateStr)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching weekly stats:', error);
    return [];
  }

  // Fill in any missing dates with zero counts
  const result: { date: string; count: number }[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const existingData = data?.find(d => d.date === dateStr);
    
    result.push({
      date: dateStr,
      count: existingData ? existingData.total_words : 0
    });
    
    current.setDate(current.getDate() + 1);
  }

  return result;
}

// Update user stats
export async function updateUserStats(
  statsUpdate: {
    words?: number;
    texts?: number;
    timeSpentSeconds?: number;
    speed?: number;
  }
): Promise<boolean> {
  // Ensure words is never undefined
  const wordCount = statsUpdate.words || 0;

  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found, cannot update stats');
      return false;
    }
    
    // Always save to local storage as reliable backup
    saveStatsLocally(userId, wordCount);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Try to update daily stats
    try {
      // Find existing daily stats
      const { data: existingDailyStats, error: fetchError } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine - we'll create a new record
        console.log('No existing daily stats found, will create new entry');
      }
      
      if (existingDailyStats) {
        // Update existing record - use match criteria instead of ID
        const { error } = await supabase
          .from('user_daily_stats')
          .update({
            total_words: (existingDailyStats.total_words || 0) + wordCount
          })
          .eq('user_id', userId)
          .eq('date', today);
        
        if (error) {
          console.log('Error updating daily stats, trying insert instead:', error);
          // If update fails, try insert as fallback
          await createNewDailyStats(userId, today, wordCount);
        }
      } else {
        // Create new record
        await createNewDailyStats(userId, today, wordCount);
      }
    } catch (dailyStatsError) {
      console.log('Error handling daily stats:', dailyStatsError);
      // Continue with total stats even if daily stats fail
    }
    
    // Try to update total user stats
    try {
      // Find existing user stats
      const { data: existingUserStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.log('No existing user stats found, will create new entry');
      }
      
      if (existingUserStats) {
        // Update existing record
        const { error } = await supabase
          .from('user_stats')
          .update({
            words: (existingUserStats.words || 0) + wordCount,
            texts: (existingUserStats.texts || 0) + (statsUpdate.texts || 0),
            time_spent_seconds: (existingUserStats.time_spent_seconds || 0) + (statsUpdate.timeSpentSeconds || 0),
            speed: statsUpdate.speed || existingUserStats.speed || 0
          })
          .eq('user_id', userId);
        
        if (error) {
          console.log('Error updating user stats, trying insert instead:', error);
          // If update fails, try insert as fallback
          await createNewUserStats(userId, statsUpdate);
        }
      } else {
        // Create new record
        await createNewUserStats(userId, statsUpdate);
      }
    } catch (userStatsError) {
      console.log('Error handling user stats:', userStatsError);
      // Still return true to not block the user experience
    }
    
    return true; // Return success to allow app to continue even with DB errors
  } catch (e) {
    console.log('Exception in updateUserStats (continuing anyway):', e);
    return true; // Return success to allow app to continue even with errors
  }
}

// Helper function to create new daily stats
async function createNewDailyStats(userId: string, date: string, words: number | undefined): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_daily_stats')
      .insert({
        user_id: userId,
        date: date,
        total_words: words || 0 // Ensure words is never null
      });
    
    if (error) {
      console.log('Could not create daily stats:', error);
    }
  } catch (e) {
    console.log('Exception creating daily stats:', e);
  }
}

// Helper function to create new user stats
async function createNewUserStats(
  userId: string, 
  stats: {
    words?: number;
    texts?: number;
    timeSpentSeconds?: number;
    speed?: number;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_stats')
      .insert({
        user_id: userId,
        words: stats.words || 0, // Ensure words is never null
        texts: stats.texts || 0,
        time_spent_seconds: stats.timeSpentSeconds || 0,
        speed: stats.speed || 0
      });
    
    if (error) {
      console.log('Could not create user stats:', error);
    }
  } catch (e) {
    console.log('Exception creating user stats:', e);
  }
}

// Save stats to localStorage
function saveStatsLocally(userId: string, wordCount: number): void {
  try {
    const statsKey = `${userId}_word_stats`;
    const statsJson = localStorage.getItem(statsKey);
    let stats = {
      totalWords: 0,
      todayWords: 0,
      lastUpdated: ''
    };
    
    if (statsJson) {
      try {
        stats = JSON.parse(statsJson);
      } catch (e) {
        console.error('Error parsing local stats:', e);
      }
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // If last update was on a different day, reset today's words
    if (stats.lastUpdated !== today) {
      stats.todayWords = 0;
    }
    
    // Update stats
    stats.totalWords += wordCount;
    stats.todayWords += wordCount;
    stats.lastUpdated = today;
    
    // Save back to localStorage
    localStorage.setItem(statsKey, JSON.stringify(stats));
    console.log('Stats saved locally');
  } catch (e) {
    console.error('Error saving stats locally:', e);
  }
}

// Get stats from localStorage
function getLocalStats(userId: string): { totalWords: number; todayWords: number } | null {
  try {
    const statsKey = `${userId}_word_stats`;
    const statsJson = localStorage.getItem(statsKey);
    
    if (!statsJson) {
      return null;
    }
    
    const stats = JSON.parse(statsJson);
    const today = new Date().toISOString().split('T')[0];
    
    // If last update was on a different day, reset today's words
    if (stats.lastUpdated !== today) {
      stats.todayWords = 0;
      // Save the updated stats back to localStorage
      localStorage.setItem(statsKey, JSON.stringify({
        ...stats,
        todayWords: 0,
        lastUpdated: today
      }));
    }
    
    return {
      totalWords: stats.totalWords || 0,
      todayWords: stats.todayWords || 0
    };
  } catch (e) {
    console.error('Error getting local stats:', e);
    return null;
  }
} 