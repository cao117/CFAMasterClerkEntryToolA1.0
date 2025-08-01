/**
 * Recent Save Service
 * 
 * Provides automatic saving of form data to "Recent Save" location every 15 seconds.
 * This is a separate mechanism from the main auto-save system and runs independently.
 * Uses localStorage for both browser and Tauri modes for simplified implementation.
 */

import { createExcelFromFormData } from './excelExport';
import type { AutoSaveEntry } from '../types/autoSave';

export class RecentSaveService {
  private saveTimer: NodeJS.Timeout | null = null;
  private currentFormData: any = null;
  private isPageLoaded = false;

  /**
   * Starts recent save with 15-second interval
   * @param formData - Current form data to save
   * @param checkForData - Optional function to check if form has any user input
   */
  async startRecentSave(formData: any, checkForData?: () => boolean): Promise<void> {
    // Clear any existing timer to prevent multiple timers running
    this.stopRecentSave();
    this.currentFormData = formData;
    
    // Wait for page to be completely loaded before starting timer
    if (!this.isPageLoaded) {
      // Set flag when page is loaded
      this.isPageLoaded = true;
    }
    
    // 15 seconds in milliseconds (hardcoded as per requirements)
    const intervalMs = 15 * 1000;
    
    console.log(`🔍 DEBUG: Recent-save timer started - every 15 seconds, enhanced detection: ${!!checkForData}`);
    
    // Set up recurring recent save - timer starts but no immediate save on page load
    // Recent save will only execute after the first 15-second interval is reached
    this.saveTimer = setInterval(() => {
      if (this.currentFormData) {
        if (checkForData) {
          // Use enhanced save with empty form detection
          this.performEnhancedRecentSave(this.currentFormData, checkForData);
        } else {
          // Use original save without empty form detection
          this.performRecentSave(this.currentFormData);
        }
      }
    }, intervalMs);
    

  }

  /**
   * Updates form data for next save cycle
   * Call this whenever form data changes
   */
  updateFormData(formData: any): void {
    this.currentFormData = formData;
  }

  /**
   * Stops recent save timer
   */
  stopRecentSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Performs a single recent save operation
   * @param formData - Current form data to save
   */
  async performRecentSave(formData: any): Promise<void> {
    try {
      // Use localStorage for both browser and Tauri - simplified single implementation
      await this.saveToBrowserStorage(formData);
      
      console.log('✅ RECENT-SAVE COMPLETED: Recent Save');
      
    } catch (error) {
      console.error('❌ RECENT-SAVE FAILED:', error);
    }
  }

  /**
   * Enhanced recent save with empty form detection
   * @param formData - Current form data to save
   * @param checkForData - Function to check if form has any user input
   */
  async performEnhancedRecentSave(formData: any, checkForData: () => boolean): Promise<void> {
    // Check if form has any data before saving
    const formHasData = checkForData();
    
    if (!formHasData) {
      return; // Skip this save round
    }
    
    // Continue with existing recent save logic
    await this.performRecentSave(formData);
  }

  /**
   * Saves form data to browser storage as "Recent Save"
   * @param formData - Current form data to save
   */
  private async saveToBrowserStorage(formData: any): Promise<void> {
    try {
      // Browser: Create Excel file and store as base64 in localStorage
      const storageKey = 'Recent Save';
      
      // Use the shared Excel generation function
      const { buffer } = createExcelFromFormData(formData);
      
      // Convert to base64 for localStorage storage
      const base64Excel = this.bufferToBase64(buffer);
      
      const autoSaveEntry: AutoSaveEntry = {
        excelData: base64Excel,
        timestamp: new Date().toISOString(),
        fileNumber: 0, // Special number for Recent Save
        filename: 'Recent Save'
      };
      
      localStorage.setItem(storageKey, JSON.stringify(autoSaveEntry));
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Converts buffer to base64 string
   * @param buffer - Excel file buffer
   * @returns base64 string
   */
  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Gets the Recent Save file if it exists
   * @returns Promise<AutoSaveEntry | null> - Recent save entry or null if not found
   */
  async getRecentSaveFile(): Promise<AutoSaveEntry | null> {
    try {
      const storageKey = 'Recent Save';
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const entry: AutoSaveEntry = JSON.parse(stored);
        return entry;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clears the Recent Save file
   */
  async clearRecentSaveFile(): Promise<void> {
    try {
      localStorage.removeItem('Recent Save');
    } catch (error) {
      // Silent error handling for clear issues
    }
  }
} 