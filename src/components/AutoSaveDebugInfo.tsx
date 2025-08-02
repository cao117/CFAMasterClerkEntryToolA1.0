import React, { useState, useEffect } from 'react';
import { isBrowser } from '../utils/platformDetection';

/**
 * AutoSaveDebugInfo Component
 * 
 * A small debug component that displays information about auto-save files in localStorage
 * Only visible in browser mode
 */
export function AutoSaveDebugInfo() {
  const [autoSaveCount, setAutoSaveCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      if (!isBrowser()) return;
      
      let count = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cfa_autosave')) {
          count++;
        }
      }
      setAutoSaveCount(count);
    };

    updateCount();
    
    // Update count periodically
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isBrowser()) return null;

  return (
    <div className="text-xs text-gray-500 mb-2 flex items-center">
      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
      <span>Auto-saves in localStorage: {autoSaveCount}</span>
    </div>
  );
}

export default AutoSaveDebugInfo;