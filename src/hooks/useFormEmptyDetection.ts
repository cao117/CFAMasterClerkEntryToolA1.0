/**
 * useFormEmptyDetection Hook
 * 
 * React hook that provides DOM-based empty form detection using event delegation.
 * Monitors all form inputs across all tabs to determine if any user data has been entered.
 * Used to prevent auto-save and recent-save when no user input exists.
 */

import { useRef, useState, useEffect, useCallback } from 'react';

export const useFormEmptyDetection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasAnyData, setHasAnyData] = useState(false);

  /**
   * Checks if any form input has data across all visible tabs
   * @returns boolean - true if any input has data, false if completely empty
   */
  const checkForData = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return false;
    }

    // Query ALL form inputs across ALL tabs
    const formElements = container.querySelectorAll('input, textarea, select');
    
    const hasUserData = Array.from(formElements).some((element: any) => {
      // Skip date inputs (auto-populated)
      if (element.type === 'date') {
        return false; // Ignore auto-populated dates
      }
      
      // Skip number inputs with default 0
      if (element.type === 'number') {
        const value = parseInt(element.value) || 0;
        return value > 0; // Only count positive numbers as user input
      }
      
      // Handle checkboxes/radios
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked;
      }
      
      // Handle selects (ignore default empty option)
      if (element.tagName === 'SELECT') {
        return element.value && element.value.trim() !== '';
      }
      
      // Text inputs - only non-empty values
      return element.value && element.value.trim() !== '';
    });


    setHasAnyData(hasUserData);
    return hasUserData;
  }, []);

  // Set up event delegation for form changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Single event listener handles ALL inputs across ALL tabs
    const handleFormChange = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        checkForData();
      }, 0);
    };

    container.addEventListener('input', handleFormChange);
    container.addEventListener('change', handleFormChange);

    // Initial check
    checkForData();

    return () => {
      container.removeEventListener('input', handleFormChange);
      container.removeEventListener('change', handleFormChange);
    };
  }, [checkForData]);

  return {
    containerRef,
    hasAnyData,
    checkForData // Export for manual checking before saves
  };
}; 