import React from 'react';
import { fetchAllTimeWordCount } from '../services/sessionService';
import { motion } from 'framer-motion';

interface TotalStatsProps {
  className?: string;
  refreshKey?: number;
}

const TotalStats: React.FC<TotalStatsProps> = ({ className = '', refreshKey = 0 }) => {
  const [wordCount, setWordCount] = React.useState<number | null>(0);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchTotalStats = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const totalWords = await fetchAllTimeWordCount();
      setWordCount(totalWords);
    } catch (error) {
      console.log('Error fetching total stats:', error);
      setWordCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  React.useEffect(() => {
    fetchTotalStats();
  }, [fetchTotalStats]);
  
  React.useEffect(() => {
    if (refreshKey > 0) {
      console.log('TotalStats: refreshKey changed, fetching new stats');
      fetchTotalStats();
    }
  }, [refreshKey, fetchTotalStats]);
  
  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-cormorant font-semibold text-gray-700 mb-3">Viso</h3>
      
      <motion.div 
        className="bg-white p-4 rounded-lg shadow-sm text-center"
        initial={{ scale: 0.95, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-1 text-xs text-gray-400 uppercase font-lora tracking-wider">Žodžių perrašyta</div>
        <div className="text-3xl font-light text-gray-800 font-mono">{(wordCount || 0).toLocaleString()}</div>
        <div className="mt-2 text-xs text-gray-500 font-lora italic">Viso nuo pradžios</div>
      </motion.div>
    </div>
  );
};

export default TotalStats; 