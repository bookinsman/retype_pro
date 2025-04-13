import React from 'react';
import { motion } from 'framer-motion';

interface SlideInTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  brandStyle?: boolean;
}

const SlideInText: React.FC<SlideInTextProps> = ({ 
  text, 
  className = '', 
  delay = 0,
  duration = 0.8,
  brandStyle = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: duration, 
        delay: delay,
        ease: "easeOut"
      }}
      className={`overflow-hidden ${className} ${brandStyle ? 'text-gray-500 font-light italic' : ''}`}
    >
      {text}
      {brandStyle && (
        <motion.div 
          className="h-[1px] w-full bg-gray-300 mt-1"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ 
            duration: duration * 1.2, 
            delay: delay + 0.2,
            ease: "easeOut"
          }}
        />
      )}
    </motion.div>
  );
};

export default SlideInText; 