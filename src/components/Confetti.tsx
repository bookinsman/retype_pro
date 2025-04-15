import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiProps {
  show: boolean;
  duration?: number;
  particleCount?: number;
}

const Confetti: React.FC<ConfettiProps> = ({
  show,
  duration = 2000,
  particleCount = 50
}) => {
  const [particles, setParticles] = useState<JSX.Element[]>([]);
  
  useEffect(() => {
    if (show) {
      const newParticles: JSX.Element[] = [];
      
      // Generate random particles
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * 100; // Random X position (0-100%)
        const delay = Math.random() * 0.5; // Random delay (0-0.5s)
        const size = Math.random() * 10 + 5; // Random size (5-15px)
        const rotateStart = Math.random() * 360; // Random starting rotation
        const rotateEnd = rotateStart + (Math.random() * 360 - 180); // Random ending rotation
        
        // Random color
        const colors = [
          '#FFD700', // Gold
          '#FF6347', // Tomato
          '#4169E1', // Royal Blue
          '#32CD32', // Lime Green
          '#FF69B4', // Hot Pink
          '#9370DB', // Medium Purple
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        newParticles.push(
          <motion.div
            key={i}
            initial={{ 
              y: -20, 
              x: `${x}vw`, 
              opacity: 1, 
              rotate: rotateStart,
              scale: 1 
            }}
            animate={{ 
              y: '110vh', 
              opacity: 0, 
              rotate: rotateEnd,
              scale: Math.random() * 0.6 + 0.5 
            }}
            transition={{ 
              duration: Math.random() * 2 + 3, 
              delay, 
              ease: 'easeOut' 
            }}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              backgroundColor: color,
            }}
          />
        );
      }
      
      setParticles(newParticles);
      
      // Clear after duration
      const timer = setTimeout(() => {
        setParticles([]);
      }, duration);
      
      return () => clearTimeout(timer);
    }
    
    return () => {}; // Empty cleanup for no-show case
  }, [show, duration, particleCount]);
  
  if (particles.length === 0) return null;
  
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
        overflow: 'hidden'
      }}
    >
      {particles}
    </div>
  );
};

export default Confetti; 