import React from 'react';

/**
 * Props interface for the AutoSaveNotificationBar component
 */
interface AutoSaveNotificationBarProps {
  /** Whether the notification bar is visible */
  isVisible: boolean;
  /** The timestamp of the last save operation */
  lastSavedTime: string;
  /** Callback function when "View Recovery Options" is clicked */
  onViewRecovery: () => void;
  /** Callback function when "Dismiss" is clicked */
  onDismiss: () => void;
}

/**
 * AutoSaveNotificationBar Component
 * 
 * A vibrant, modern horizontal notification bar that displays auto-save status with cool action buttons.
 * Positioned below the main task bar and above the content table.
 * Uses vibrant typography hierarchy and modern gradient button effects.
 * 
 * @param props - Component props
 * @returns JSX element or null if not visible
 */
const AutoSaveNotificationBar: React.FC<AutoSaveNotificationBarProps> = ({
  isVisible,
  lastSavedTime,
  onViewRecovery,
  onDismiss
}) => {
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="w-full bg-gradient-to-r from-slate-50/90 via-white/95 to-emerald-50/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Auto-save notification"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Status information */}
          <div className="flex items-center space-x-3">
            {/* Vibrant success icon */}
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg border border-emerald-300/50">
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
            
            {/* Vibrant text content with typography hierarchy */}
            <div className="flex items-center space-x-3">
              <span className="text-slate-800 font-bold text-sm tracking-wide">
                Auto-saved
              </span>
              <span className="text-emerald-600 font-medium text-xs tracking-tight">
                {lastSavedTime}
              </span>
            </div>
          </div>

          {/* Right side - Cool modern action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onViewRecovery}
              className="group relative px-4 py-2 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white text-xs font-bold rounded-xl border border-emerald-400/50 shadow-lg transition-all duration-300 focus:outline-none hover:scale-105 hover:shadow-emerald-200/40 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 hover:border-emerald-300 active:scale-95"
              aria-label="View recovery options"
            >
              <span className="relative flex items-center space-x-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Recovery</span>
              </span>
            </button>
            <button
              onClick={onDismiss}
              className="group relative px-4 py-2 bg-gradient-to-r from-slate-500 via-gray-500 to-slate-600 text-white text-xs font-bold rounded-xl border border-slate-400/50 shadow-lg transition-all duration-300 focus:outline-none hover:scale-105 hover:shadow-slate-200/40 hover:from-slate-600 hover:via-gray-600 hover:to-slate-700 hover:border-slate-300 active:scale-95"
              aria-label="Dismiss notification"
            >
              <span className="relative flex items-center space-x-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Dismiss</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoSaveNotificationBar; 