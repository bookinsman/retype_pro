import React from 'react';

interface ProgressHeatMapProps {
  data: number[];
  maxValue?: number;
  className?: string;
}

const ProgressHeatMap: React.FC<ProgressHeatMapProps> = ({
  data,
  maxValue,
  className = ''
}) => {
  // Calculate the max value if not provided
  const calculatedMax = maxValue || Math.max(...data, 1);
  
  // Get color based on value intensity (0-100%)
  const getColor = (value: number): string => {
    // No data
    if (value === 0) return 'bg-gray-100';
    
    // Calculate percentage of max (0-100)
    const percentage = Math.min(Math.round((value / calculatedMax) * 100), 100);
    
    if (percentage < 20) return 'bg-green-100';
    if (percentage < 40) return 'bg-green-200';
    if (percentage < 60) return 'bg-green-300';
    if (percentage < 80) return 'bg-green-400';
    return 'bg-green-500';
  };

  return (
    <div className={`progress-heatmap ${className}`}>
      <div className="flex flex-wrap gap-1">
        {data.map((value, index) => (
          <div 
            key={index}
            className={`w-4 h-4 rounded-sm ${getColor(value)}`}
            title={`${value} words`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgressHeatMap; 