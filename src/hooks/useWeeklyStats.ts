import { useState, useEffect, useCallback } from 'react';
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
  const fetchWeeklyStats = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getWeeklyStats(weekOffset);
      setWeeklyStats(stats);
      
      // Set week start and end dates
      if (stats.days.length > 0) {
        const startDate = new Date(stats.days[0].date);
        const endDate = new Date(stats.days[stats.days.length - 1].date);
        setWeekDates({ start: startDate, end: endDate });
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch weekly stats'));
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  // Function to manually refresh stats
  const refreshStats = useCallback(() => {
    fetchWeeklyStats();
  }, [fetchWeeklyStats]);

  // Fetch stats on mount and when weekOffset changes
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
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