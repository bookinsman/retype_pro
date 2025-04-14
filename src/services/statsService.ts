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
  // Log the new words to Supabase
  await logWordCount(newWords);
  
  // Return the updated stats (for UI immediate feedback)
  return {
    words: (await getTotalWordCount()),
    texts: 0,
    timeSpentSeconds: 0,
    speed: 0
  };
}

// Track completed paragraph
export async function trackCompletedParagraph(text: string): Promise<UserStats> {
  const wordCount = text.trim().split(/\s+/).length;
  return updateWordCount(wordCount);
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