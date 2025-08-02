/**
 * useAutoSave Hook
 * 
 * React hook that integrates auto-save functionality with existing settings and form state.
 * Automatically starts/stops auto-save based on form data availability and settings.
 */

import { useRef, useEffect, useState } from 'react';
import { AutoSaveService } from '../utils/autoSaveService';

interface UseAutoSaveOptions {
  numberOfFiles?: number;
  saveFrequencyMinutes?: number;
  enabled?: boolean;
}

interface AutoSaveStatus {
  isActive: boolean;
  lastSaveTime: string | null;
  nextSaveIn: number; // seconds until next save
  fileNumber: number | null; // current file number in rotation
}

export function useAutoSave(formData: any, options: UseAutoSaveOptions = {}) {
  const autoSaveService = useRef(new AutoSaveService());
  const [status, setStatus] = useState<AutoSaveStatus>({
    isActive: false,
    lastSaveTime: null,
    nextSaveIn: 0,
    fileNumber: null
  });

  // Default values - these should match the hardcoded values in SettingsPanel
  const {
    numberOfFiles = 3,
    saveFrequencyMinutes = 5,
    enabled = true
  } = options;

  useEffect(() => {
    // Auto-save event listener for status updates
    const handleAutoSaveEvent = (event: CustomEvent) => {
      const { fileNumber, timestamp } = event.detail;
      setStatus(prev => ({
        ...prev,
        lastSaveTime: timestamp,
        fileNumber: fileNumber
      }));
    };

    window.addEventListener('cfa-autosave', handleAutoSaveEvent as EventListener);
    
    return () => {
      window.removeEventListener('cfa-autosave', handleAutoSaveEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    // Start auto-save when we have form data and valid settings
    if (formData && enabled && numberOfFiles > 0 && saveFrequencyMinutes > 0) {
      autoSaveService.current.startAutoSave(formData, numberOfFiles, saveFrequencyMinutes);
      setStatus(prev => ({
        ...prev,
        isActive: true
      }));
    } else {
      // Stop auto-save if no data or invalid settings
      autoSaveService.current.stopAutoSave();
      setStatus(prev => ({
        ...prev,
        isActive: false
      }));
    }
    
    return () => {
      autoSaveService.current.stopAutoSave();
    };
  }, [numberOfFiles, saveFrequencyMinutes, enabled]); // Remove formData dependency to prevent restart on every form change

  useEffect(() => {
    // Update form data in service when it changes
    if (formData) {
      autoSaveService.current.updateFormData(formData);
    }
  }, [formData]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      autoSaveService.current.stopAutoSave();
    };
  }, []);

  // Manual save trigger
  const triggerManualSave = async (): Promise<void> => {
    if (formData && numberOfFiles > 0) {
      // Manually trigger a single save without starting a new timer
      await autoSaveService.current.performSingleSave(formData);
    }
  };

  // Get auto-save files
  const getAutoSaveFiles = async () => {
    return await autoSaveService.current.getAutoSaveFiles();
  };

  // Clear auto-save files
  const clearAutoSaveFiles = async (): Promise<void> => {
    await autoSaveService.current.clearAutoSaveFiles();
  };

  return {
    status,
    triggerManualSave,
    getAutoSaveFiles,
    clearAutoSaveFiles,
    service: autoSaveService.current
  };
}