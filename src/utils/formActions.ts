// Shared action button logic for General and Championship tabs
import { parseCSVAndRestoreState } from './csvImport';

interface GetShowStateFunction {
  (): Record<string, unknown>;
}

interface SuccessCallback {
  (title: string, message?: string, duration?: number): void;
}

interface ErrorCallback {
  (title: string, message?: string, duration?: number): void;
}

/**
 * Handles Excel import with file selection dialog (updated from CSV to support Excel format)
 * @param showSuccess - Success callback function
 * @param showError - Error callback function
 * @returns Promise that resolves to the restored state or null
 */
export async function handleRestoreFromCSV(
  showSuccess: SuccessCallback,
  showError: ErrorCallback
): Promise<any> {
  try {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.csv'; // Accept both Excel and CSV for backward compatibility
    
    return new Promise((resolve) => {
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        // Check file type and parse accordingly
        if (file.name.toLowerCase().endsWith('.xlsx')) {
          // Parse Excel file
          const { parseExcelAndRestoreState } = await import('./excelImport');
          const arrayBuffer = await file.arrayBuffer();
          const restoredState = parseExcelAndRestoreState(arrayBuffer, showSuccess, showError);
          resolve(restoredState);
        } else {
          // Parse CSV file (backward compatibility)
          const { parseCSVAndRestoreState } = await import('./csvImport');
          const text = await file.text();
          const restoredState = parseCSVAndRestoreState(text, showSuccess, showError);
          resolve(restoredState);
        }
      };
      
      input.click();
    });
  } catch (error) {
    showError('Import Error', 'An error occurred while importing the file.');
    return null;
  }
}

/**
 * Handles reset confirmation modal
 * @param setIsResetModalOpen - Function to control reset modal visibility
 */
export function handleReset(setIsResetModalOpen: (open: boolean) => void) {
  setIsResetModalOpen(true);
}

/**
 * TODO: Implement or inject getShowState() in the app context or props.
 * This function must return the full show state for all tabs as expected by exportShowToCSV.
 */ 