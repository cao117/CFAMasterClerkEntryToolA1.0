/**
 * Auto-Save Service
 * 
 * Provides automatic saving of form data as Excel files with rotating file management.
 * Uses localStorage for both browser and Tauri modes for simplified implementation.
 */

import { createExcelFromFormData } from './excelExport';
import type { AutoSaveEntry } from '../types/autoSave';

export class AutoSaveService {
  private currentFileIndex = 0;
  private saveTimer: NodeJS.Timeout | null = null;
  private currentFormData: any = null;

  /**
   * Starts auto-save with rotating files based on user settings
   * @param formData - Current form data to save
   * @param numberOfFiles - Number from existing "Number of files" setting
   * @param frequencyMinutes - Minutes from existing "Save frequency" setting
   * @param checkForData - Optional function to check if form has any user input
   */
  async startAutoSave(formData: any, numberOfFiles: number, frequencyMinutes: number, checkForData?: () => boolean): Promise<void> {
    // Clear any existing timer to prevent multiple timers running
    this.stopAutoSave();
    this.currentFormData = formData;
    
    // Convert frequency to milliseconds
    const intervalMs = frequencyMinutes * 60 * 1000;
    
    console.log(`🔍 DEBUG: Auto-save timer started - ${numberOfFiles} files, every ${frequencyMinutes} minutes, enhanced detection: ${!!checkForData}`);
    
    // Set up recurring auto-save - timer starts but no immediate save on page load
    // Auto-save will only execute after the first save cycle interval is reached
    this.saveTimer = setInterval(() => {
      if (this.currentFormData) {
        if (checkForData) {
          // Use enhanced save with empty form detection
          this.performEnhancedRotatingAutoSave(this.currentFormData, numberOfFiles, checkForData);
        } else {
          // Use original save without empty form detection
          this.performRotatingAutoSave(this.currentFormData, numberOfFiles);
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
   * Performs a single save operation without starting/restarting the auto-save timer
   * @param formData - Current form data to save
   */
  async performSingleSave(formData: any): Promise<void> {
    try {
      // Use default number of files (3) for manual saves
      const numberOfFiles = 3;
      // Calculate which file number to save to (1-based indexing for user clarity)
      const fileNumber = (this.currentFileIndex % numberOfFiles) + 1;
      
      // Use localStorage for both browser and Tauri - simplified single implementation
      await this.saveToBrowserStorage(formData, fileNumber);
      
      console.log(`✅ AUTO-SAVE COMPLETED: autosave${fileNumber}`);
      
      // Trigger auto-save notification event for UI
      this.triggerAutoSaveNotification(fileNumber);
      
      // Move to next file for next cycle
      this.currentFileIndex = (this.currentFileIndex + 1) % numberOfFiles;
    } catch (error) {
      console.error(`❌ AUTO-SAVE FAILED:`, error);
    }
  }

  /**
   * Enhanced single save with empty form detection
   * @param formData - Current form data to save
   * @param checkForData - Function to check if form has any user input
   */
  async performEnhancedSingleSave(formData: any, checkForData: () => boolean): Promise<void> {
    // Check if form has any data before saving
    const formHasData = checkForData();
    
    if (!formHasData) {
      return; // Skip this save round
    }
    
    // Continue with existing save logic
    await this.performSingleSave(formData);
  }

  /**
   * Manually trigger an auto-save (for testing purposes)
   * Uses the same rotation logic as automatic saves
   * @param formData - Current form data to save
   * @param numberOfFiles - Number of files in rotation (defaults to 3)
   */
  async performManualAutoSave(formData: any, numberOfFiles: number = 3): Promise<void> {
    try {
      // Use the same rotation logic as automatic saves
      await this.performRotatingAutoSave(formData, numberOfFiles);
    } catch (error) {
      throw error;
    }
  }



  /**
   * Stops auto-save timer
   */
  stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  private async performRotatingAutoSave(formData: any, numberOfFiles: number): Promise<void> {
    // Calculate which file number to save to (1-based indexing for user clarity)
    const fileNumber = (this.currentFileIndex % numberOfFiles) + 1;
    
    try {
      // Use localStorage for both browser and Tauri - simplified single implementation
      await this.saveToBrowserStorage(formData, fileNumber);
      
      console.log(`✅ AUTO-SAVE COMPLETED: autosave${fileNumber}`);
      
      // Trigger auto-save notification event for UI
      this.triggerAutoSaveNotification(fileNumber);
      
    } catch (error) {
      console.error(`❌ AUTO-SAVE FAILED:`, error);
    }
    
    // Move to next file for next cycle
    this.currentFileIndex = (this.currentFileIndex + 1) % numberOfFiles;
  }

  /**
   * Enhanced rotating auto-save with empty form detection
   * @param formData - Current form data to save
   * @param numberOfFiles - Number of files in rotation
   * @param checkForData - Function to check if form has any user input
   */
  private async performEnhancedRotatingAutoSave(formData: any, numberOfFiles: number, checkForData: () => boolean): Promise<void> {
    // Check if form has any data before saving
    const formHasData = checkForData();
    
    if (!formHasData) {
      return; // Skip this save round
    }
    
    // Continue with existing rotating save logic
    await this.performRotatingAutoSave(formData, numberOfFiles);
  }



  private async saveToBrowserStorage(formData: any, fileNumber: number): Promise<void> {
    try {
      // Browser: Create Excel file and store as base64 in localStorage
      const storageKey = `Auto Save ${fileNumber}`;
      

      
      // Use the shared Excel generation function
      const { buffer } = createExcelFromFormData(formData);
      
      // Convert to base64 for localStorage storage
      const base64Excel = this.bufferToBase64(buffer);
      
      const autoSaveEntry: AutoSaveEntry = {
        excelData: base64Excel,
        timestamp: new Date().toISOString(),
        fileNumber: fileNumber,
        filename: `Auto Save ${fileNumber}`
      };
      
      localStorage.setItem(storageKey, JSON.stringify(autoSaveEntry));
      
    } catch (error) {
      throw error;
    }
  }

  private bufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private triggerAutoSaveNotification(fileNumber: number): void {
    // Dispatch custom event for auto-save notification
    const event = new CustomEvent('cfa-autosave', {
      detail: {
        fileNumber,
        timestamp: new Date().toISOString(),
        platform: 'localStorage' // Unified platform for both browser and Tauri
      }
    });
    window.dispatchEvent(event);
  }

  /**
   * Gets list of available auto-save files
   * @returns Promise<AutoSaveEntry[]> - List of auto-save entries
   */
  async getAutoSaveFiles(): Promise<AutoSaveEntry[]> {
    const files: AutoSaveEntry[] = [];
    
    // Check localStorage for auto-save entries (unified for both browser and Tauri)
    for (let i = 1; i <= 10; i++) { // Check up to 10 possible files
      const storageKey = `Auto Save ${i}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const entry: AutoSaveEntry = JSON.parse(stored);
          files.push(entry);
        } catch (error) {
          // Silent error handling for parsing issues
        }
      }
    }
    
    return files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clears all auto-save files
   */
  async clearAutoSaveFiles(): Promise<void> {
    // Clear from localStorage (unified for both browser and Tauri)
    for (let i = 1; i <= 10; i++) {
      localStorage.removeItem(`Auto Save ${i}`);
    }
  }

  /**
   * Cleanup excess auto-save files when numberOfSaves is reduced
   * @param newNumberOfSaves - New number of files to keep
   */
  async cleanupExcessAutoSaveFiles(newNumberOfSaves: number): Promise<void> {
    try {
      // Use localStorage for both browser and Tauri - simplified single implementation
      this.cleanupExcessLocalStorageFiles(newNumberOfSaves);
    } catch (error) {
      // Silent error handling for cleanup issues
    }
  }

  private cleanupExcessLocalStorageFiles(newNumberOfSaves: number): void {
    // Remove excess localStorage entries
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('Auto Save ')) {
        // Extract file number from key (e.g., "Auto Save 3" -> 3)
        const match = key.match(/Auto Save (\d+)/);
        if (match) {
          const fileNumber = parseInt(match[1]);
          if (fileNumber > newNumberOfSaves) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    // Remove excess files
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
  }
}