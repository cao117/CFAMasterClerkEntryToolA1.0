import React, { useState, useEffect } from 'react';
import { isBrowser } from '../utils/platformDetection';


/**
 * Props interface for the AutoSaveNotificationBar component
 */
interface AutoSaveNotificationBarProps {
  /** Whether the notification bar is visible */
  isVisible: boolean;
  /** The timestamp of the last save operation */
  lastSavedTime: string;
}

/**
 * AutoSaveNotificationBar Component
 * 
 * A cool animated horizontal notification bar that displays auto-save status.
 * Features smooth fade-in/fade-out animations with slide effects.
 * Positioned below the main task bar and above the content table.
 * Shows auto-save success with timestamp display for exactly 2 seconds.
 * Content is right-aligned for better visual balance.
 * Uses ultra-slow animations (1.2s fade-in/fade-out) for premium feel.
 * 
 * @param props - Component props
 * @returns JSX element or null if not visible
 */
const AutoSaveNotificationBar: React.FC<AutoSaveNotificationBarProps> = ({
  isVisible,
  lastSavedTime
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible && !isAnimating) {
      // Start fade-in animation
      setIsAnimating(true);
      setShouldShow(true);
    } else if (!isVisible && isAnimating) {
      // Start fade-out animation when isVisible becomes false
      setShouldShow(false);
      
      // After fade-out completes, reset state
      const resetTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 1200); // Match fade-out duration (1.2s)
      
      return () => clearTimeout(resetTimer);
    }
  }, [isVisible, isAnimating]);

  // Don't render if not visible and not animating
  if (!isVisible && !isAnimating) {
    return null;
  }

  return (
    <div 
      className={`w-full bg-gradient-to-r from-slate-50/90 via-white/95 to-emerald-50/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm ${
        shouldShow ? 'animate-autosave-fade-in' : 'animate-autosave-fade-out'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Auto-save notification"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-end">
          {/* Right side - Status information with cool animation */}
          <div className="flex items-center space-x-3">
            {/* Animated success icon with pulse effect */}
            <div className="flex-shrink-0">
              <div className={`w-6 h-6 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-300/50 ${
                shouldShow ? 'animate-autosave-icon-pulse' : ''
              }`}>
                <svg 
                  width="12" 
                  height="12" 
                  fill="none" 
                  viewBox="0 0 24 24"
                  className="text-white drop-shadow-sm"
                  aria-hidden="true"
                >
                  <path 
                    d="M20 6L9 17l-5-5" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            
            {/* Animated text content with typography hierarchy */}
            <div className="flex items-center space-x-3">
              <span className={`text-slate-800 font-bold text-sm tracking-wide ${
                shouldShow ? 'animate-autosave-text-slide' : ''
              }`} style={{ animationDelay: shouldShow ? '0.1s' : '0s' }}>
                Auto-saved
              </span>
              <span className={`text-emerald-600 font-medium text-xs tracking-tight ${
                shouldShow ? 'animate-autosave-text-slide' : ''
              }`} style={{ animationDelay: shouldShow ? '0.2s' : '0s' }}>
                {lastSavedTime}
              </span>
            </div>
          </div>

          {/* Right-aligned content - notification bar simplified */}
        </div>
      </div>
    </div>
  );
};

export default AutoSaveNotificationBar; 