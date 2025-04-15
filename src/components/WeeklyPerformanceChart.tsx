import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { dayNames } from '../services/weeklyStatsService';

// Props interface for the component
interface WeeklyPerformanceChartProps {
  refreshKey?: number;
}

// Chart options for minimalistic look
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 500 // Reduce animation duration for smoother updates
  },
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false
    },
    tooltip: {
      callbacks: {
        title: function(context: any) {
          const dayIndex = context[0].dataIndex;
          const date = context[0].chart.data.dates?.[dayIndex];
          if (date) {
            return `${dayNames.short[dayIndex]}, ${date.getDate()} ${date.toLocaleDateString('lt-LT', { month: 'long' })}`;
          }
          return dayNames.short[dayIndex];
        },
        label: function(context: any) {
          const value = context.raw as number;
          return `Žodžiai: ${value}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      title: {
        display: false
      },
      // Ensure the y-axis always starts at 0
      beginAtZero: true,
      // Set suggestedMin to prevent excessive scale changes
      suggestedMin: 0
    }
  }
};

export default function WeeklyPerformanceChart({ refreshKey = 0 }: WeeklyPerformanceChartProps) {
  // Add local loading state for smoother transitions
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  
  // Unique chart instance key to force recreation on significant data changes
  const [chartInstanceKey, setChartInstanceKey] = useState(1);
  
  const { 
    weeklyStats, 
    loading, 
    error, 
    weekOffset,
    previousWeek, 
    nextWeek, 
    currentWeek,
    currentMonthName, 
    currentYear,
    refreshStats 
  } = useWeeklyStats();
  
  // Debounced refresh function to prevent multiple quick refreshes
  const debouncedRefresh = useCallback(() => {
    console.log('Executing debouncedRefresh');
    refreshStats();
    // Use a new chart instance when data significantly changes
    setChartInstanceKey(prev => prev + 1);
  }, [refreshStats]);
  
  // Add logging for when the component refreshes due to refreshKey changes
  useEffect(() => {
    if (refreshKey <= 0) return; // Skip initial render
    
    console.log('WeeklyPerformanceChart: refreshKey changed to', refreshKey);
    
    // Set local loading to true for a smoother transition
    setIsLocalLoading(true);
    
    // Debounce the refresh to prevent flickering from rapid changes
    const refreshTimer = setTimeout(() => {
      debouncedRefresh();
    }, 300);
    
    return () => clearTimeout(refreshTimer);
  }, [refreshKey, debouncedRefresh]);
  
  // Manage local loading state
  useEffect(() => {
    if (!loading && weeklyStats) {
      // Delay the loading transition slightly to avoid flickering
      const loadingTimer = setTimeout(() => {
        setIsLocalLoading(false);
      }, 300);
      
      return () => clearTimeout(loadingTimer);
    }
  }, [loading, weeklyStats]);
  
  // Use memoized date calculations to prevent recalculations
  const dates = useMemo(() => {
    if (!weeklyStats?.days) return [];
    return weeklyStats.days.map(day => new Date(day.date));
  }, [weeklyStats?.days]);
  
  // Format date for header - show week range (memoized)
  const dateRangeText = useMemo(() => {
    if (dates.length < 7) return '';
    const startDate = dates[0];
    const endDate = dates[6];
    return `${startDate.getDate()} ${startDate.toLocaleDateString('lt-LT', { month: 'long' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('lt-LT', { month: 'long' })}`;
  }, [dates]);

  // Prepare chart data from weeklyStats (memoized to prevent unnecessary recalculations)
  const chartData = useMemo(() => {
    if (!weeklyStats) {
      console.log('No weekly stats available for chart');
      return {
        labels: dayNames.short,
        datasets: [{
          label: 'Žodžiai',
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }],
        dates: []
      };
    }
    
    console.log('Chart data being prepared with:', {
      dates: dates.map(d => d.toISOString().slice(0, 10)),
      wordCounts: weeklyStats.days.map(day => day.words),
      mostProductiveDay: weeklyStats.mostProductiveDayIndex,
      totalWords: weeklyStats.days.reduce((sum, day) => sum + day.words, 0)
    });
    
    return {
      labels: dayNames.short,
      datasets: [
        {
          label: 'Žodžiai',
          data: weeklyStats.days.map(day => day.words),
          backgroundColor: weeklyStats.days.map((day, index) => 
            index === weeklyStats.mostProductiveDayIndex 
              ? 'rgba(75, 192, 192, 0.8)' // Highlight most productive day
              : 'rgba(54, 162, 235, 0.7)'
          ),
          borderColor: weeklyStats.days.map((day, index) => 
            index === weeklyStats.mostProductiveDayIndex 
              ? 'rgba(75, 192, 192, 1)' 
              : 'rgba(54, 162, 235, 1)'
          ),
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7
        }
      ],
      dates: dates
    };
  }, [weeklyStats, dates]);

  // Get the current day index
  const currentDayIndex = useMemo(() => 
    weekOffset === 0 ? (new Date().getDay() + 6) % 7 : 6,
  [weekOffset]);

  // Show loading placeholder
  if (loading || isLocalLoading) {
    return (
      <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-400">
          <svg className="animate-spin h-6 w-6 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Duomenys kraunami...
        </div>
      </div>
    );
  }

  if (error || !weeklyStats) {
    return <div className="h-48 bg-gray-100 flex items-center justify-center text-red-500">Nepavyko užkrauti duomenų</div>;
  }

  // Force chart refresh when new data arrives
  useEffect(() => {
    if (weeklyStats && !loading && !isLocalLoading) {
      console.log('New weekly stats arrived, forcing chart refresh');
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setChartInstanceKey(prev => prev + 1);
      }, 50);
    }
  }, [weeklyStats, loading, isLocalLoading]);

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-cormorant font-semibold text-gray-700 mb-3">Savaitinis žodžių skaičius</h3>
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button 
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={previousWeek}
          disabled={isLocalLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="text-gray-700 font-medium font-lora">
          <span className="hidden md:inline">{dateRangeText}</span>
          <span className="md:hidden">{currentMonthName} {currentYear}</span>
          {weekOffset !== 0 && (
            <button 
              onClick={currentWeek}
              className="ml-2 text-xs text-blue-500 hover:text-blue-700 font-lora"
              disabled={isLocalLoading}
            >
              (Dabartinė savaitė)
            </button>
          )}
        </div>
        <button 
          className={`p-2 rounded-full ${weekOffset < 0 ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 opacity-50 cursor-not-allowed'} transition-colors`}
          onClick={nextWeek}
          disabled={weekOffset >= 0 || isLocalLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Chart Container */}
      <div className="h-48 relative">
        <Bar 
          key={`chart-${chartInstanceKey}-${weekOffset}`} 
          data={chartData} 
          options={chartOptions} 
        />
        
        {/* Highlight the most productive day */}
        {weeklyStats.mostProductiveDayIndex !== -1 && (
          <div className="absolute top-0 right-0 mt-2 mr-2 bg-white/75 p-1 rounded-md text-xs text-gray-700 font-medium shadow-sm">
            Produktyviausia diena: {dayNames.full[weeklyStats.mostProductiveDayIndex]}
          </div>
        )}
      </div>
      
      {/* Weekly total statistics */}
      <div className="flex justify-between mt-4 text-sm text-gray-600">
        <div>
          Iš viso žodžių: <span className="font-medium text-gray-800">{weeklyStats.days.reduce((sum, day) => sum + day.words, 0)}</span>
        </div>
        <div>
          Dienų, kai rašyta: <span className="font-medium text-gray-800">{weeklyStats.days.filter(d => d.words > 0).length}</span>
        </div>
      </div>
    </div>
  );
} 