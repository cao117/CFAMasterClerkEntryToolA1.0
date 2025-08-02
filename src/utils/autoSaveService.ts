/**
 * Auto-Save Service
 * 
 * Provides automatic saving of form data as Excel files with rotating file management.
 * Works in both Tauri desktop apps (real files) and browsers (localStorage).
 */

import { isDesktop } from './platformDetection';
import { createExcelFromFormData } from './excelExport';

// Define Tauri API types for better TypeScript support
declare global {
  interface Window {
    __TAURI__?: {
      path: {
        appDataDir(): Promise<string>;
        join(...paths: string[]): Promise<string>;
      };
      fs: {
        writeBinaryFile(path: string, data: Uint8Array): Promise<void>;
      };
    };
  }
}

export interface AutoSaveEntry {
  excelData: string; // base64 encoded Excel data for browser storage
  timestamp: string;
  fileNumber: number;
  filename: string;
}

export class AutoSaveService {
  private currentFileIndex = 0;
  private saveTimer: NodeJS.Timeout | null = null;
  private currentFormData: any = null;

  /**
   * Starts auto-save with rotating files based on user settings
   * @param formData - Current form data to save
   * @param numberOfFiles - Number from existing "Number of files" setting
   * @param frequencyMinutes - Minutes from existing "Save frequency" setting
   */
  async startAutoSave(formData: any, numberOfFiles: number, frequencyMinutes: number): Promise<void> {
    // Clear any existing timer to prevent multiple timers running
    this.stopAutoSave();
    this.currentFormData = formData;
    
    // Convert frequency to milliseconds
    const intervalMs = frequencyMinutes * 60 * 1000;
    
    // Perform initial save immediately (only on first load, not on every settings change)
    if (!this.saveTimer) {
      await this.performRotatingAutoSave(formData, numberOfFiles);
    }
    
    // Set up recurring auto-save
    this.saveTimer = setInterval(() => {
      if (this.currentFormData) {
        this.performRotatingAutoSave(this.currentFormData, numberOfFiles);
      }
    }, intervalMs);
    
    console.log(`Auto-save started: ${numberOfFiles} files, every ${frequencyMinutes} minutes`);
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
      
      if (isDesktop()) {
        await this.saveToTauriFile(formData, fileNumber);
      } else {
        await this.saveToBrowserStorage(formData, fileNumber);
      }
      
      console.log(`Manual save completed: autosave${fileNumber}`);
      
      // Trigger auto-save notification event for UI
      this.triggerAutoSaveNotification(fileNumber);
      
      // Move to next file for next cycle
      this.currentFileIndex = (this.currentFileIndex + 1) % numberOfFiles;
    } catch (error) {
      console.error(`Manual save failed:`, error);
    }
  }

  /**
   * Manually trigger an auto-save (for testing purposes)
   * Uses the same rotation logic as automatic saves
   * @param formData - Current form data to save
   * @param numberOfFiles - Number of files in rotation (defaults to 3)
   */
  async performManualAutoSave(formData: any, numberOfFiles: number = 3): Promise<void> {
    console.log('Manual auto-save triggered');
    
    try {
      // Use the same rotation logic as automatic saves
      await this.performRotatingAutoSave(formData, numberOfFiles);
      
      console.log('Manual auto-save completed');
    } catch (error) {
      console.error('Manual auto-save failed:', error);
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
      console.log('Auto-save stopped');
    }
  }

  private async performRotatingAutoSave(formData: any, numberOfFiles: number): Promise<void> {
    // Calculate which file number to save to (1-based indexing for user clarity)
    const fileNumber = (this.currentFileIndex % numberOfFiles) + 1;
    
    try {
      if (isDesktop()) {
        await this.saveToTauriFile(formData, fileNumber);
      } else {
        await this.saveToBrowserStorage(formData, fileNumber);
      }
      
      console.log(`Auto-save completed: autosave${fileNumber}`);
      
      // Trigger auto-save notification event for UI
      this.triggerAutoSaveNotification(fileNumber);
      
    } catch (error) {
      console.error(`Auto-save failed for file ${fileNumber}:`, error);
    }
    
    // Move to next file for next cycle
    this.currentFileIndex = (this.currentFileIndex + 1) % numberOfFiles;
  }

  private async saveToTauriFile(formData: any, fileNumber: number): Promise<void> {
    try {
      // Check if Tauri APIs are available
      if (!window.__TAURI__?.path || !window.__TAURI__?.fs) {
        throw new Error('Tauri APIs not available');
      }

      // Get AppData directory path
      const appDataPath = await window.__TAURI__.path.appDataDir();
      const fileName = `autosave${fileNumber}.xlsx`;
      const filePath = await window.__TAURI__.path.join(appDataPath, fileName);
      
      // Use the shared Excel generation function
      const { buffer } = createExcelFromFormData(formData);
      
      // Write Excel file to disk
      await window.__TAURI__.fs.writeBinaryFile(filePath, buffer);
      
      console.log(`Auto-saved to AppData: ${fileName} at ${filePath}`);
      
    } catch (error) {
      console.error('Tauri auto-save error:', error);
      // Fallback to browser storage if Tauri fails
      await this.saveToBrowserStorage(formData, fileNumber);
    }
  }

  private async saveToBrowserStorage(formData: any, fileNumber: number): Promise<void> {
    try {
      // Browser: Create Excel file and store as base64 in localStorage
      const storageKey = `cfa_autosave${fileNumber}`;
      

      
      // Use the shared Excel generation function
      const { buffer } = createExcelFromFormData(formData);
      
      // Convert to base64 for localStorage storage
      const base64Excel = this.bufferToBase64(buffer);
      
      const autoSaveEntry: AutoSaveEntry = {
        excelData: base64Excel,
        timestamp: new Date().toISOString(),
        fileNumber: fileNumber,
        filename: `autosave${fileNumber}.xlsx`
      };
      
      localStorage.setItem(storageKey, JSON.stringify(autoSaveEntry));
      console.log(`Auto-saved to localStorage: ${storageKey}`);
      
    } catch (error) {
      console.error('Browser auto-save error:', error);
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
        platform: isDesktop() ? 'desktop' : 'browser'
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
    
    if (isDesktop()) {
      // For Tauri, we'd need to list files in AppData directory
      // This would require additional Tauri APIs
      console.log('Auto-save file listing not yet implemented for Tauri');
    } else {
      // For browser, check localStorage for auto-save entries
      for (let i = 1; i <= 10; i++) { // Check up to 10 possible files
        const storageKey = `cfa_autosave${i}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            const entry: AutoSaveEntry = JSON.parse(stored);
            files.push(entry);
          } catch (error) {
            console.error(`Error parsing auto-save entry ${i}:`, error);
          }
        }
      }
    }
    
    return files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Clears all auto-save files
   */
  async clearAutoSaveFiles(): Promise<void> {
    if (isDesktop()) {
      console.log('Auto-save file clearing not yet implemented for Tauri');
    } else {
      // Clear from localStorage
      for (let i = 1; i <= 10; i++) {
        localStorage.removeItem(`cfa_autosave${i}`);
      }
      console.log('All auto-save files cleared from localStorage');
    }
  }
}