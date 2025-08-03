import React, { useState, useEffect } from 'react';
import type { AutoSaveEntry } from '../types/autoSave';
import * as XLSX from 'xlsx';
import { parseExcelAndRestoreState } from '../utils/excelImport';

interface AutoSaveFile {
  key: string;
  fileNumber: number;
  timestamp: string;
  filename: string;
  size: string;
}

interface AutoSaveFileListProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (formData: any) => void;
  numberOfSaves?: number; // Maximum number of files to display (from settings)
  getRecentSaveFile?: () => Promise<any>;
  clearRecentSaveFile?: () => Promise<void>;
}

/**
 * AutoSaveFileList Component
 * 
 * Displays a modal with a list of available auto-save files stored in localStorage
 * Allows users to select and restore from any auto-save file
 * Used for testing/debugging the auto-save functionality in browser mode
 */
export function AutoSaveFileList({ 
  isOpen, 
  onClose, 
  onRestore,
  numberOfSaves = 3,
  getRecentSaveFile,
  clearRecentSaveFile
}: AutoSaveFileListProps) {
  const [autoSaveFiles, setAutoSaveFiles] = useState<AutoSaveFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAutoSaveFiles();
    }
  }, [isOpen]);

  const loadAutoSaveFiles = () => {
    setLoading(true);
    const files: AutoSaveFile[] = [];
    
    // Scan localStorage for auto-save entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('Auto Save ')) {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            
            // Calculate file size for display
            const sizeKB = Math.round(parsed.excelData.length * 0.75 / 1024); // Rough base64 to bytes conversion
            
            files.push({
              key: key,
              fileNumber: parsed.fileNumber,
              timestamp: parsed.timestamp,
              filename: parsed.filename || key,
              size: `${sizeKB} KB`
            });
          }
        } catch (error) {
          console.error(`Error reading ${key}:`, error);
        }
      }
    }
    
    // Check for Recent Save file
    const recentSaveKey = 'Recent Save';
    const recentSaveData = localStorage.getItem(recentSaveKey);
    if (recentSaveData) {
      try {
        const parsed = JSON.parse(recentSaveData);
        
        // Calculate file size for display
        const sizeKB = Math.round(parsed.excelData.length * 0.75 / 1024);
        
        files.push({
          key: recentSaveKey,
          fileNumber: parsed.fileNumber,
          timestamp: parsed.timestamp,
          filename: parsed.filename || recentSaveKey,
          size: `${sizeKB} KB`
        });
      } catch (error) {
        console.error(`Error reading ${recentSaveKey}:`, error);
      }
    }
    
    // Sort by timestamp (newest first)
    files.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Limit display to numberOfSaves files to match settings (but always include Recent Save if it exists)
    const recentSaveFile = files.find(file => file.key === 'Recent Save');
    const autoSaveFiles = files.filter(file => file.key.startsWith('Auto Save ')).slice(0, numberOfSaves);
    
    const finalFiles = recentSaveFile ? [recentSaveFile, ...autoSaveFiles] : autoSaveFiles;
    
    setAutoSaveFiles(finalFiles);
    setLoading(false);
  };

  const handleRestore = async (file: AutoSaveFile) => {
    try {
      setLoading(true);
      
      // Get the Excel data from localStorage
      const saved = localStorage.getItem(file.key);
      if (!saved) {
        throw new Error('Auto-save file not found in localStorage');
      }
      
      console.log('Auto-save data retrieved from localStorage:', file.key);
      
      let parsed;
      try {
        parsed = JSON.parse(saved);
      } catch (parseError) {
        throw new Error(`Failed to parse auto-save JSON data: ${parseError}`);
      }
      
      if (!parsed.excelData) {
        throw new Error('No Excel data found in auto-save entry');
      }
      
      console.log('Auto-save entry parsed successfully, Excel data length:', parsed.excelData.length);
      
      // Convert base64 back to Excel buffer
      let excelBuffer;
      try {
        excelBuffer = base64ToBuffer(parsed.excelData);
        console.log('Base64 to buffer conversion successful, buffer size:', excelBuffer.byteLength);
      } catch (conversionError) {
        throw new Error(`Failed to convert base64 to buffer: ${conversionError}`);
      }
      
      // Parse Excel data using existing Excel parsing logic (same as Load from Excel)
      console.log('🔍 DEBUG: About to call parseExcelAndRestoreState');
      console.log('🔍 DEBUG: Excel buffer type:', typeof excelBuffer);
      console.log('🔍 DEBUG: Excel buffer constructor:', excelBuffer.constructor.name);
      console.log('🔍 DEBUG: Excel buffer byteLength:', excelBuffer.byteLength);
      
      let result;
      try {
        result = parseExcelAndRestoreState(
          excelBuffer, 
          (title, message) => {
            console.log(`✅ Excel parsing success: ${title} - ${message}`);
          }, // Success callback
          (title, message) => {
            console.error(`❌ Excel parsing error: ${title} - ${message}`);
            // Don't throw here, let's see what happens
          } // Error callback
        );
        
        console.log('🔍 DEBUG: parseExcelAndRestoreState returned:', result);
        console.log('🔍 DEBUG: Result type:', typeof result);
        console.log('🔍 DEBUG: Result is null?', result === null);
        console.log('🔍 DEBUG: Result is undefined?', result === undefined);
        
        if (result) {
          console.log('🔍 DEBUG: Result has showState?', !!result.showState);
          console.log('🔍 DEBUG: Result has settings?', !!result.settings);
          
          if (result.showState) {
            console.log('🔍 DEBUG: showState.general exists?', !!result.showState.general);
            console.log('🔍 DEBUG: showState.judges exists?', !!result.showState.judges);
            console.log('🔍 DEBUG: showState.judges length:', result.showState.judges?.length || 0);
            
            if (result.showState.general) {
              console.log('🔍 DEBUG: general.showDate:', result.showState.general.showDate);
              console.log('🔍 DEBUG: general.clubName:', result.showState.general.clubName);
              console.log('🔍 DEBUG: general.masterClerk:', result.showState.general.masterClerk);
              console.log('🔍 DEBUG: general.householdPetCount:', result.showState.general.householdPetCount);
            }
            
            console.log('🔍 DEBUG: showState.household structure:', result.showState.household);
          }
        }
        
      } catch (parseError) {
        console.error('🔍 DEBUG: Exception thrown by parseExcelAndRestoreState:', parseError);
        throw new Error(`Excel parsing exception: ${parseError}`);
      }
      
      if (result) {
        console.log('✅ Excel parsing successful, calling onRestore with result');
        onRestore(result);
        onClose();
      } else {
        throw new Error('Excel parsing returned null result - check debug logs above');
      }
      
    } catch (error) {
      console.error('Failed to restore auto-save:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to restore auto-save file: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Restore Auto-Save</h3>
          <button 
            onClick={onClose}
            className="group relative w-6 h-6 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 shadow-sm hover:shadow-md"
            aria-label="Close modal"
          >
            <svg 
              className="w-3 h-3 text-blue-500 group-hover:text-blue-700 transition-all duration-300 group-hover:rotate-90" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
            {/* Premium glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-200/50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
            {/* Subtle border effect */}
            <div className="absolute inset-0 rounded-full border border-blue-200/30 group-hover:border-blue-300/50 transition-all duration-300"></div>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : autoSaveFiles.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No auto-save files found
            </div>
          ) : (
            <div className="space-y-2">
              {autoSaveFiles.map((file) => (
                <div
                  key={file.key}
                  className="border rounded p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => handleRestore(file)}
                >
                  <div className="flex items-center space-x-3">
                    {/* Excel file icon */}
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">XLS</span>
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm">{file.filename}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(file.timestamp)} • {file.size}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(file);
                    }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert base64 to buffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}