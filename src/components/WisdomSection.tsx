import React from 'react';
import { motion } from 'framer-motion';

interface WisdomSectionProps {
  id: string;
  content: string;
  completed: boolean;
  onComplete: (id: string) => void;
}

const WisdomSection: React.FC<WisdomSectionProps> = ({
  id,
  content,
  completed,
  onComplete
}) => {
  const handleClick = () => {
    if (!completed) {
      onComplete(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="wisdom-section my-10 cursor-pointer"
      onClick={handleClick}
    >
      <div 
        className={`p-6 rounded-lg border-l-4 ${
          completed 
            ? 'border-green-500 bg-green-50' 
            : 'border-amber-500 bg-amber-50'
        } transition-colors duration-300`}
      >
        <div className="flex items-center mb-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 ${completed ? 'text-green-600' : 'text-amber-600'}`} 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
          <h3 className={`ml-2 text-lg font-medium ${completed ? 'text-green-800' : 'text-amber-800'}`}>
            {completed ? 'Wisdom Completed' : 'Click to Complete Wisdom'}
          </h3>
        </div>
        <p className="text-gray-700 italic font-serif">{content}</p>
      </div>
    </motion.div>
  );
};

export default WisdomSection; 