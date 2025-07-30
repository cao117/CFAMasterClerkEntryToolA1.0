import { useState, useEffect } from 'react';

/**
 * useScreenGuard Hook
 * 
 * Monitors screen size and determines if the current device/layout meets
 * the minimum 1280px requirement for the CFA Master Clerk Entry Tool.
 * 
 * @returns {string | null} - Fallback type or null if screen is valid:
 *   - 'tooSmall': Device is physically incapable of reaching 1280px
 *   - 'rotateOrResize': Device is capable but current layout is too narrow
 *   - null: Screen meets requirements
 */
export function useScreenGuard() {
  const [fallbackType, setFallbackType] = useState<'tooSmall' | 'rotateOrResize' | null>(null);

  useEffect(() => {
    /**
     * Evaluates screen size and determines fallback type
     * 
     * Logic:
     * 1. Check if device is physically capable of 1280px in any direction
     * 2. Check if current visible width meets 1280px requirement
     * 3. Return appropriate fallback type or null if valid
     */
    const evaluateScreenSize = () => {
      const maxScreenSize = Math.max(screen.width, screen.height); // Physical device capability
      const currentWidth = window.innerWidth; // Real-time visible area

      if (maxScreenSize < 1280) {
        // ❌ Case A: Device is physically too small in all directions
        setFallbackType('tooSmall');
      } else if (currentWidth < 1280) {
        // ❌ Case B: Device is large enough, but current layout is too narrow
        setFallbackType('rotateOrResize');
      } else {
        // ✅ Valid layout
        setFallbackType(null);
      }
    };

    // Initial evaluation
    evaluateScreenSize();

    // Re-evaluate on window resize (handles rotation, window resizing, etc.)
    const handleResize = () => {
      evaluateScreenSize();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return fallbackType;
} 