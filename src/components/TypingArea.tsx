import React, { useState, useEffect, useCallback } from 'react';
import { startTimeTracking, pauseTimeTracking } from '../services/sessionService';

interface TypingAreaProps {
  text: string;
  onComplete: () => void;
  isActive: boolean;
  typedContent: string;
  setTypedContent: (text: string) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

// Helper function to normalize characters (for accent handling)
const normalizeChar = (char: string): string => {
  return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const TypingArea: React.FC<TypingAreaProps> = ({
  text,
  onComplete,
  isActive,
  typedContent,
  setTypedContent,
  progress,
  setProgress
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect if device is mobile
  useEffect(() => {
    const detectMobile = () => {
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };
    
    detectMobile();
    window.addEventListener('resize', detectMobile);
    return () => window.removeEventListener('resize', detectMobile);
  }, []);

  // Start/pause time tracking based on activity
  useEffect(() => {
    if (isActive) {
      startTimeTracking();
    } else {
      pauseTimeTracking();
    }
    
    return () => {
      pauseTimeTracking();
    };
  }, [isActive]);

  // Handle keyboard input
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    
    const nextExpectedChar = text[typedContent.length];
    if (!nextExpectedChar) return;
    
    const normalizedInput = normalizeChar(e.key);
    const normalizedExpected = normalizeChar(nextExpectedChar);
    
    if (normalizedInput.toLowerCase() === normalizedExpected.toLowerCase()) {
      const newTypedContent = typedContent + nextExpectedChar;
      setTypedContent(newTypedContent);
      const newProgress = (newTypedContent.length / text.length) * 100;
      setProgress(newProgress);
      
      if (newTypedContent === text) {
        onComplete();
      }
    }
  }, [isActive, text, typedContent, setTypedContent, setProgress, onComplete]);

  // Setup key event listeners
  useEffect(() => {
    if (isActive) {
      window.addEventListener('keydown', handleKeyPress);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isActive, handleKeyPress]);

  // Handle mobile input
  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isActive) return;
    
    const inputValue = e.target.value;
    const lastChar = inputValue[inputValue.length - 1];
    if (!lastChar) return;
    
    const nextExpectedChar = text[typedContent.length];
    if (!nextExpectedChar) return;
    
    const normalizedInput = normalizeChar(lastChar);
    const normalizedExpected = normalizeChar(nextExpectedChar);
    
    if (normalizedInput.toLowerCase() === normalizedExpected.toLowerCase()) {
      const newTypedContent = typedContent + nextExpectedChar;
      setTypedContent(newTypedContent);
      const newProgress = (newTypedContent.length / text.length) * 100;
      setProgress(newProgress);
      
      if (newTypedContent === text) {
        onComplete();
      }
    }
  };

  return (
    <div className="typing-area relative">
      {/* Text display with highlighting */}
      <div className="text-container relative font-serif leading-relaxed text-lg md:text-xl">
        {/* Typed content (highlighted) */}
        <span className="text-blue-600 font-medium">{typedContent}</span>
        
        {/* Remaining text (to be typed) */}
        <span className="text-gray-400">
          {text.slice(typedContent.length)}
        </span>
        
        {/* Cursor */}
        {isActive && (
          <span className="cursor inline-block w-[2px] h-[1em] bg-blue-600 ml-[1px] animate-pulse" />
        )}
      </div>
      
      {/* Mobile input field (hidden on desktop) */}
      {isMobile && isActive && (
        <input
          type="text"
          className="mobile-input absolute opacity-0 h-1 w-1"
          autoFocus
          onChange={handleMobileInput}
          value=""
        />
      )}
      
      {/* Progress bar */}
      <div className="progress-bar h-1 bg-gray-200 rounded-full mt-4">
        <div 
          className="h-full bg-blue-500 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default TypingArea; 