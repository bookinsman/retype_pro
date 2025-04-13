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
  // In the future, this will fetch from a database or API
  // For example with Supabase:
  // 
  // const { start, end } = getWeekDates(weekOffset);
  // const { data, error } = await supabase
  //   .from('daily_stats')
  //   .select('*')
  //   .gte('date', start.toISOString())
  //   .lte('date', end.toISOString())
  //   .order('date');
  //
  // if (error) throw new Error('Failed to fetch stats: ' + error.message);
  // return processStatsData(data);
  
  // For now, just return current week data with mock values
  // This would be adjusted to return historical data based on weekOffset
  const currentStats: UserStats = {
    words: 3500
  };
  
  return generateWeeklyStats(currentStats, weekOffset);
} 