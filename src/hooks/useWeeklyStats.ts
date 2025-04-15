import { useState, useEffect, useCallback, useRef } from 'react';
import { WeeklyStats, getWeeklyStats, dayNames } from '../services/weeklyStatsService';

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

  // Fetch weekly stats data
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
      
      // Clear localStorage cache for today to force fetching fresh data
      if (forceRefresh) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const cacheKey = `stats_cache_${weekOffset}_${today}`;
          localStorage.removeItem(cacheKey);
          console.log('Cleared cache for weekly stats to force refresh');
        } catch (e) {
          console.error('Error clearing cache:', e);
        }
      }
      
      const stats = await getWeeklyStats(weekOffset);
      
      // Only update state if the week offset hasn't changed during the fetch
      // This prevents race conditions where an older fetch overwrites newer data
      if (lastRequestedOffsetRef.current === weekOffset) {
        // Log the stats for debugging
        const totalWords = stats.days.reduce((sum, day) => sum + (day.words || 0), 0);
        console.log(`Weekly stats fetched: ${totalWords} total words, most productive day: ${stats.mostProductiveDayIndex}`);
        
        setWeeklyStats(stats);
        setLastFetchTime(now);
        
        // Set week start and end dates
        if (stats.days.length > 0) {
          const startDate = new Date(stats.days[0].date);
          const endDate = new Date(stats.days[stats.days.length - 1].date);
          setWeekDates({ start: startDate, end: endDate });
          console.log(`Week date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
        }
        
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

  // Function to manually refresh stats
  const refreshStats = useCallback(() => {
    console.log('Manual refresh of weekly stats requested');
    
    // Force refresh of localStorage data first
    try {
      const userId = localStorage.getItem('current_user_id');
      if (userId) {
        // Clear any localStorage cache for the current week to force fresh data
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `stats_cache_${weekOffset}_${today}`;
        localStorage.removeItem(cacheKey);
        
        // Get today's date in ISO format (YYYY-MM-DD)
        const todayKey = `words_${today}`;
        
        // Re-read today's word count from localStorage
        const todayWords = localStorage.getItem(todayKey);
        console.log(`Today's words before refresh: ${todayWords || '0'}`);
        
        // Clear isFetching flag to ensure we fetch new data
        isFetchingRef.current = false;
      }
    } catch (e) {
      console.error('Error clearing stats cache:', e);
    }
    
    // Force refresh with a slight delay to allow any pending state updates
    setTimeout(() => {
      fetchWeeklyStats(true); // Force refresh 
    }, 300);
  }, [fetchWeeklyStats, weekOffset]);

  // Fetch stats on mount and when weekOffset changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      console.log('Initial fetch of weekly stats');
      await fetchWeeklyStats();
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [weekOffset, fetchWeeklyStats]);

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