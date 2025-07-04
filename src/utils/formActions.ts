// Shared action button logic for General and Championship tabs
import { handleSaveToCSV as csvExportSave, handleRestoreFromCSV as csvExportRestore } from './csvExport';

interface ShowState {
  general: Record<string, unknown>;
  judges: Array<Record<string, unknown>>;
  championship: Record<string, unknown>;
  premiership: Record<string, unknown>;
  kitten: Record<string, unknown>;
  household: Record<string, unknown>;
}

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
 * Handles saving the current show state to a CSV file
 * @param getShowState Function to get the current show state
 * @param showSuccess Success callback function
 * @param showError Error callback function
 */
export function handleSaveToCSV(
  getShowState: GetShowStateFunction,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  csvExportSave(getShowState, showSuccess, showError);
}

/**
 * Handles restoring show state from a CSV file
 * @param data The data to restore from
 * @param showSuccess Success callback function
 * @param showError Error callback function
 */
export function handleRestoreFromCSV(
  data: Record<string, unknown>,
  showSuccess: SuccessCallback,
  showError: ErrorCallback
) {
  csvExportRestore(data, showSuccess, showError);
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