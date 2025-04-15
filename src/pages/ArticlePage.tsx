import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ArticlePage.css';
import StatsPanel from '../components/StatsPanel';
import AudioPlayer from '../components/AudioPlayer';
import { getUserStats, getTodayStats, trackCompletedParagraph, trackTimeSpent, formatTime } from '../services/statsService';
import { QuoteIcon } from '../components/Icons';
import { normalizeChar } from '../utils/characterUtils';
import WeeklyPerformanceChart from '../components/WeeklyPerformanceChart';
import TotalStats from '../components/TotalStats';
import DailyStats from '../components/DailyStats';
import { getCurrentContent, completeParagraph, completeWisdomSection, isContentSetCompleted, ContentSet, Paragraph, WisdomSection } from '../services/contentService';
import LoadingAnimation from '../components/LoadingAnimation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  PointElement,
  LineElement,
  LineController
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
  PointElement,
  LineElement,
  LineController
);

// Chart options for minimalistic look
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        font: {
          family: 'Baskerville',
          size: 12
        }
      }
    },
    title: {
      display: false
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
      }
    }
  }
};

export default function ArticlePage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [typedContent, setTypedContent] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<number | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [isTogglingStats, setIsTogglingStats] = useState(false);
  
  // State for content set with paragraphs and wisdom sections
  const [contentSet, setContentSet] = useState<ContentSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check if all content is completed (7 paragraphs and wisdom section)
  const allContentCompleted = useMemo(() => {
    if (!contentSet || !contentSet.paragraphs || !contentSet.wisdomSections) return false;
    
    const allParagraphsCompleted = contentSet.paragraphs.every(p => p.completed);
    const wisdomSectionCompleted = contentSet.wisdomSections.length > 0 && contentSet.wisdomSections[0].completed;
    
    return allParagraphsCompleted && wisdomSectionCompleted;
  }, [contentSet]);

  // Add state for stats
  const [stats, setStats] = useState({
    words: 0
  });

  // Add refresh key for stats components
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  // Auto-save typing progress
  useEffect(() => {
    if (activeIndex !== null && contentSet && contentSet.paragraphs && 
        activeIndex < contentSet.paragraphs.length && 
        !contentSet.paragraphs[activeIndex].completed) {
      localStorage.setItem('typedContent', typedContent);
      localStorage.setItem('progress', progress.toString());
    }
  }, [typedContent, progress, activeIndex, contentSet]);

  // Restore typing progress on mount or when active paragraph changes
  useEffect(() => {
    if (activeIndex !== null && contentSet && contentSet.paragraphs && 
        activeIndex < contentSet.paragraphs.length && 
        !contentSet.paragraphs[activeIndex].completed) {
      const savedContent = localStorage.getItem('typedContent');
      const savedProgress = localStorage.getItem('progress');
      
      if (savedContent) {
        setTypedContent(savedContent);
      }
      
      if (savedProgress) {
        setProgress(parseFloat(savedProgress));
      }
    }
  }, [activeIndex, contentSet]);

  // Save and restore active paragraph index from localStorage
  useEffect(() => {
    // Restore active paragraph from localStorage when component mounts
    const savedIndex = localStorage.getItem('activeParaIndex');
    if (savedIndex && savedIndex !== 'null') {
      setActiveIndex(parseInt(savedIndex, 10));
    }
  }, []);

  // Save active paragraph index to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeParaIndex', activeIndex !== null ? activeIndex.toString() : 'null');
  }, [activeIndex]);

  // Fetch content and initial stats
  useEffect(() => {
    async function fetchInitialData() {
      setIsLoading(true);
      
      try {
        // Fetch content
        const content = await getCurrentContent();
        setContentSet(content);
        
        // Get stats from localStorage first for immediate feedback
        const localTotalWords = parseInt(localStorage.getItem('total_words') || '0', 10);
        const today = new Date().toISOString().split('T')[0];
        const todayKey = `words_${today}`;
        const localTodayWords = parseInt(localStorage.getItem(todayKey) || '0', 10);
        
        console.log(`Retrieved stats from localStorage: total words: ${localTotalWords}, today: ${localTodayWords}`);
        
        // Set initial stats from localStorage
        setStats({
          words: localTotalWords
        });
        
        // Then fetch from server to update if available
        try {
          const userStats = await getTodayStats();
          if (userStats.words > 0) {
            setStats({
              words: userStats.words
            });
            console.log(`Updated stats from server: ${userStats.words} words`);
          }
        } catch (statsError) {
          console.error('Failed to fetch stats from server, using localStorage only:', statsError);
        }

        // If active index is set but paragraph is already completed, reset it
        const savedIndex = localStorage.getItem('activeParaIndex');
        if (savedIndex && savedIndex !== 'null' && content && content.paragraphs) {
          const index = parseInt(savedIndex, 10);
          if (index < content.paragraphs.length && content.paragraphs[index]?.completed) {
            setActiveIndex(null);
            localStorage.setItem('activeParaIndex', 'null');
          } else if (index < content.paragraphs.length) {
            // Initialize typing state for saved paragraph
            setActiveIndex(index);
            setIsTyping(true);
          } else {
            // Find first uncompleted paragraph if saved is not available
            const firstUncompletedIndex = content.paragraphs.findIndex(p => !p.completed);
            if (firstUncompletedIndex >= 0) {
              setActiveIndex(firstUncompletedIndex);
              localStorage.setItem('activeParaIndex', firstUncompletedIndex.toString());
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchInitialData();
  }, []);
  
  const handleTextClick = useCallback((index: number) => {
    // First check if contentSet exists and has valid paragraphs
    if (!contentSet || !contentSet.paragraphs || 
        index < 0 || index >= contentSet.paragraphs.length) {
      console.error('Cannot handle text click: Content set not loaded or paragraph not found');
      return;
    }
    
    // Now safely check if paragraph is completed
    if (contentSet.paragraphs[index].completed) {
      console.log('Paragraph already completed');
      return;
    }
    
    // If we reach here, we can safely proceed
    setActiveIndex(index);
    setTypedContent('');
    setProgress(0);
    setIsTyping(true);
  }, [contentSet]);

  // Timer for tracking time spent - now only keeping the function without actual stats tracking
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    
    if (isTyping) {
      // Keep the timer for future use if needed, but don't update stats
      timerInterval = setInterval(async () => {
        await trackTimeSpent(10); // Call for compatibility, but results not used
      }, 10000);
    }
    
    return () => clearInterval(timerInterval);
  }, [isTyping]);
  
  // Function to scroll to a paragraph
  const scrollToParagraph = useCallback((index: number) => {
    // Find all paragraph elements
    const paragraphElements = document.querySelectorAll('.paragraph-container');
    if (paragraphElements && paragraphElements[index]) {
      // Scroll to the target paragraph with smooth behavior
      paragraphElements[index].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  // Handler for paragraph completion
  const handleParagraphComplete = useCallback(async (index: number) => {
    localStorage.removeItem('typedContent');
    localStorage.removeItem('progress');
    
    setShowSuccess(index);
    
    try {
      if (!contentSet || !contentSet.paragraphs) {
        console.error('Cannot complete paragraph: Content not loaded');
        return;
      }
      
      console.log(`Completing paragraph ${index + 1} of ${contentSet.paragraphs.length}`);
      
      // Mark paragraph as completed in content service
      const paragraphId = contentSet.paragraphs[index].id;
      const updatedContentSet = await completeParagraph(paragraphId);
      setContentSet(updatedContentSet);
      
      // Calculate word count for better tracking
      const paragraphContent = contentSet.paragraphs[index].content;
      const wordCount = paragraphContent.trim().split(/\s+/).length;
      console.log(`Paragraph completed with ${wordCount} words`);
      
      setIsTyping(false);
      
      // Track completed paragraph in stats - now only tracking words
      const userStats = await trackCompletedParagraph(contentSet.paragraphs[index].content);
      console.log('Updated user stats:', userStats);
      
      // Update stats in the UI immediately
      setStats({
        words: userStats.words
      });
      
      // Force clear any cached data to ensure fresh stats
      try {
        const today = new Date().toISOString().split('T')[0];
        const todayKey = `words_${today}`;
        const todayWords = localStorage.getItem(todayKey);
        console.log(`Today's words after paragraph completion: ${todayWords || '0'}`);
      } catch (e) {
        console.error('Error checking localStorage stats:', e);
      }
      
      // Trigger a refresh of stats components after a short delay
      // This delay ensures all database operations have completed
      setTimeout(() => {
        console.log('Refreshing stats with new refreshKey');
        setStatsRefreshKey(prevKey => {
          const newKey = prevKey + 1;
          console.log(`Stats refresh key updated: ${prevKey} -> ${newKey}`);
          return newKey;
        });
      }, 800); // Increase delay to ensure updates are complete
      
      // Set a timeout to move to the next paragraph after showing success message
      setTimeout(() => {
        setActiveIndex(null);
        setShowSuccess(null);
        
        // Check if there's a next paragraph and if it's not already completed
        if (contentSet && contentSet.paragraphs) {
          const nextIndex = index + 1;
          if (
            nextIndex < contentSet.paragraphs.length && 
            !contentSet.paragraphs[nextIndex].completed
          ) {
            // Automatically move to the next paragraph
            setActiveIndex(nextIndex);
            setTypedContent('');
            setProgress(0);
            setIsTyping(true);
            
            // Scroll to the next paragraph
            scrollToParagraph(nextIndex);
            
            console.log(`Moving to next paragraph (index: ${nextIndex})`);
          } else {
            console.log('No more uncompleted paragraphs to move to');
          }
        }
      }, 1500);
    } catch (error) {
      console.error('Error completing paragraph:', error);
    }
  }, [contentSet, scrollToParagraph, statsRefreshKey]);
  
  // Modified handleKeyPress to use the new completion handler
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (activeIndex === null || !contentSet || !contentSet.paragraphs || 
        activeIndex >= contentSet.paragraphs.length) {
      console.log('Cannot handle key press: Content or paragraph not available');
      return;
    }
    e.preventDefault();

    const currentText = contentSet.paragraphs[activeIndex].content;
    const nextExpectedChar = currentText[typedContent.length];
    if (!nextExpectedChar) return;

    const normalizedInput = normalizeChar(e.key);
    const normalizedExpected = normalizeChar(nextExpectedChar);

    if (normalizedInput.toLowerCase() === normalizedExpected.toLowerCase()) {
      const newTypedContent = typedContent + nextExpectedChar;
      setTypedContent(newTypedContent);
      const newProgress = (newTypedContent.length / currentText.length) * 100;
      setProgress(newProgress);

      if (newTypedContent === currentText) {
        handleParagraphComplete(activeIndex);
      }
    }
  }, [activeIndex, typedContent, contentSet, handleParagraphComplete]);

  useEffect(() => {
    if (isTyping) {
      window.addEventListener('keydown', handleKeyPress);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isTyping, handleKeyPress]);

  useEffect(() => {
    const handleResize = () => {
      // Check if the device is mobile
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);

      // Adjust viewport height for mobile keyboard
      if (isMobileDevice) {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modified mobile input handler to use the new completion handler
  const handleMobileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activeIndex === null || !contentSet || !contentSet.paragraphs ||
        activeIndex >= contentSet.paragraphs.length) {
      console.log('Cannot handle mobile input: Content or paragraph not available');
      return;
    }

    const currentText = contentSet.paragraphs[activeIndex].content;
    const inputValue = e.target.value;
    const lastChar = inputValue[inputValue.length - 1];
    if (!lastChar) return;

    const nextExpectedChar = currentText[typedContent.length];
    if (!nextExpectedChar) return;

    const normalizedInput = normalizeChar(lastChar);
    const normalizedExpected = normalizeChar(nextExpectedChar);

    if (normalizedInput.toLowerCase() === normalizedExpected.toLowerCase()) {
      const newTypedContent = typedContent + nextExpectedChar;
      setTypedContent(newTypedContent);
      const newProgress = (newTypedContent.length / currentText.length) * 100;
      setProgress(newProgress);

      if (newTypedContent === currentText) {
        handleParagraphComplete(activeIndex);
      }
    }
  };

  // Toggle stats expansion
  const toggleStatsExpansion = () => {
    // Add debounce to prevent multiple rapid toggles
    if (isTogglingStats) return;
    
    setIsTogglingStats(true);
    setIsStatsExpanded(!isStatsExpanded);
    
    // Reset toggle lock after a short delay
    setTimeout(() => {
      setIsTogglingStats(false);
    }, 500);
  };

  // Handler for marking wisdom sections as read
  const handleWisdomSectionClick = async (sectionId: string) => {
    if (!contentSet || !contentSet.wisdomSections) {
      console.error('Cannot complete wisdom section: Content not loaded or wisdom sections not available');
      return;
    }
    
    try {
      // Mark wisdom section as completed
      const updatedContentSet = await completeWisdomSection(sectionId);
      setContentSet(updatedContentSet);
    } catch (error) {
      console.error('Error completing wisdom section:', error);
    }
  };

  // Add a space key handler to move to next paragraph quickly
  useEffect(() => {
    const handleSpaceKey = (e: KeyboardEvent) => {
      // Only proceed if success message is showing and typing is not active
      if (showSuccess !== null && !isTyping) {
        // Check if space key was pressed
        if (e.code === 'Space' || e.key === ' ') {
          e.preventDefault(); // Prevent default space behavior
          
          // Get the next paragraph index
          const nextIndex = showSuccess + 1;
          
          // Clear current state
          setShowSuccess(null);
          setActiveIndex(null);
          
          // Move to next paragraph if available and not completed
          if (
            contentSet && 
            contentSet.paragraphs && 
            nextIndex < contentSet.paragraphs.length && 
            !contentSet.paragraphs[nextIndex].completed
          ) {
            setActiveIndex(nextIndex);
            setTypedContent('');
            setProgress(0);
            setIsTyping(true);
            
            // Scroll to the next paragraph
            scrollToParagraph(nextIndex);
          }
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleSpaceKey);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleSpaceKey);
    };
  }, [showSuccess, isTyping, contentSet, scrollToParagraph]);

  // Update the statsSection to use refreshKey
  const statsSection = (
    <div className="stats-section">
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <DailyStats className="flex-1" refreshKey={statsRefreshKey} />
        <TotalStats className="flex-1" refreshKey={statsRefreshKey} />
      </div>
      <div className="mt-6">
        <WeeklyPerformanceChart refreshKey={statsRefreshKey} />
      </div>
    </div>
  );

  // Loading state
  if (isLoading || !contentSet) {
    return <LoadingAnimation fullScreen message="Straipsnis kraunamas..." />;
  }

  return (
    <main className="min-h-screen bg-gradient-custom text-gray-800 flex flex-col items-center px-4 sm:px-6 py-10 font-playfair">
      {/* Stats Panel outside the main content flow */}
      <StatsPanel
        words={stats.words}
        texts={0}  // Kept for compatibility
        timeSpent="00:00"  // Kept for compatibility
        speed={0}  // Kept for compatibility
      />
      
      {/* Audio Player */}
      <AudioPlayer defaultVolume={0.3} />
      
      <header className="w-full max-w-6xl flex items-center justify-between py-4 px-2 md:px-6 mb-2 border-b border-gray-200">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight font-cormorant"
        >
          Readleta
        </motion.h1>
        <nav className="text-sm text-gray-500 font-light hidden md:block font-lora">
          Tik tiems, kurie ieško giliau
        </nav>
      </header>

      {/* Navigation Sections */}
      <div className="w-full max-w-6xl mb-6">
        <div className="flex justify-center items-center space-x-6 md:space-x-8 py-1 px-4 text-xs md:text-sm font-medium">
          <button 
            className={`text-gray-600 hover:text-black transition-colors duration-300 relative group px-4 py-2 ${isStatsExpanded ? 'font-normal' : 'font-light'}`}
            onClick={toggleStatsExpansion}
          >
            Pasiekimai
            <div className={`absolute -bottom-0.5 left-0 w-full h-[1px] bg-black transform scale-x-0 group-hover:scale-x-100 ${isStatsExpanded ? 'scale-x-100' : ''} transition-transform duration-300`}></div>
          </button>
          <button className="text-gray-600 hover:text-black transition-colors duration-300 relative group px-4 py-2 font-light">
            Taisyklės
            <div className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
          <button className="text-gray-600 hover:text-black transition-colors duration-300 relative group px-4 py-2 font-light">
            Tikslas
            <div className="absolute -bottom-0.5 left-0 w-full h-[1px] bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <AnimatePresence mode="wait">
        {isStatsExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 500, marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ 
              duration: 0.4,
              ease: "easeInOut"
            }}
            className="w-full max-w-6xl bg-white rounded-xl shadow-md overflow-y-auto"
          >
            <div className="p-6 relative">
              {/* Close button */}
              <button 
                onClick={toggleStatsExpansion}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Weekly Performance Chart Component */}
              {statsSection}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="w-full max-w-2xl mx-auto space-y-8 relative"
      >
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl md:text-3xl font-cormorant font-semibold text-gray-900 tracking-wide mb-2">
            {contentSet.title}
          </h1>
          <p className="text-lg text-gray-600 font-light italic">
            {contentSet.subtitle}
        </p>
      </motion.div>

        {contentSet.paragraphs.map((paragraph, index) => (
          <div key={paragraph.id} className="relative group min-h-[4rem] pt-8 paragraph-container">
            {/* Numbered bubble - above */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-lg font-semibold ${
                paragraph.completed ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
              } shadow-sm transition-all duration-300`}>
                {index + 1}
              </div>
            </div>

            {/* Text container */}
            <div
              className={`relative p-4 sm:p-5 rounded-lg transition-all duration-200 min-h-[120px] ${
                activeIndex === index ? 'bg-white shadow-lg' : ''
              } ${paragraph.completed ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
              onClick={() => !paragraph.completed && handleTextClick(index)}
              style={{ cursor: paragraph.completed ? 'default' : 'pointer' }}
            >
              <div className="relative">
                <p className={`text-sm sm:text-base text-gray-700 font-baskerville leading-relaxed tracking-wide whitespace-normal ${
                  activeIndex !== index ? 'first-letter:float-left first-letter:text-4xl first-letter:font-bold first-letter:mr-2 first-letter:mt-1 first-letter:font-baskerville first-letter:text-gray-900' : ''
                }`} style={{ wordBreak: 'keep-all', hyphens: 'none' }}>
                  {activeIndex === index ? (
                    <>
                      <span className="text-black">{typedContent}</span>
                      <span className="text-gray-400">
                        {paragraph.content.slice(typedContent.length)}
                      </span>
                      {isMobile && (
                        <input
                          type="text"
                          className="opacity-0 absolute inset-0 w-full h-full"
                          autoFocus
                          onChange={handleMobileInput}
                          inputMode="text"
                        />
                      )}
                    </>
                  ) : (
                    <span className={paragraph.completed ? 'text-black' : ''}>{paragraph.content}</span>
                  )}
                </p>
              </div>

              {/* Success message */}
              {showSuccess === index && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute inset-0 flex items-center justify-center z-10"
                >
                  <div className="py-1.5 px-4 bg-black text-white rounded-full shadow-lg text-sm font-medium success-message">
                    Puikiai
                  </div>
                </motion.div>
              )}

              {/* Progress bar */}
              {activeIndex === index && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Separator line */}
        <div className="w-full h-px bg-gray-200 my-6"></div>

        {/* Wisdom Sections */}
        <motion.div 
        initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-2xl mx-auto space-y-4 px-3 sm:px-4 mb-safe"
        >
          {/* Render wisdom sections based on type */}
          {contentSet.wisdomSections.map((section) => {
            // Determine the icon based on section type
            let SectionIcon = QuoteIcon;
            let bgColorClass = section.completed ? 'bg-amber-100/90' : 'bg-amber-50/80';
            let borderColorClass = section.completed ? 'border-amber-200' : 'border-amber-100';
            let textColorClass = section.completed ? 'text-amber-800' : 'text-amber-700';
            let activeTextColorClass = section.completed ? 'text-amber-900' : 'text-amber-800';
            let activeBgColorClass = 'text-amber-600 bg-amber-100';

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => handleWisdomSectionClick(section.id)}
                className={`p-4 rounded-xl ${bgColorClass} ${borderColorClass} border shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start gap-3">
                  <span className={`${textColorClass} shrink-0 mt-1`}>
                    <SectionIcon />
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <h3 className={`font-semibold ${activeTextColorClass} text-sm`}>{section.title}</h3>
                      {section.completed && (
                        <span className={`${activeBgColorClass} text-xs font-medium py-1 px-2 rounded-full`}>Perskaityta ✓</span>
                      )}
                    </div>
                    <p className={`text-sm sm:text-base ${section.completed ? 'text-gray-800' : 'text-gray-700'} font-baskerville leading-relaxed tracking-wide ${section.type === 'quote' ? 'italic' : ''}`}>
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Next Series Button - shown when all content is completed */}
      <AnimatePresence>
        {allContentCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <button 
              onClick={() => window.location.href = '/next-series'} 
              className="py-3 px-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <span>Sekanti serija</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
} 

// Add these styles to your CSS file
const styles = `
:root {
  --vh: 1vh;
}

.mb-safe {
  margin-bottom: env(safe-area-inset-bottom, 20px);
}

.h-safe-area-bottom {
  height: env(safe-area-inset-bottom, 20px);
}

@supports (-webkit-touch-callout: none) {
  .min-h-screen {
    min-height: -webkit-fill-available;
  }
}

/* Prevent content shift when keyboard appears */
@media (max-width: 768px) {
  .min-h-screen {
    min-height: calc(var(--vh, 1vh) * 100);
  }
}

/* Improve touch targets on mobile */
@media (max-width: 768px) {
  button, 
  [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
`;