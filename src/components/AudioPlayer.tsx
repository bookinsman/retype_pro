import React, { useState, useRef, useEffect } from 'react';
import '../styles/AudioPlayer.css';

type ThemeType = 'atminčiai' | 'greičiui' | 'koncentracijai';

// Placeholder audio URLs - replace with actual URLs when available
const audioThemes = {
  atminčiai: '/audio/memory-theme.mp3',
  greičiui: '/audio/speed-theme.mp3',
  koncentracijai: '/audio/focus-theme.mp3'
};

interface AudioPlayerProps {
  defaultVolume?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ defaultVolume = 0.5 }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeType>('koncentracijai');
  const [volume, setVolume] = useState(defaultVolume);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Change audio source when theme changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = audioThemes[activeTheme];
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [activeTheme]);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  
  const toggleVolumeControl = () => {
    setShowVolumeControl(!showVolumeControl);
  };
  
  const togglePlayer = () => {
    setShowPlayer(!showPlayer);
  };
  
  const handleThemeChange = (theme: ThemeType) => {
    setActiveTheme(theme);
    // If not playing, start playing when theme is changed
    if (!isPlaying) {
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Couldn't autoplay:", e));
      }
    }
  };
  
  return (
    <>
      {/* Toggle button for mobile */}
      <button 
        className="audio-toggle-button"
        onClick={togglePlayer}
        aria-label="Toggle audio player"
      >
        <span className={`audio-toggle-icon ${isPlaying ? 'playing' : ''}`}></span>
      </button>
      
      {/* Main audio player */}
      <div className={`audio-player ${showPlayer ? 'active' : ''}`}>
        <audio ref={audioRef} loop />
        
        <div className="audio-player-controls">
          <button 
            className={`play-button ${isPlaying ? 'playing' : ''}`} 
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="play-icon"></span>
          </button>
          
          <button 
            className="volume-button" 
            onClick={toggleVolumeControl}
            aria-label="Volume"
          >
            <span className="volume-icon"></span>
          </button>
          
          {showVolumeControl && (
            <div className="volume-control">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume} 
                onChange={handleVolumeChange} 
                className="volume-slider"
                aria-label="Volume level"
              />
            </div>
          )}
        </div>
        
        <div className="audio-themes">
          <button 
            className={`theme-button ${activeTheme === 'atminčiai' ? 'active' : ''}`}
            onClick={() => handleThemeChange('atminčiai')}
          >
            Atminčiai
          </button>
          <button 
            className={`theme-button ${activeTheme === 'greičiui' ? 'active' : ''}`}
            onClick={() => handleThemeChange('greičiui')}
          >
            Greičiui
          </button>
          <button 
            className={`theme-button ${activeTheme === 'koncentracijai' ? 'active' : ''}`}
            onClick={() => handleThemeChange('koncentracijai')}
          >
            Koncentracijai
          </button>
        </div>
      </div>
    </>
  );
};

export default AudioPlayer; 