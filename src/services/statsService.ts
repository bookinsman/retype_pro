import { supabase, logWordCount, getTodayWordCount, getWeeklyWordCount, getTotalWordCount, getWeeklyStats } from './supabaseClient';

// This service manages stats tracking for the retyping platform
// Integrates with Supabase for storing and retrieving stats

// Define the user stats interfaces
export interface UserStats {
  words: number;
  texts: number;
  timeSpentSeconds: number;
  speed: number;
}

export interface DailyStats extends UserStats {
  date: string;
}

/**
 * Format a date to YYYY-MM-DD string format
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDateToYYYYMMDD(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format time from seconds to "mm:ss" format
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Set current user - this is not used anymore, as we use localStorage directly
export function setCurrentUser(userId: string): void {
  // Implementation not needed as we use localStorage in supabaseClient
}

// Get total stats
export async function getUserStats(): Promise<UserStats> {
  // Get total word count from Supabase
  const words = await getTotalWordCount();
  
  // For now, we're only tracking words
  return {
    words,
    texts: 0,
    timeSpentSeconds: 0,
    speed: 0
  };
}

// Get today's stats
export async function getTodayStats(): Promise<UserStats> {
  // Get today's word count from Supabase
  const words = await getTodayWordCount();
  
  // For now, we're only tracking words
  return {
    words,
    texts: 0,
    timeSpentSeconds: 0,
    speed: 0
  };
}

// Update word count
export async function updateWordCount(newWords: number): Promise<UserStats> {
  console.log(`updateWordCount called with ${newWords} words`);
  
  // Get the current counts (don't add yet, just retrieve them)
  const existingWords = parseInt(localStorage.getItem('total_words') || '0', 10);
  
  // Get today's date in ISO format (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const todayKey = `words_${today}`;
  const existingTodayWords = parseInt(localStorage.getItem(todayKey) || '0', 10);
  
  console.log(`Current stats before update - Total: ${existingWords}, Today: ${existingTodayWords}`);
  
  // Log the new words to Supabase, which will also update localStorage via saveStatsLocally
  await logWordCount(newWords);
  
  // After Supabase update, get the latest counts
  const updatedTotalWords = parseInt(localStorage.getItem('total_words') || '0', 10);
  const updatedTodayWords = parseInt(localStorage.getItem(todayKey) || '0', 10);
  
  console.log(`updateWordCount - Total words: ${updatedTotalWords}, Today's words: ${updatedTodayWords}`);
  
  // Return the updated stats (for UI immediate feedback)
  return {
    words: updatedTotalWords,
    texts: 0,
    timeSpentSeconds: 0,
    speed: 0
  };
}

// Track completed paragraph
export async function trackCompletedParagraph(text: string): Promise<UserStats> {
  const wordCount = text.trim().split(/\s+/).length;
  
  // Enhanced logging for stats update
  console.log(`Tracking paragraph completion: ${wordCount} words`);
  
  // Also save the paragraph ID and word count for extra reliability
  try {
    const paragraphsCompletedKey = 'paragraphs_completed';
    const paragraphsCompleted = parseInt(localStorage.getItem(paragraphsCompletedKey) || '0', 10);
    localStorage.setItem(paragraphsCompletedKey, (paragraphsCompleted + 1).toString());
    
    const paragraphWordsKey = 'paragraph_words';
    const paragraphWords = JSON.parse(localStorage.getItem(paragraphWordsKey) || '[]');
    const newEntry = { 
      timestamp: new Date().toISOString(),
      words: wordCount
    };
    paragraphWords.push(newEntry);
    localStorage.setItem(paragraphWordsKey, JSON.stringify(paragraphWords));
    console.log('Saved paragraph completion to localStorage:', newEntry);
    
    // Update the paragraph count display immediately
    const totalWordsKey = 'total_words';
    const currentTotal = parseInt(localStorage.getItem(totalWordsKey) || '0', 10);
    const newTotal = currentTotal + wordCount;
    localStorage.setItem(totalWordsKey, newTotal.toString());
    console.log(`Updated total_words in localStorage immediately: ${currentTotal} -> ${newTotal}`);
  } catch (e) {
    console.error('Error saving paragraph data to localStorage:', e);
  }
  
  try {
    // First update the word count in Supabase and localStorage
    console.log('Updating word count in Supabase and localStorage...');
    const updatedStats = await updateWordCount(wordCount);
    
    // After word count update, refresh the cache in weeklyStatsService
    try {
      console.log('Refreshing weekly stats cache...');
      const { getWeeklyStats } = await import('./weeklyStatsService');
      // Force a refresh of the weekly stats by calling it with the current week offset
      await getWeeklyStats(0);
      console.log('Weekly stats refreshed after paragraph completion');
    } catch (error) {
      console.error('Failed to refresh weekly stats:', error);
    }
    
    return updatedStats;
  } catch (error) {
    console.error('Error in tracking paragraph completion:', error);
    
    // In case of error, still return something reasonable
    const fallbackTotalWords = parseInt(localStorage.getItem('total_words') || '0', 10);
    return {
      words: fallbackTotalWords,
      texts: 0,
      timeSpentSeconds: 0,
      speed: 0
    };
  }
}

// Track time spent - now just a placeholder
export async function trackTimeSpent(seconds: number): Promise<UserStats> {
  // Currently not tracking time in Supabase
  return getUserStats();
}

// Calculate typing speed
export function calculateSpeed(words: number, timeInSeconds: number): number {
  if (timeInSeconds === 0) return 0;
  return Math.round((words / timeInSeconds) * 60); // Words per minute
}

// Get weekly stats for chart
export async function getWeeklyStatsForChart(): Promise<DailyStats[]> {
  const weeklyData = await getWeeklyStats();
  
  // Convert to DailyStats format
  return weeklyData.map(item => ({
    date: item.date,
    words: item.count,
    texts: 0,
    timeSpentSeconds: 0,
    speed: 0
  }));
} 