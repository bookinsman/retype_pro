import { useState, useEffect, useCallback, useRef } from 'react';
import { WeeklyStats, dayNames, DailyStats, getWeekDates } from '../services/weeklyStatsService';
import { fetchWeeklyWordCounts } from '../services/sessionService';

interface UseWeeklyStatsReturn {
  weeklyStats: WeeklyStats | null;
  loading: boolean;
  error: Error | null;
  weekOffset: number;
  previousWeek: () => void;
  nextWeek: () => void;
  currentWeek: () => void;
  refreshStats: () => void;
  currentMonthName: string;
  currentYear: number;
  weekStartDate: Date | null;
  weekEndDate: Date | null;
}

export function useWeeklyStats(): UseWeeklyStatsReturn {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [weekDates, setWeekDates] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  
  // Add a cache timestamp to track when data was last fetched
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_TIMEOUT = 2000; // 2 seconds in milliseconds
  
  // Use a ref to track if a fetch is in progress to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  
  // Use a ref for the last requested weekOffset to ensure we're getting the right data
  const lastRequestedOffsetRef = useRef(weekOffset);

  // Get current month and year for display
  const getFormattedDate = useCallback(() => {
    // If we have actual week dates, use those
    if (weekDates.start) {
      return {
        month: weekDates.start.toLocaleDateString('lt-LT', { month: 'long' }),
        year: weekDates.start.getFullYear()
      };
    }
    
    // Otherwise calculate from weekOffset
    const today = new Date();
    if (weekOffset !== 0) {
      // Adjust date based on weekOffset
      today.setDate(today.getDate() + (weekOffset * 7));
    }
    
    // Try to use Lithuanian locale for month name, fallback to English
    try {
      return {
        month: today.toLocaleDateString('lt-LT', { month: 'long' }),
        year: today.getFullYear()
      };
    } catch (e) {
      // Fallback if Lithuanian locale is not available
      const months = ['Sausis', 'Vasaris', 'Kovas', 'Balandis', 'Gegužė', 'Birželis', 
                     'Liepa', 'Rugpjūtis', 'Rugsėjis', 'Spalis', 'Lapkritis', 'Gruodis'];
      return {
        month: months[today.getMonth()],
        year: today.getFullYear()
      };
    }
  }, [weekOffset, weekDates]);

  const { month: currentMonthName, year: currentYear } = getFormattedDate();

  // Navigation functions
  const previousWeek = useCallback(() => {
    setWeekOffset(prev => prev - 1);
  }, []);

  const nextWeek = useCallback(() => {
    // Don't allow navigating to future weeks
    if (weekOffset < 0) {
      setWeekOffset(prev => prev + 1);
    }
  }, [weekOffset]);

  const currentWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  // Fetch weekly stats data from our new session service
  const fetchWeeklyStats = useCallback(async (forceRefresh = false) => {
    // Skip if a fetch is already in progress
    if (isFetchingRef.current) {
      console.log('Weekly stats fetch already in progress, skipping');
      return;
    }
    
    // Skip fetching if we have recent data and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && weeklyStats && (now - lastFetchTime < CACHE_TIMEOUT)) {
      console.log('Using cached weekly stats data (fetched within last 2 seconds)');
      return;
    }
    
    // Mark that we're starting a fetch
    isFetchingRef.current = true;
    setLoading(true);
    
    // Save the current week offset for this fetch
    lastRequestedOffsetRef.current = weekOffset;
    
    try {
      console.log(`Fetching weekly stats with offset: ${weekOffset}${forceRefresh ? ' (forced refresh)' : ''}`);
      
      // Calculate date range for the specified week
      const { start, end } = getWeekDates(weekOffset);
      console.log(`Date range: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`);
      
      // Fetch data from our new session service
      const weeklyData = await fetchWeeklyWordCounts(start, end);
      
      // Only update state if the week offset hasn't changed during the fetch
      if (lastRequestedOffsetRef.current === weekOffset) {
        // Convert to the WeeklyStats format expected by the components
        const days: DailyStats[] = weeklyData.map((day) => {
          // Convert string date to Date object
          const dayDate = new Date(day.date);
          return {
            date: dayDate, // Date object required by DailyStats interface
            words: day.count,
            productivityScore: day.count > 0 ? 50 : 0 // Simple score between 0-100
          };
        });
        
        // Calculate most productive day
        let maxWords = 0;
        let mostProductiveDayIndex = -1;
        
        days.forEach((day, index) => {
          if (day.words > maxWords) {
            maxWords = day.words;
            mostProductiveDayIndex = index;
          }
        });
        
        // Calculate streak (consecutive days with activity)
        const streak = calculateStreak(days, weekOffset === 0 ? getCurrentDayIndex() : 6);
        
        const stats: WeeklyStats = {
          days,
          streak,
          mostProductiveDayIndex,
          weekStartDate: start,
          weekEndDate: end
        };
        
        // Log the stats for debugging
        const totalWords = stats.days.reduce((sum, day) => sum + (day.words || 0), 0);
        console.log(`Weekly stats fetched: ${totalWords} total words, most productive day: ${mostProductiveDayIndex}`);
        
        setWeeklyStats(stats);
        setLastFetchTime(now);
        setWeekDates({ start, end });
        setError(null);
      } else {
        console.log('Week offset changed during fetch, discarding results');
      }
    } catch (err) {
      console.error('Error fetching weekly stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch weekly stats'));
    } finally {
      setLoading(false);
      
      // Mark fetch as complete after a small delay to prevent immediate duplicate fetches
      setTimeout(() => {
        isFetchingRef.current = false;
      }, 300);
    }
  }, [weekOffset, weeklyStats, lastFetchTime]);

  // Get current day index (0 = Monday, 6 = Sunday)
  const getCurrentDayIndex = useCallback((): number => {
    // Convert to Monday=0, Sunday=6 format
    return (new Date().getDay() + 6) % 7;
  }, []);

  // Calculate current streak
  const calculateStreak = useCallback((days: DailyStats[], currentDayIndex: number): number => {
    let streak = 0;
    
    // Start from current day and look backwards
    for (let i = currentDayIndex; i >= 0; i--) {
      if (days[i] && days[i].productivityScore > 0) {
        streak++;
      } else {
        break; // Streak is broken
      }
    }
    
    return streak;
  }, []);

  // Function to manually refresh stats
  const refreshStats = useCallback(() => {
    console.log('Manual refresh of weekly stats requested');
    
    // Force refresh with a slight delay to allow any pending state updates
    setTimeout(() => {
      fetchWeeklyStats(true); // Force refresh 
    }, 300);
  }, [fetchWeeklyStats]);

  // Fetch stats on mount and when weekOffset changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await fetchWeeklyStats();
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchWeeklyStats, weekOffset]);

  // Set up stats refresh when localStorage changes (for real-time updates)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stats_last_updated') {
        console.log('Stats updated in localStorage, refreshing weekly stats');
        refreshStats();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshStats]);

  return {
    weeklyStats,
    loading,
    error,
    weekOffset,
    previousWeek,
    nextWeek,
    currentWeek,
    refreshStats,
    currentMonthName,
    currentYear,
    weekStartDate: weekDates.start,
    weekEndDate: weekDates.end
  };
} 