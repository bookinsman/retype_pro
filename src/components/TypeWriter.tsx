import React, { useState, useEffect } from 'react';

interface TypeWriterProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

const TypeWriter: React.FC<TypeWriterProps> = ({ 
  text, 
  delay = 50, 
  onComplete, 
  className = '' 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, delay, onComplete, text]);

  return (
    <span className={className}>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-gray-800 opacity-75 animate-pulse ml-[2px]">
        &nbsp;
      </span>
    </span>
  );
};

export default TypeWriter; 