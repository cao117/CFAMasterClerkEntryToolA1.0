import React from 'react';
import { isBrowser } from '../utils/platformDetection';


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
  /** Callback function when auto-save is restored */
  onRestoreAutoSave?: (formData: any) => void;
  /** Callback function when manual auto-save is triggered */
  onManualAutoSave?: () => Promise<void>;
  /** Callback function when show auto-saves is triggered (shared with File Restore icon) */
  onShowAutoSaves?: () => void;
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
  onDismiss,
  onRestoreAutoSave,
  onManualAutoSave,
  onShowAutoSaves
}) => {
  
  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  const handleManualAutoSave = async () => {
    if (!onManualAutoSave) {
      console.log('Manual auto-save handler not available');
      return;
    }

    try {
      await onManualAutoSave();
      console.log('Manual auto-save completed successfully');
    } catch (error) {
      console.error('Manual auto-save failed:', error);
      // You could add a toast notification here if needed
    }
  };

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
            
            {/* Test Auto-Saves button - only visible in browser mode */}
            {isBrowser() && onRestoreAutoSave && (
              <button
                onClick={onShowAutoSaves}
                className="group relative px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 text-white text-xs font-bold rounded-xl border border-blue-400/50 shadow-lg transition-all duration-300 focus:outline-none hover:scale-105 hover:shadow-blue-200/40 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 hover:border-blue-300 active:scale-95"
                aria-label="Test auto-saves"
              >
                <span className="relative flex items-center space-x-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Test Auto-Saves</span>
                </span>
              </button>
            )}

            {/* Manual Auto-Save button - only visible in browser mode */}
            {isBrowser() && onManualAutoSave && (
              <button
                onClick={handleManualAutoSave}
                className="group relative px-4 py-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white text-xs font-bold rounded-xl border border-orange-400/50 shadow-lg transition-all duration-300 focus:outline-none hover:scale-105 hover:shadow-orange-200/40 hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 hover:border-orange-300 active:scale-95"
                aria-label="Manual auto-save"
              >
                <span className="relative flex items-center space-x-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Manual Auto-Save</span>
                </span>
              </button>
            )}
            
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