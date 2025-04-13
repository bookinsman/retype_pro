import React from 'react';
import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Loading...", 
  fullScreen = false 
}) => {
  // Animation variants
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const messageVariants = {
    initial: { y: 10, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Dots animation
  const dotsContainerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      }
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Circles animation
  const circlePaths = [
    { radius: 8, delay: 0 },
    { radius: 16, delay: 0.2 },
    { radius: 24, delay: 0.4 }
  ];

  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'min-h-[200px]'} bg-gradient-to-br from-white via-gray-50 to-gray-100`}>
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="text-center"
      >
        <div className="w-32 h-32 mx-auto mb-6 relative">
          {/* Main spinning ring */}
          <motion.div
            className="absolute inset-0"
            animate={{ 
              rotate: 360,
              transition: { 
                duration: 3, 
                ease: "linear", 
                repeat: Infinity 
              }
            }}
          >
            <div className="w-full h-full border-4 border-t-black border-r-gray-300 border-b-black border-l-gray-300 rounded-full"></div>
          </motion.div>
          
          {/* Pulsing circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            {circlePaths.map((circle, index) => (
              <motion.div
                key={index}
                className="absolute rounded-full border-2 border-gray-700 opacity-60"
                initial={{ width: 0, height: 0 }}
                animate={{ 
                  width: circle.radius * 2, 
                  height: circle.radius * 2,
                  opacity: [0.7, 0.3, 0.7],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  delay: circle.delay,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Orbiting dot */}
          <motion.div
            className="absolute w-5 h-5 bg-black rounded-full shadow-md"
            animate={{
              x: [0, 30, 0, -30, 0],
              y: [30, 0, -30, 0, 30],
              scale: [1, 1.2, 1, 1.2, 1],
              opacity: [0.8, 1, 0.8, 1, 0.8]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ top: "calc(50% - 10px)", left: "calc(50% - 10px)" }}
          />
          
          {/* Bouncing dots below the circles */}
          <motion.div
            variants={dotsContainerVariants}
            initial="initial"
            animate="animate"
            className="absolute -bottom-8 left-0 right-0 flex justify-center space-x-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                variants={dotVariants}
                className="w-3 h-3 rounded-full"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  backgroundColor: i === 0 ? "#000000" : i === 1 ? "#333333" : "#666666"
                }}
              />
            ))}
          </motion.div>
        </div>
        
        <motion.p 
          variants={messageVariants}
          className="text-sm md:text-base text-gray-700 font-lora"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingAnimation; 