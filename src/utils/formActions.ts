// Shared action button logic for General and Championship tabs
import { exportShowToCSV } from './csvExport';

/**
 * Save to Temp CSV handler
 * Gathers the full show state, generates the CSV, and triggers a download.
 * @param getShowState - Function to retrieve the full show state (all tabs)
 * @param showSuccess - Toast function for success
 * @param showError - Toast function for error
 */
export function handleSaveToTempCSV(getShowState: () => any, showSuccess?: Function, showError?: Function) {
  try {
    // Get the full show state (all tabs)
    const showState = getShowState();
    // Generate CSV and filename
    const { csv, filename } = exportShowToCSV(showState);
    // Trigger file download in browser
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (showSuccess) showSuccess('CSV Exported', `File ${filename} has been downloaded.`, 6000);
  } catch (err) {
    if (showError) showError('CSV Export Failed', String(err), 8000);
  }
}

/**
 * Generate Final CSV handler
 * Same as Save Temp CSV, but can be extended for finalization logic.
 * @param getShowState - Function to retrieve the full show state (all tabs)
 * @param showSuccess - Toast function for success
 * @param showError - Toast function for error
 */
export function handleGenerateFinalCSV(getShowState: () => any, showSuccess?: Function, showError?: Function) {
  // For now, identical to handleSaveToTempCSV
  handleSaveToTempCSV(getShowState, showSuccess, showError);
}

/**
 * Restore from CSV handler (placeholder)
 */
export function handleRestoreFromCSV(...args: any[]) {
  // Get the toast functions from the arguments - they're usually the second to last parameter
  const showSuccess = args[args.length - 2];
  
  if (showSuccess) {
    showSuccess('Coming Soon', 'Restore from CSV functionality is currently in development and will be available in the next update.', 6000);
  }
}

/**
 * Reset handler (opens modal)
 */
export function handleReset(setIsResetModalOpen: (open: boolean) => void) {
  setIsResetModalOpen(true);
}

/**
 * TODO: Implement or inject getShowState() in the app context or props.
 * This function must return the full show state for all tabs as expected by exportShowToCSV.
 */ 