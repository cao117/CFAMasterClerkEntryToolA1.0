/**
 * useRecentSave Hook
 * 
 * React hook that integrates recent save functionality with existing form state.
 * Automatically starts/stops recent save based on form data availability.
 * Runs independently from the main auto-save system.
 */

import { useRef, useEffect } from 'react';
import { RecentSaveService } from '../utils/recentSaveService';

export function useRecentSave(formData: any) {
  const recentSaveService = useRef(new RecentSaveService());

  useEffect(() => {
    // Start recent save when we have form data
    if (formData) {
      recentSaveService.current.startRecentSave(formData);
    } else {
      // Stop recent save if no data
      recentSaveService.current.stopRecentSave();
    }
    
    return () => {
      recentSaveService.current.stopRecentSave();
    };
  }, []); // Only run once on mount to start the service

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

  return {
    getRecentSaveFile,
    clearRecentSaveFile,
    service: recentSaveService.current
  };
} 