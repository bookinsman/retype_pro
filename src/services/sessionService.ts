import { supabase, getCurrentUserId } from './supabaseClient';
import { formatDateToYYYYMMDD } from './statsService';

/**
 * Interface for a typing session
 */
export interface TypingSession {
  id?: string;
  user_id: string;
  original_text: string;
  typed_text: string;
  word_count: number;
  timestamp: string;
  paragraph_id?: string;
  wisdom_id?: string;
  time_spent_seconds: number;
}

/**
 * Interface for daily statistics
 */
export interface DailyTotal {
  id?: string;
  user_id: string;
  date: string;
  total_words: number;
  time_spent_seconds: number;
}

/**
 * Count words in a text
 * @param text The text to count words in
 * @returns The number of words
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Time tracking variables
 */
let sessionStartTime: number | null = null;
let accumulatedTimeMs: number = 0;
let isTracking: boolean = false;
let trackingInterval: NodeJS.Timeout | null = null;

/**
 * Starts tracking time for the current typing session
 */
export function startTimeTracking(): void {
  if (isTracking) return; // Already tracking
  
  sessionStartTime = Date.now();
  isTracking = true;
  
  // Set up interval to periodically update accumulated time
  // This helps ensure we don't lose time if the app crashes
  trackingInterval = setInterval(() => {
    if (sessionStartTime) {
      accumulatedTimeMs += Date.now() - sessionStartTime;
      sessionStartTime = Date.now();
    }
  }, 30000); // Update every 30 seconds
}

/**
 * Pauses time tracking for the current typing session
 */
export function pauseTimeTracking(): void {
  if (!isTracking || !sessionStartTime) return;
  
  // Add the current session time to accumulated time
  accumulatedTimeMs += Date.now() - sessionStartTime;
  sessionStartTime = null;
  isTracking = false;
  
  // Clear the interval if it exists
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
}

/**
 * Resumes time tracking for the current typing session
 */
export function resumeTimeTracking(): void {
  if (isTracking) return;
  startTimeTracking();
}

/**
 * Resets time tracking for a new typing session
 */
export function resetTimeTracking(): void {
  pauseTimeTracking(); // Make sure tracking is stopped
  accumulatedTimeMs = 0;
  sessionStartTime = null;
  isTracking = false;
}

/**
 * Gets the current tracked time in seconds
 */
export function getTrackedTimeInSeconds(): number {
  let totalMs = accumulatedTimeMs;
  
  // Add current session time if actively tracking
  if (isTracking && sessionStartTime) {
    totalMs += Date.now() - sessionStartTime;
  }
  
  return Math.floor(totalMs / 1000);
}

/**
 * Save a typing session to Supabase
 * @param originalText The original text that was typed
 * @param typedText The text that the user typed
 * @param paragraphId Optional ID of the paragraph that was typed
 * @param wisdomId Optional ID of the wisdom section that was typed
 * @returns Promise with success/failure
 */
export async function saveTypingSession(
  originalText: string,
  typedText: string,
  paragraphId?: string,
  wisdomId?: string
): Promise<boolean> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, cannot save typing session');
      return false;
    }

    const wordCount = countWords(typedText);
    const timeSpentSeconds = getTrackedTimeInSeconds();
    console.log(`Saving typing session with ${wordCount} words for user ${userId}`);

    const newSession: TypingSession = {
      user_id: userId,
      original_text: originalText,
      typed_text: typedText,
      word_count: wordCount,
      timestamp: new Date().toISOString(),
      paragraph_id: paragraphId,
      wisdom_id: wisdomId,
      time_spent_seconds: timeSpentSeconds
    };

    const { error } = await supabase
      .from('sessions')
      .insert(newSession);

    if (error) {
      console.error('Error saving typing session:', error.message, error.details);
      return false;
    }

    console.log('Successfully saved typing session');
    resetTimeTracking();
    return true;
  } catch (error) {
    console.error('Exception in saveTypingSession:', error);
    return false;
  }
}

/**
 * Fetch today's total word count for the current user
 * @returns Promise with the total words typed today
 */
export async function fetchTodaysWordCount(): Promise<number> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return 0;

    const today = formatDateToYYYYMMDD(new Date());

    const { data, error } = await supabase
      .from('daily_totals')
      .select('total_words')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today\'s word count:', error.message);
      return 0;
    }

    return data?.total_words || 0;
  } catch (error) {
    console.error('Exception in fetchTodaysWordCount:', error);
    return 0;
  }
}

/**
 * Fetch today's time spent typing in seconds for the current user
 * @returns Promise with the time spent typing today in seconds
 */
export async function fetchTodaysTimeSpent(): Promise<number> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return 0;

    const today = formatDateToYYYYMMDD(new Date());

    const { data, error } = await supabase
      .from('daily_totals')
      .select('time_spent_seconds')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today\'s time spent:', error.message);
      return 0;
    }

    return data?.time_spent_seconds || 0;
  } catch (error) {
    console.error('Exception in fetchTodaysTimeSpent:', error);
    return 0;
  }
}

/**
 * Fetch weekly word counts for the current user
 * @param startDate The start date of the week (optional, defaults to 7 days ago)
 * @param endDate The end date of the week (optional, defaults to today)
 * @returns Promise with an array of daily word counts
 */
export async function fetchWeeklyWordCounts(
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ date: string; count: number }>> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];

    // Default to last 7 days if no dates provided
    const end = endDate || new Date();
    const start = startDate || new Date(end);
    if (!startDate) start.setDate(start.getDate() - 6); // 7 days including today

    const startStr = formatDateToYYYYMMDD(start);
    const endStr = formatDateToYYYYMMDD(end);

    const { data, error } = await supabase
      .from('daily_totals')
      .select('date, total_words')
      .eq('user_id', userId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date');

    if (error) {
      console.error('Error fetching weekly word counts:', error.message);
      return [];
    }

    // Create array with all dates in range (including zeros for days with no activity)
    const result: Array<{ date: string; count: number }> = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = formatDateToYYYYMMDD(current);
      const existingData = data?.find(d => d.date === dateStr);
      
      result.push({
        date: dateStr,
        count: existingData ? existingData.total_words : 0
      });
      
      current.setDate(current.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error('Exception in fetchWeeklyWordCounts:', error);
    return [];
  }
}

/**
 * Fetch weekly time spent typing in seconds for the current user
 * @param startDate The start date of the week (optional, defaults to 7 days ago)
 * @param endDate The end date of the week (optional, defaults to today)
 * @returns Promise with an array of daily time spent in seconds
 */
export async function fetchWeeklyTimeSpent(
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ date: string; count: number }>> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];

    // Default to last 7 days if no dates provided
    const end = endDate || new Date();
    const start = startDate || new Date(end);
    if (!startDate) start.setDate(start.getDate() - 6); // 7 days including today

    const startStr = formatDateToYYYYMMDD(start);
    const endStr = formatDateToYYYYMMDD(end);

    const { data, error } = await supabase
      .from('daily_totals')
      .select('date, time_spent_seconds')
      .eq('user_id', userId)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date');

    if (error) {
      console.error('Error fetching weekly time spent:', error.message);
      return [];
    }

    // Create array with all dates in range (including zeros for days with no activity)
    const result: Array<{ date: string; count: number }> = [];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = formatDateToYYYYMMDD(current);
      const existingData = data?.find(d => d.date === dateStr);
      
      result.push({
        date: dateStr,
        count: existingData ? existingData.time_spent_seconds : 0
      });
      
      current.setDate(current.getDate() + 1);
    }

    return result;
  } catch (error) {
    console.error('Exception in fetchWeeklyTimeSpent:', error);
    return [];
  }
}

/**
 * Fetch all-time total word count for the current user
 * @returns Promise with the total words typed all-time
 */
export async function fetchAllTimeWordCount(): Promise<number> {
  try {
    const userId = getCurrentUserId();
    if (!userId) return 0;

    const { data, error } = await supabase
      .from('daily_totals')
      .select('total_words')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching all-time word count:', error.message);
      return 0;
    }

    return data ? data.reduce((sum, entry) => sum + entry.total_words, 0) : 0;
  } catch (error) {
    console.error('Exception in fetchAllTimeWordCount:', error);
    return 0;
  }
}

/**
 * Directly log a word count (for fixed counts per paragraph/wisdom)
 * @param wordCount The number of words to log
 * @returns Promise with success/failure
 */
export async function logWordCount(wordCount: number): Promise<boolean> {
  if (!wordCount || wordCount <= 0) return false;
  
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.error('No user ID found, cannot log word count');
      return false;
    }
    
    console.log(`Logging ${wordCount} words for user ${userId}`);
    
    // Create a minimal session record
    const session: TypingSession = {
      user_id: userId,
      original_text: "",  // Empty for direct word count logging
      typed_text: "",     // Empty for direct word count logging
      word_count: wordCount,
      timestamp: new Date().toISOString(),
      time_spent_seconds: getTrackedTimeInSeconds()
    };
    
    const { error } = await supabase
      .from('sessions')
      .insert(session);
      
    if (error) {
      console.error('Error logging word count to sessions table:', error.message);
      return false;
    }
    
    // Update local storage for immediate feedback
    const today = formatDateToYYYYMMDD(new Date());
    const localKey = `wordCount_${today}`;
    const currentCount = parseInt(localStorage.getItem(localKey) || '0', 10);
    localStorage.setItem(localKey, (currentCount + wordCount).toString());
    
    console.log(`Successfully logged ${wordCount} words, local total: ${currentCount + wordCount}`);
    // Trigger local storage event for other components to refresh
    localStorage.setItem('stats_last_updated', Date.now().toString());
    
    return true;
  } catch (error) {
    console.error('Exception in logWordCount:', error);
    return false;
  }
}

/**
 * Directly log word counts for paragraph completions with better feedback
 * @param paragraphText The text of the completed paragraph 
 * @returns Promise with success/failure
 */
export async function logParagraphCompletion(paragraphText: string): Promise<boolean> {
  try {
    const wordCount = countWords(paragraphText);
    console.log(`Logging paragraph completion: ${wordCount} words from text "${paragraphText.substring(0, 30)}..."`);
    
    // First update local storage for immediate feedback
    const today = formatDateToYYYYMMDD(new Date());
    const localKey = `wordCount_${today}`;
    const currentCount = parseInt(localStorage.getItem(localKey) || '0', 10);
    const newCount = currentCount + wordCount;
    
    localStorage.setItem(localKey, newCount.toString());
    console.log(`Updated local word count to ${newCount}`);
    
    // Then log to Supabase - use this function to ensure consistent logging
    const success = await logWordCount(wordCount);
    
    if (!success) {
      console.error('Failed to log paragraph completion to Supabase');
    }
    
    return success;
  } catch (error) {
    console.error('Error logging paragraph completion:', error);
    return false;
  }
} 