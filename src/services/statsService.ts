// This is a placeholder service that will be replaced with Supabase integration later
// It provides the interface and mock implementation for word count tracking

export interface UserStats {
  words: number;
}

// Format time from seconds to "mm:ss" format (kept for compatibility with existing code)
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Mock word count - will be replaced with Supabase data
let mockTotalWords: number = 0;

// Mock daily words - will be replaced with Supabase data
let mockTodayWords: number = 0;

// Mock user ID - will be replaced with authenticated user ID
let currentUserId: string | null = null;

// Set current user - will be used to fetch user-specific stats from Supabase
export function setCurrentUser(userId: string): void {
  currentUserId = userId;
}

// Get total stats - will be replaced with Supabase query
export async function getUserStats(): Promise<UserStats> {
  // In the future, this will fetch from Supabase
  // Example Supabase implementation:
  // return await supabase
  //   .from('user_stats')
  //   .select('words')
  //   .eq('user_id', currentUserId)
  //   .single()
  //   .then(({ data, error }) => {
  //     if (error) throw error;
  //     return { words: data.words };
  //   });
  
  // For now, return mock data
  return { words: mockTotalWords };
}

// Get today's stats - will be replaced with Supabase query
export async function getTodayStats(): Promise<UserStats> {
  // In the future, this will fetch from Supabase with date filter
  // Example Supabase implementation:
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // return await supabase
  //   .from('user_daily_stats')
  //   .select('words')
  //   .eq('user_id', currentUserId)
  //   .gte('created_at', today.toISOString())
  //   .single()
  //   .then(({ data, error }) => {
  //     if (error && error.code !== 'PGRST116') throw error;
  //     return { words: data?.words || 0 };
  //   });
  
  // For now, return mock data for today
  return { words: mockTodayWords };
}

// Update word count - will be replaced with Supabase upsert
export async function updateWordCount(newWords: number): Promise<UserStats> {
  // In the future, this will update Supabase
  // Example Supabase implementation for total stats:
  // await supabase.from('user_stats').upsert({ 
  //   user_id: currentUserId, 
  //   words: mockTotalWords + newWords
  // });
  
  // Example Supabase implementation for today's stats:
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // await supabase.from('user_daily_stats').upsert({
  //   user_id: currentUserId,
  //   date: today.toISOString(),
  //   words: mockTodayWords + newWords
  // });
  
  // For now, update mock data
  mockTotalWords += newWords;
  mockTodayWords += newWords;
  
  return { words: mockTotalWords };
}

// Track completed paragraph - will update words count
export async function trackCompletedParagraph(text: string): Promise<UserStats> {
  const wordCount = text.trim().split(/\s+/).length;
  return updateWordCount(wordCount);
}

// For compatibility with existing code
export async function trackTimeSpent(seconds: number): Promise<UserStats> {
  // This function now does nothing except return current word count
  return getUserStats();
}

// For compatibility with existing code
export function calculateSpeed(words: number, timeInSeconds: number): number {
  return 0; // No longer calculating speed
} 