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

/**
 * Gets the current user ID from localStorage, or creates a new one if not found
 * @returns The current user ID
 */
export function getUserId(): string {
  // Check for a locally stored user ID
  const storedId = localStorage.getItem('user_id') || localStorage.getItem('userId');
  
  if (storedId) {
    // Check if we need to migrate from old "LOCAL-" format to proper UUID
    if (storedId.startsWith('LOCAL-') ||
        storedId.startsWith('DEMO') ||
        storedId.length < 20) {
      console.log('Detected old format user ID, migrating to UUID format');
      
      // Generate a new proper UUID
      const newUserId = crypto.randomUUID();
      
      // Store this new ID in both formats for backward compatibility
      localStorage.setItem('user_id', newUserId);
      localStorage.setItem('userId', newUserId);
      
      return newUserId;
    }
    
    return storedId;
  }

  // No user ID exists, we need to create one
  try {
    const userId = crypto.randomUUID();
    
    console.log('Creating new user with ID:', userId);
    
    // Store user ID in both formats for backward compatibility
    localStorage.setItem('user_id', userId);
    localStorage.setItem('userId', userId);
    
    // Initialize new user in the background
    ensureUserInitialized(userId);
    
    return userId;
  } catch (e) {
    console.error('Error creating user ID:', e);
    
    // Fallback to a simple random ID in case of any issues
    const fallbackId = 'USER-' + Math.random().toString(36).substring(2, 10);
    
    localStorage.setItem('user_id', fallbackId);
    localStorage.setItem('userId', fallbackId);
    
    return fallbackId;
  }
}

/**
 * Alias for getUserId to maintain compatibility with imports in other files
 * @returns The current user ID
 */
export function getCurrentUserId(): string {
  return getUserId();
}

/**
 * Checks if there is currently an authenticated user
 * @returns True if a user ID exists, false otherwise
 */
export function isAuthenticated(): boolean {
  const userId = getUserId();
  return !!userId && userId.length > 0;
}

/**
 * Validates an access code and assigns it to the current user if valid
 * @param code The access code to validate
 * @returns Object with success flag and message
 */
export async function validateAccessCode(code: string): Promise<{ success: boolean; message?: string; }> {
  // Basic validation
  if (!code || typeof code !== 'string') {
    console.log('Invalid access code format');
    return { success: false, message: 'Neteisingas prieigos kodo formatas.' };
  }
  
  if (code.length < 3 || code.length > 20) {
    console.log('Access code must be between 3 and 20 characters');
    return { success: false, message: 'Prieigos kodas turi būti nuo 3 iki 20 simbolių.' };
  }
  
  try {
    // First check if the code already exists and if it's already used
    const { data: accessCode, error: fetchError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();
    
    if (fetchError) {
      console.log('Error checking access code:', fetchError.message);
      return { success: false, message: 'Neteisingas prieigos kodas.' };
    }
    
    if (!accessCode) {
      console.log('Access code not found in database');
      return { success: false, message: 'Neteisingas prieigos kodas.' };
    }
    
    if (accessCode.is_used) {
      console.log('Access code already used');
      return { success: false, message: 'Šis prieigos kodas jau panaudotas.' };
    }
    
    // Generate a new user ID for this access code
    const userId = crypto.randomUUID();
    
    // Mark the access code as used
    const { error: updateError } = await supabase
      .from('access_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
        user_id: userId
      })
      .eq('code', code);
    
    if (updateError) {
      console.log('Error updating access code:', updateError.message);
      return { success: false, message: 'Klaida aktyvuojant prieigos kodą.' };
    }
    
    // Store user info in localStorage
    localStorage.setItem('user_id', userId);
    localStorage.setItem('userId', userId);
    localStorage.setItem('code_type', accessCode.code_type);
    
    // Initialize the user in the database
    await ensureUserInitialized(userId);
    
    console.log('Successfully validated access code');
    return { success: true };
  } catch (e) {
    console.error('Exception in validateAccessCode:', e);
    return { success: false, message: 'Įvyko klaida tikrinant prieigos kodą.' };
  }
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
    
    const userId = getUserId();
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
  
    // Format paragraphs with completion status from both localStorage and remote data
    const paragraphs: Paragraph[] = paragraphsData.map((p: {
      id: string;
      content: string;
      order_index: number;
    }) => {
      // Check localStorage first for more reliable completion status
      const localStorageKey = `paragraph_${p.id}_completed`;
      const isCompletedLocally = localStorage.getItem(localStorageKey) === 'true';
      
      return {
        id: p.id,
        content: p.content,
        order: p.order_index,
        // Prioritize localStorage over remote data
        completed: isCompletedLocally || paragraphProgress[p.id] || false
      };
    });
    
    // Format wisdom sections with completion status
    const wisdomSections: WisdomSection[] = wisdomData.map((w: {
      id: string;
      type: "quote";
      title: string;
      content: string;
    }) => {
      // Check localStorage first for more reliable completion status
      const localStorageKey = `wisdom_${w.id}_completed`;
      const isCompletedLocally = localStorage.getItem(localStorageKey) === 'true';
      
      return {
        id: w.id,
        type: w.type,
        title: w.title,
        content: w.content,
        // Prioritize localStorage over remote data
        completed: isCompletedLocally || wisdomProgress[w.id] || false
      };
    });
    
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

// Check if there's a user_progress table
let hasCheckedTables = false;
let hasUserProgressTable = false;

// Verify database tables and create them if needed
async function ensureTablesExist(): Promise<boolean> {
  if (hasCheckedTables) {
    return hasUserProgressTable;
  }
  
  try {
    console.log('Checking if user_progress table exists...');
    
    // Try to read user_progress table structure
    const { data, error } = await supabase
      .from('user_progress')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Error checking user_progress table:', error.message);
      hasUserProgressTable = false;
    } else {
      console.log('user_progress table exists');
      hasUserProgressTable = true;
    }
    
    hasCheckedTables = true;
    return hasUserProgressTable;
  } catch (e) {
    console.error('Exception checking tables:', e);
    hasCheckedTables = true;
    hasUserProgressTable = false;
    return false;
  }
}

// Update content progress (paragraph or wisdom section)
export async function updateContentProgress(
  contentId: string, 
  contentType: 'paragraph' | 'wisdom',
  completed: boolean
): Promise<boolean> {
  const userId = getUserId();
  if (!userId) {
    console.error('User not authenticated');
    return false;
  }
  
  // Always save locally first for reliability
  saveProgressLocally(userId, contentId, contentType, completed);
  
  try {
    console.log(`Updating progress for user ${userId}, content ${contentId}, type ${contentType}, completed ${completed}`);
    
    // Check if the table exists
    const tableExists = await ensureTablesExist();
    if (!tableExists) {
      console.warn('user_progress table does not exist, using local storage only');
      return true; // Return success, we've already saved locally
    }
    
    // Check if progress record exists - use a simpler query that's less likely to fail
    try {
      const { data: existingProgress, error: lookupError } = await supabase
        .from('user_progress')
        .select('id, user_id, content_id, content_type, completed')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('content_type', contentType);
      
      if (lookupError) {
        console.error('Error checking for existing progress:', lookupError.message, lookupError.details);
        return true; // Already saved locally
      }
      
      console.log('Existing progress check result:', existingProgress ? existingProgress.length : 0, 'records found');
      
      // If we have existing progress records
      if (existingProgress && existingProgress.length > 0) {
        // Update the first record we found
        const progressRecord = existingProgress[0];
        console.log('Updating existing progress record with ID:', progressRecord.id);
        
        try {
          const { error } = await supabase
            .from('user_progress')
            .update({ 
              completed,
              completed_at: completed ? new Date().toISOString() : null
            })
            .eq('id', progressRecord.id);
            
          if (error) {
            console.error('Error updating progress in database:', error.message, error.details);
            console.error('Failed to update record with ID:', progressRecord.id);
          } else {
            console.log('Successfully updated progress in database');
          }
        } catch (updateError) {
          console.error('Exception during progress update:', updateError);
        }
      } else {
        // Create new record - but only if we know the table exists
        console.log('Creating new progress record');
        
        try {
          const { data: insertData, error } = await supabase
            .from('user_progress')
            .insert({
              user_id: userId,
              content_id: contentId,
              content_type: contentType,
              completed,
              completed_at: completed ? new Date().toISOString() : null
            })
            .select();
            
          if (error) {
            console.error('Error creating progress in database:', error.message, error.details);
            console.error('Failed to insert with data:', { user_id: userId, content_id: contentId, content_type: contentType, completed });
          } else {
            console.log('Successfully created new progress record:', insertData);
          }
        } catch (insertError) {
          console.error('Exception during progress creation:', insertError);
        }
      }
    } catch (lookupError) {
      console.error('Exception during progress lookup:', lookupError);
    }
    
    // Always return success since we've saved locally
    return true;
  } catch (error) {
    console.error('Exception in updateContentProgress:', error instanceof Error ? error.message : String(error));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    return true; // Return success to keep the app working, we've already saved locally
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

/**
 * Logs a fixed word count (for backward compatibility)
 * This function will be replaced by the more comprehensive sessionService approach
 */
export async function logWordCount(wordCount: number): Promise<boolean> {
  // Import the logWordCount function from sessionService
  const { logWordCount: logWordCountInSession } = await import('./sessionService');
  
  // Forward the call to the new implementation
  return logWordCountInSession(wordCount);
}

// Get today's word count
export async function getTodayWordCount(): Promise<number> {
  try {
    const userId = getUserId();
    if (!userId) {
      console.log('No user ID found, returning 0 word count');
      return 0;
    }

    // Try to get from local storage first for immediate feedback
    const localStats = getLocalStats(userId);
    if (localStats !== null) {
      console.log('Using locally cached today word count:', localStats.todayWords);
      return localStats.todayWords;
    }

    const today = new Date().toISOString().split('T')[0];
    console.log(`Fetching today's (${today}) word count for user ${userId}`);

    try {
      // Query word_logs table as per SUPABASE.md schema
      const { data, error } = await supabase
        .from('word_logs')
        .select('word_count')
        .eq('user_id', userId)
        .gte('created_at', `${today}T00:00:00Z`);

      if (error) {
        console.error('Error fetching today\'s word count from word_logs:', error.message);
        
        // Fall back to legacy table
        console.log('Falling back to legacy user_daily_stats table');
        const { data: legacyData, error: legacyError } = await supabase
          .from('user_daily_stats')
          .select('total_words')
          .eq('user_id', userId)
          .eq('date', today)
          .single();

        if (legacyError) {
          console.log('Legacy table fallback also failed:', legacyError.message);
          return 0;
        }

        return legacyData?.total_words || 0;
      }

      // Sum up all word counts for today
      const todayWords = data?.reduce((sum, row) => sum + row.word_count, 0) || 0;
      console.log('Today\'s word count from word_logs:', todayWords);
      
      // Update local cache
      saveStatsLocally(userId, 0); // Just to update the cache without adding words
      
      return todayWords;
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
  const userId = getUserId();
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
    const userId = getUserId();
    if (!userId) {
      console.error('User not authenticated');
      return 0;
    }

    // Try to get from local storage first for immediate feedback
    const localStats = getLocalStats(userId);
    if (localStats !== null) {
      console.log('Using locally cached total word count:', localStats.totalWords);
      return localStats.totalWords;
    }

    console.log('Fetching total word count for user:', userId);
    
    try {
      // Query word_logs table per SUPABASE.md schema
      const { data, error } = await supabase
        .from('word_logs')
        .select('word_count')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching total word count from word_logs:', error.message);
        
        // Fallback to legacy user_stats table
        console.log('Falling back to legacy user_stats table');
        const { data: legacyData, error: legacyError } = await supabase
          .from('user_stats')
          .select('words')
          .eq('user_id', userId)
          .single();

        if (!legacyError && legacyData) {
          return legacyData.words;
        }

        // Further fallback to summing legacy daily stats
        console.log('Falling back to legacy daily stats summing');
        const { data: legacyDailyData, error: legacyDailyError } = await supabase
          .from('user_daily_stats')
          .select('total_words')
          .eq('user_id', userId);

        if (legacyDailyError) {
          console.error('All fallbacks failed for total word count');
          return 0;
        }

        return legacyDailyData?.reduce((sum, row) => sum + row.total_words, 0) || 0;
      }

      // Sum up all word counts
      const totalWords = data?.reduce((sum, row) => sum + row.word_count, 0) || 0;
      console.log('Total word count from word_logs:', totalWords);
      
      return totalWords;
    } catch (e) {
      console.error('Error in getting total word count:', e);
      return 0;
    }
  } catch (e) {
    console.error('Exception in getTotalWordCount:', e);
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
  const userId = getUserId();
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
    const userId = getUserId();
    if (!userId) {
      console.log('No user ID found, cannot update stats');
      return false;
    }
    
    // Always save to local storage immediately for reliable backup
    try {
      saveStatsLocally(userId, wordCount);
      console.log(`Stats saved locally successfully for user: ${userId}`);
    } catch (localSaveError) {
      console.error('Failed to save stats locally:', localSaveError);
    }
    
    // Skip Supabase operations if user ID starts with 'LOCAL-'
    if (userId.startsWith('LOCAL-')) {
      console.log('Using local-only mode for stats, skipping Supabase updates');
      return true;
    }
    
    // For demo users, also skip Supabase for better performance
    if (userId.startsWith('DEMO')) {
      console.log('Demo user detected, using localStorage only for better performance');
      return true;
    }
  
    const today = new Date().toISOString().split('T')[0];
    
    // Log the update attempt for debugging
    console.log(`Updating stats for user ${userId}: +${wordCount} words, date: ${today}`);
  
    // Try to update daily stats
    try {
      // Find existing daily stats - use simpler query
      const { data: existingDailyStats, error: fetchError } = await supabase
        .from('user_daily_stats')
        .select('id, total_words')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();
  
      if (fetchError) {
        console.error('Error fetching daily stats:', fetchError.message, fetchError.details);
        console.log('Using localStorage fallback for stats');
      } else if (existingDailyStats) {
        // Update existing record with minimal data
        try {
          console.log(`Updating daily stats record id: ${existingDailyStats.id}`);
          console.log(`Current total words: ${existingDailyStats.total_words || 0}, adding ${wordCount}`);
          
          // Handle update with more error catching
          try {
            const updateResult = await supabase
              .from('user_daily_stats')
              .update({
                total_words: (existingDailyStats.total_words || 0) + wordCount,
                last_updated: new Date().toISOString()
              })
              .eq('id', existingDailyStats.id);
            
            const error = updateResult.error;
            
            if (error) {
              // Use separate log statements to avoid errors in compilation
              console.log('Error updating daily stats');
              console.log('Error message:', error.message);
              if (error.details) console.log('Error details:', error.details);
            } else {
              console.log(`Successfully updated daily stats for ${userId}`);
            }
          } catch (innerUpdateError) {
            console.log('Exception in supabase update operation:', innerUpdateError);
          }
        } catch (updateError) {
          console.log('Exception in update daily stats block:', updateError);
        }
      } else {
        // Create new record
        try {
          await createNewDailyStats(userId, today, wordCount);
        } catch (createError) {
          console.log('Exception creating daily stats:', createError);
        }
      }
    } catch (dailyStatsError) {
      console.log('Error in daily stats handling:', dailyStatsError);
    }
    
    // Try to update total user stats
    try {
      // Find existing user stats - use simpler query
      const { data: existingUserStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('id, words')
        .eq('user_id', userId)
        .maybeSingle();
  
      if (fetchError) {
        console.error('Error fetching user stats:', fetchError.message, fetchError.details);
        console.log('Using localStorage fallback for total stats');
      } else if (existingUserStats) {
        // Update existing record with minimal data
        try {
          const { error } = await supabase
            .from('user_stats')
            .update({
              words: (existingUserStats.words || 0) + wordCount,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingUserStats.id);
          
          if (error) {
            console.error('Error updating user stats:', error.message, error.details);
          } else {
            console.log(`Successfully updated total stats for ${userId}`);
          }
        } catch (updateError) {
          console.error('Exception updating user stats:', updateError);
        }
      } else {
        // Create new record
        try {
          await createNewUserStats(userId, statsUpdate);
        } catch (createError) {
          console.error('Exception creating user stats:', createError);
        }
      }
    } catch (userStatsError) {
      console.error('Error handling user stats:', userStatsError);
    }
    
    return true; // Return success since we've saved to localStorage
  } catch (e) {
    console.error('Exception in updateUserStats:', e);
    return true; // Return success to allow app to continue even with errors
  }
}

// Helper function to create new daily stats
async function createNewDailyStats(userId: string, date: string, words: number | undefined): Promise<void> {
  try {
    console.log(`Creating new daily stats for ${userId} on ${date} with ${words || 0} words`);
    
    // Simplify data to reduce chances of validation errors
    const newDailyStats = {
      user_id: userId,
      date: date,
      total_words: words || 0
    };
    
    console.log('Inserting daily stats record');
    
    const { error } = await supabase
      .from('user_daily_stats')
      .insert(newDailyStats);
    
    if (error) {
      console.error('Could not create daily stats:', error.message, error.details);
      
      // Try upsert as an alternative if insert fails
      if (error.code === '23505') { // Duplicate key error code
        console.log('Attempting upsert as fallback for daily stats');
        const { error: upsertError } = await supabase
          .from('user_daily_stats')
          .upsert(newDailyStats);
          
        if (upsertError) {
          console.error('Upsert also failed for daily stats:', upsertError.message);
        } else {
          console.log('Successfully upserted daily stats');
        }
      }
    } else {
      console.log('Successfully created daily stats');
    }
  } catch (e) {
    console.error('Exception creating daily stats:', e);
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
    console.log(`Creating new user stats for ${userId} with ${stats.words || 0} words`);
    
    // Simplify data to reduce chances of validation errors
    const newUserStats = {
      user_id: userId,
      words: stats.words || 0
    };
    
    console.log('Inserting user stats record');
    
    const { error } = await supabase
      .from('user_stats')
      .insert(newUserStats);
    
    if (error) {
      console.error('Could not create user stats:', error.message, error.details);
      
      // Try upsert as an alternative if insert fails
      if (error.code === '23505') { // Duplicate key error code
        console.log('Attempting upsert as fallback for user stats');
        const { error: upsertError } = await supabase
          .from('user_stats')
          .upsert(newUserStats);
          
        if (upsertError) {
          console.error('Upsert also failed for user stats:', upsertError.message);
        } else {
          console.log('Successfully upserted user stats');
        }
      }
    } else {
      console.log('Successfully created user stats');
    }
  } catch (e) {
    console.error('Exception creating user stats:', e);
  }
}

// Save stats to localStorage
function saveStatsLocally(userId: string, wordCount: number): void {
  try {
    if (wordCount <= 0) {
      console.log('Skipping local stats update for zero or negative word count');
      return;
    }
    
    // Log the word count being added
    console.log(`saveStatsLocally: Adding ${wordCount} words for user ${userId}`);
    
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
    
    // Check if this is a new day
    if (stats.lastUpdated !== today) {
      console.log(`New day detected: Resetting today's words from ${stats.todayWords} to 0`);
      stats.todayWords = 0;
    }
    
    // For tracking and debugging
    console.log(`saveStatsLocally - Before: totalWords=${stats.totalWords}, todayWords=${stats.todayWords}, adding: ${wordCount}`);
    
    // Update stats
    stats.totalWords += wordCount;
    stats.todayWords += wordCount;
    stats.lastUpdated = today;
    
    // Save back to localStorage
    localStorage.setItem(statsKey, JSON.stringify(stats));
    console.log(`saveStatsLocally - After: totalWords=${stats.totalWords}, todayWords=${stats.todayWords}`);
    
    // Force a refresh of the stats key to ensure other components pick up the change
    localStorage.setItem('stats_last_updated', Date.now().toString());
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

// NEW: Function to ensure a user ID is initialized in all necessary tables
async function ensureUserInitialized(userId: string): Promise<void> {
  if (!userId) return;
  
  // Skip for local and demo users
  if (userId.startsWith('LOCAL-') || userId.startsWith('DEMO')) {
    console.log(`Skipping database initialization for local/demo user ${userId}`);
    return;
  }
  
  console.log(`Ensuring user ${userId} is initialized in all tables`);
  
  // Set the initialized flag to avoid multiple initializations in the same session
  const initKey = `user_${userId}_initialized`;
  if (localStorage.getItem(initKey)) {
    console.log(`User ${userId} already initialized in this session`);
    return;
  }
  
  // Set initialized flag immediately to prevent multiple attempts in rapid succession
  localStorage.setItem(initKey, 'true');
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Try to initialize user_stats - simplified data
    try {
      const { error } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          words: 0
        });
        
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error initializing user_stats:', error.message);
      }
    } catch (e) {
      console.error('Exception initializing user_stats:', e);
    }
    
    // Try to initialize user_daily_stats - simplified data
    try {
      const { error } = await supabase
        .from('user_daily_stats')
        .insert({
          user_id: userId,
          date: today,
          total_words: 0
        });
        
      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Error initializing user_daily_stats:', error.message);
      }
    } catch (e) {
      console.error('Exception initializing user_daily_stats:', e);
    }
    
    console.log(`Initialization attempted for user ${userId}`);
  } catch (error) {
    console.error(`Error initializing user ${userId}:`, error);
  }
} 