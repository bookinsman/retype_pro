import React, { useState } from 'react';
import '../styles/StatsPanel.css';

// Minimalist document/word icon component
const WordCountIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="word-count-icon"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="8" y1="13" x2="16" y2="13"></line>
    <line x1="8" y1="17" x2="12" y2="17"></line>
  </svg>
);

interface StatsPanelProps {
  words: number;
  texts: number;     // Kept for compatibility
  timeSpent: string; // Kept for compatibility
  speed: number;     // Kept for compatibility
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  words = 0,
  texts = 0,    // Not displayed anymore
  timeSpent = "00:00", // Not displayed anymore
  speed = 0     // Not displayed anymore
}) => {
  const [mobileStatsVisible, setMobileStatsVisible] = useState(false);
  
  const toggleMobileStats = () => {
    setMobileStatsVisible(!mobileStatsVisible);
  };
  
  return (
    <>
      {/* Desktop vertical stats panel */}
      <div className="vertical-stats-panel">
        <WordCountIcon />
        <div className="vertical-word-count">
          <div className="vertical-word-value">{words.toLocaleString()}</div>
          <div className="vertical-word-label">žodžių</div>
        </div>
      </div>
      
      {/* Mobile toggle button */}
      <button 
        className={`stats-toggle-button ${mobileStatsVisible ? 'active' : ''}`}
        onClick={toggleMobileStats}
        aria-label="Toggle statistics"
      >
        <WordCountIcon />
      </button>
      
      {/* Mobile stats panel */}
      <div className={`mobile-stats-panel ${mobileStatsVisible ? 'active' : ''}`}>
        <div className="mobile-word-count">
          <WordCountIcon />
          <div>
            <div className="mobile-word-value">{words.toLocaleString()}</div>
            <div className="mobile-word-label">žodžių</div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StatsPanel; 