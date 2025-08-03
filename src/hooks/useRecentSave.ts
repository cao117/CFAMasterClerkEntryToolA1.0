/**
 * useRecentSave Hook
 * 
 * React hook that integrates recent save functionality with existing form state.
 * Automatically starts/stops recent save based on form data availability.
 * Runs independently from the main auto-save system.
 */

import { useRef, useEffect } from 'react';
import { RecentSaveService } from '../utils/recentSaveService';

export function useRecentSave(formData: any, checkForData?: () => boolean) {
  const recentSaveService = useRef(new RecentSaveService());

  useEffect(() => {
    // Start recent save when we have form data
    if (formData) {
      // Pass checkForData function to enable enhanced empty form detection
      recentSaveService.current.startRecentSave(formData, checkForData);
    } else {
      // Stop recent save if no data
      recentSaveService.current.stopRecentSave();
    }
    
    return () => {
      recentSaveService.current.stopRecentSave();
    };
  }, [checkForData]); // Re-run when checkForData changes

  useEffect(() => {
    // Update form data in service when it changes
    if (formData) {
      recentSaveService.current.updateFormData(formData);
    }
  }, [formData]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      recentSaveService.current.stopRecentSave();
    };
  }, []);

  // Get recent save file
  const getRecentSaveFile = async () => {
    return await recentSaveService.current.getRecentSaveFile();
  };

  // Clear recent save file
  const clearRecentSaveFile = async (): Promise<void> => {
    await recentSaveService.current.clearRecentSaveFile();
  };

  /**
   * Enhanced recent-save wrapper with empty form detection
   * @param checkForData - Function to check if form has any user input
   */
  const triggerEnhancedRecentSave = async (checkForData: () => boolean): Promise<void> => {

    if (formData) {
      await recentSaveService.current.performEnhancedRecentSave(formData, checkForData);
    } else {

    }
  };

  return {
    getRecentSaveFile,
    clearRecentSaveFile,
    triggerEnhancedRecentSave, // New enhanced wrapper
    service: recentSaveService.current
  };
} 