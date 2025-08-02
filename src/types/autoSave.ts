/**
 * Auto-Save Type Definitions
 */

export interface AutoSaveEntry {
  excelData: string; // base64 encoded Excel data for browser storage
  timestamp: string;
  fileNumber: number;
  filename: string;
}