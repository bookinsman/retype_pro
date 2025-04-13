import React from 'react';
import { Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useWeeklyStats } from '../hooks/useWeeklyStats';
import { dayNames } from '../services/weeklyStatsService';

// Chart options for minimalistic look
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
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
      }
    }
  }
};

export default function WeeklyPerformanceChart() {
  const { 
    weeklyStats, 
    loading, 
    error, 
    weekOffset,
    previousWeek, 
    nextWeek, 
    currentWeek,
    currentMonthName, 
    currentYear 
  } = useWeeklyStats();
  
  // If still loading or there's an error, show placeholder
  if (loading) {
    return <div className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>;
  }

  if (error || !weeklyStats) {
    return <div className="h-48 bg-gray-100 flex items-center justify-center text-red-500">Nepavyko užkrauti duomenų</div>;
  }

  // Get the dates for the current week
  const dates = weeklyStats.days.map(day => new Date(day.date));
  
  // Format date for header - show week range
  const startDate = dates[0];
  const endDate = dates[6];
  const dateRangeText = `${startDate.getDate()} ${startDate.toLocaleDateString('lt-LT', { month: 'long' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('lt-LT', { month: 'long' })}`;

  // Prepare chart data from weeklyStats - only Words
  const chartData = {
    labels: dayNames.short,
    datasets: [
      {
        label: 'Žodžiai',
        data: weeklyStats.days.map(day => day.words),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7
      }
    ],
    // Add dates to chart data for tooltip access
    dates: dates
  };

  // Get the current day index
  const currentDayIndex = weekOffset === 0 ? (new Date().getDay() + 6) % 7 : 6;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-cormorant font-semibold text-gray-700 mb-3">Savaitinis žodžių skaičius</h3>
      {/* Date Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button 
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          onClick={previousWeek}
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
            >
              (Dabartinė savaitė)
            </button>
          )}
        </div>
        <button 
          className={`p-2 rounded-full ${weekOffset < 0 ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 opacity-50 cursor-not-allowed'} transition-colors`}
          onClick={nextWeek}
          disabled={weekOffset >= 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Calendar-style Day Information */}
      <div className="flex justify-between mb-5 border-b border-gray-200 pb-2">
        {weeklyStats.days.map((day, index) => {
          const date = new Date(day.date);
          const dayNum = date.getDate();
          const isCurrentDay = index === currentDayIndex && weekOffset === 0;
          const isMostProductiveDay = index === weeklyStats.mostProductiveDayIndex;
          const hasActivity = day.words > 0;
          
          return (
            <div key={index} className="flex flex-col items-center">
              <span className="text-xs text-gray-500 font-lora mb-1">{dayNames.short[index]}</span>
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full 
                  ${isCurrentDay ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' : 
                  isMostProductiveDay ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' : 
                  hasActivity ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}
              >
                <span className="font-lora text-sm">{dayNum}</span>
              </div>
              {isMostProductiveDay && (
                <span className="text-xs text-yellow-600 mt-1">⭐</span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* The Chart */}
      <div className="h-48 w-full">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
} 