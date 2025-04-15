import { UserStats } from './statsService';

// Interface for daily stats data - simplified to focus on word counts
export interface DailyStats {
  date: Date;
  words: number;
  productivityScore: number;
}

// Interface for weekly stats
export interface WeeklyStats {
  days: DailyStats[];
  streak: number;
  mostProductiveDayIndex: number;
  weekStartDate: Date;
  weekEndDate: Date;
}

// Get day names in Lithuanian
export const dayNames = {
  short: ['Pirm', 'Antr', 'Treč', 'Ketv', 'Penk', 'Šešt', 'Sekm'],
  full: ['Pirmadienis', 'Antradienis', 'Trečiadienis', 'Ketvirtadienis', 'Penktadienis', 'Šeštadienis', 'Sekmadienis']
};

// Function to get current day index (0 = Monday, 6 = Sunday)
export function getCurrentDayIndex(): number {
  // Convert to Monday=0, Sunday=6 format
  return (new Date().getDay() + 6) % 7;
}

// Calculate the start and end dates for a week based on offset
export function getWeekDates(weekOffset: number = 0): { start: Date, end: Date } {
  const today = new Date();
  const currentDayIndex = getCurrentDayIndex(); // 0 = Monday, 6 = Sunday
  
  // Calculate the date of last Monday
  const mondayDate = new Date(today);
  mondayDate.setDate(today.getDate() - currentDayIndex + (weekOffset * 7));
  
  // Reset hours to start of day
  mondayDate.setHours(0, 0, 0, 0);
  
  // Calculate the date of Sunday
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  
  return {
    start: mondayDate,
    end: sundayDate
  };
}

// Generate weekly stats based on current stats - simplified for word counts
export function generateWeeklyStats(userStats: UserStats, weekOffset: number = 0): WeeklyStats {
  const { start: weekStartDate, end: weekEndDate } = getWeekDates(weekOffset);
  const days: DailyStats[] = generateDailyStats(userStats, weekStartDate, weekOffset);
  
  // Calculate productivity scores based on words only
  const productivityScores = calculateProductivityScores(days);
  
  // Update days with productivity scores
  days.forEach((day, index) => {
    day.productivityScore = productivityScores[index];
  });
  
  // Calculate most productive day (most words)
  const maxProductivity = Math.max(...productivityScores);
  const mostProductiveDayIndex = maxProductivity > 0 ? productivityScores.indexOf(maxProductivity) : getCurrentDayIndex();
  
  // Calculate streak
  const streak = calculateStreak(days, weekOffset === 0 ? getCurrentDayIndex() : 6);
  
  return {
    days,
    streak,
    mostProductiveDayIndex,
    weekStartDate,
    weekEndDate
  };
}

// Generate sample data for each day - simplified for word counts
function generateDailyStats(userStats: UserStats, weekStartDate: Date, weekOffset: number): DailyStats[] {
  const currentDayIndex = weekOffset === 0 ? getCurrentDayIndex() : 6;
  
  return Array(7).fill(null).map((_, index) => {
    // Create date for this day
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    
    // If future day, return empty stats
    if (weekOffset === 0 && index > currentDayIndex) {
      return {
        date,
        words: 0,
        productivityScore: 0
      };
    }
    
    // In the future, this would fetch real data from Supabase
    // For now, generate sample data based on current stats
    
    // More recent days have higher values
    const recencyBoost = index === currentDayIndex ? 1 : 0.7 - ((currentDayIndex - index) * 0.1);
    
    // Add some randomness for variety
    const randomFactor = 0.7 + (Math.random() * 0.6);
    
    // Weekend days tend to have lower activity (except for the most recent weekend)
    const weekendPenalty = (index >= 5 && index !== currentDayIndex) ? 0.6 : 1;
    
    // Calculate sample stats - just words now
    const words = Math.floor((userStats.words / 7) * recencyBoost * randomFactor * weekendPenalty);
    
    return {
      date,
      words,
      productivityScore: 0  // Will be calculated later
    };
  });
}

// Calculate productivity scores based on word counts only
function calculateProductivityScores(days: DailyStats[]): number[] {
  // Find max values for normalization
  const maxWords = Math.max(...days.map(day => day.words), 1);
  
  return days.map(day => {
    if (day.words === 0) return 0; // If no activity, productivity is 0
    
    // Normalize words to a 0-100 scale
    return day.words / maxWords * 100;
  });
}

// Calculate current streak
function calculateStreak(days: DailyStats[], currentDayIndex: number): number {
  let streak = 0;
  
  // Start from current day and look backwards
  for (let i = currentDayIndex; i >= 0; i--) {
    if (days[i].productivityScore > 0) {
      streak++;
    } else {
      break; // Streak is broken
    }
  }
  
  return streak;
}

// Get weekly stats for a specific week
export async function getWeeklyStats(weekOffset = 0): Promise<WeeklyStats> {
  // Import supabase client dynamically to avoid circular dependencies
  const { supabase, getCurrentUserId } = await import('./supabaseClient');
  
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('No user ID found for weekly stats');
      return generateEmptyWeeklyStats(weekOffset);
    }
    
    const { start, end } = getWeekDates(weekOffset);
    
    // ALWAYS check localStorage for today's data first
    console.log(`Fetching weekly stats for week offset ${weekOffset}, date range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);
    
    // First check localStorage for word counts to improve reliability
    const localData = getLocalWordCountsByDay(userId, start, end);
    
    // Print daily local data for debugging
    if (localData && localData.length > 0) {
      const totalLocalWords = localData.reduce((sum, day) => sum + day.total_words, 0);
      console.log(`Found local data for ${localData.length} days, total words: ${totalLocalWords}`);
      
      // Print each day's count for debugging
      localData.forEach(day => {
        console.log(`Local data for ${day.date}: ${day.total_words} words`);
      });
    }
    
    if (localData && localData.length > 0 && hasWordCounts(localData)) {
      console.log('Using locally stored word counts for weekly stats');
      return processStatsData(localData, weekOffset);
    }
    
    // If no local data, fall back to Supabase
    const { data, error } = await supabase
      .from('user_daily_stats')
      .select('date, total_words')
      .eq('user_id', userId)
      .gte('date', start.toISOString().split('T')[0])
      .lte('date', end.toISOString().split('T')[0])
      .order('date');
    
    if (error) {
      console.error('Failed to fetch weekly stats:', error);
      return generateEmptyWeeklyStats(weekOffset);
    }
    
    // If no data found, return empty stats
    if (!data || data.length === 0) {
      return generateEmptyWeeklyStats(weekOffset);
    }
    
    // Process the data from Supabase
    return processStatsData(data, weekOffset);
  } catch (e) {
    console.error('Error in getWeeklyStats:', e);
    return generateEmptyWeeklyStats(weekOffset);
  }
}

// Helper function to check if any day has word counts
function hasWordCounts(data: any[]): boolean {
  return data.some(day => day.total_words > 0);
}

// Get word counts from localStorage
function getLocalWordCountsByDay(userId: string, startDate: Date, endDate: Date): any[] {
  try {
    const result = [];
    const current = new Date(startDate);
    
    // Check if we have any data in localStorage
    const statsKey = `${userId}_word_stats`;
    const statsJson = localStorage.getItem(statsKey);
    
    // Get today's date for special handling of current day
    const today = new Date().toISOString().split('T')[0];
    
    // Look for daily word counts saved in localStorage
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const isToday = dateStr === today;
      
      // For today, use the most recent data from the 'words_DATE' key format
      // which gets updated after each paragraph completion
      if (isToday) {
        const todayKey = `words_${dateStr}`;
        const todayWords = localStorage.getItem(todayKey);
        
        console.log(`Checking today's local data for ${dateStr}: ${todayWords || 0} words`);
        
        result.push({
          date: dateStr,
          total_words: todayWords ? parseInt(todayWords, 10) : 0
        });
      } else {
        // For past days, use the regular key format
        const dayKey = `words_${dateStr}`;
        const dayWords = localStorage.getItem(dayKey);
        
        result.push({
          date: dateStr,
          total_words: dayWords ? parseInt(dayWords, 10) : 0
        });
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Print daily totals for debugging
    const totalWords = result.reduce((sum, day) => sum + day.total_words, 0);
    console.log(`Local word counts for week: ${totalWords} total words`);
    
    return result;
  } catch (e) {
    console.error('Error getting local word counts by day:', e);
    return [];
  }
}

// Generate empty weekly stats
function generateEmptyWeeklyStats(weekOffset: number): WeeklyStats {
  const { start: weekStartDate, end: weekEndDate } = getWeekDates(weekOffset);
  const days: DailyStats[] = Array(7).fill(null).map((_, index) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    return {
      date,
      words: 0,
      productivityScore: 0
    };
  });
  
  return {
    days,
    streak: 0,
    mostProductiveDayIndex: 0,
    weekStartDate,
    weekEndDate
  };
}

// Process stats data from Supabase
function processStatsData(data: any[], weekOffset: number): WeeklyStats {
  const { start: weekStartDate, end: weekEndDate } = getWeekDates(weekOffset);
  const currentDayIndex = weekOffset === 0 ? getCurrentDayIndex() : 6;
  
  // Create a map of dates to word counts
  const dateMap: Record<string, number> = {};
  data.forEach(item => {
    dateMap[item.date] = item.total_words;
  });
  
  // Create an array of daily stats for the week
  const days: DailyStats[] = Array(7).fill(null).map((_, index) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + index);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      date,
      words: dateMap[dateStr] || 0,
      productivityScore: 0 // Will be calculated later
    };
  });
  
  // Calculate productivity scores
  const productivityScores = calculateProductivityScores(days);
  days.forEach((day, index) => {
    day.productivityScore = productivityScores[index];
  });
  
  // Find most productive day
  const maxProductivity = Math.max(...productivityScores);
  const mostProductiveDayIndex = maxProductivity > 0 ? productivityScores.indexOf(maxProductivity) : currentDayIndex;
  
  // Calculate streak
  const streak = calculateStreak(days, weekOffset === 0 ? currentDayIndex : 6);
  
  return {
    days,
    streak,
    mostProductiveDayIndex,
    weekStartDate,
    weekEndDate
  };
} 