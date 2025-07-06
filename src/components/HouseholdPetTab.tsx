import React, { useMemo, useRef, useState } from 'react';
import * as householdPetValidation from '../validation/householdPetValidation';
import { handleSaveToCSV } from '../utils/formActions';
import Modal from './Modal';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface Column {
  judge: Judge;
  columnIndex: number;
}

interface HouseholdPetTabProps {
  judges: Judge[];
  householdPetCount: number;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  isActive: boolean;
  getShowState: () => Record<string, unknown>; // Accept full show state object
  /**
   * Household Pet tab data, lifted to App.tsx for persistence and CSV export
   */
  householdPetTabData: { showAwards: { [key: string]: { catNumber: string; status: string } }; voidedShowAwards: { [key: string]: boolean } };
  /**
   * Setter for household pet tab data
   */
  setHouseholdPetTabData: React.Dispatch<React.SetStateAction<{ showAwards: { [key: string]: { catNumber: string; status: string } }; voidedShowAwards: { [key: string]: boolean } }>>;
  /**
   * Callback to reset the tab data (called from App.tsx)
   */
  onTabReset: () => void;
  /**
   * Handler for CSV import functionality
   */
  onCSVImport: () => Promise<void>;
}

/**
 * Voiding logic: If a cat number is voided anywhere in a column, all instances of that cat number in that column are voided (including new ones). Unchecking void in any cell unvoids all. This logic applies across the full column, matching Championship, Premiership, and Kitten tabs.
 */
export default function HouseholdPetTab({
  judges,
  householdPetCount,
  showSuccess,
  showError,
  isActive,
  getShowState,
  householdPetTabData,
  setHouseholdPetTabData,
  onTabReset,
  onCSVImport
}: HouseholdPetTabProps) {
  // --- Generate columns (one per judge, regardless of ring type) ---
  const generateColumns = (): Column[] => {
    return judges.map((judge: Judge, idx: number) => ({ judge, columnIndex: idx }));
  };
  const columns: Column[] = useMemo(() => generateColumns(), [judges]);

  // --- Breakpoint logic: 50 household pets ---
  const getAwardCount = () => (householdPetCount >= 50 ? 15 : 10);
  const totalCatRows = getAwardCount();

  // --- State for focused column (for ring glow effect) ---
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Error state ---
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // --- Data state ---
  // const [tabData, setTabData] = useState<{ showAwards: any; voidedShowAwards: any }>({ showAwards: {}, voidedShowAwards: {} });

  // --- Cat input refs for keyboard navigation ---
  const catInputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  React.useEffect(() => {
    catInputRefs.current = Array.from({ length: columns.length }, () => Array(totalCatRows).fill(null));
  }, [columns.length, totalCatRows]);

  // --- Handlers for focus and keyboard navigation ---
  const handleCatInputFocus = (e: React.FocusEvent<HTMLInputElement>, columnIndex: number) => {
    e.target.select();
    setFocusedColumnIndex(columnIndex);
  };

  const handleCatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, colIdx: number, rowIdx: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const lastRow = totalCatRows - 1;
      let nextCol = colIdx;
      let nextRow = rowIdx;
      let found = false;
      const isEnabled = (col: number, row: number) => {
        const ref = catInputRefs.current[col]?.[row];
        return ref && !ref.disabled;
      };
      if (!e.shiftKey) {
        let tries = 0;
        do {
          if (nextRow < lastRow) {
            nextRow++;
          } else {
            nextRow = 0;
            nextCol++;
            if (nextCol >= columns.length) return;
          }
          tries++;
          if (isEnabled(nextCol, nextRow)) {
            found = true;
            break;
          }
        } while (tries < columns.length * totalCatRows);
      } else {
        let tries = 0;
        do {
          if (nextRow > 0) {
            nextRow--;
          } else {
            nextCol--;
            if (nextCol < 0) return;
            nextRow = lastRow;
          }
          tries++;
          if (isEnabled(nextCol, nextRow)) {
            found = true;
            break;
          }
        } while (tries < columns.length * totalCatRows);
      }
      if (found) {
        const nextRef = catInputRefs.current[nextCol]?.[nextRow];
        if (nextRef) {
          nextRef.focus();
          setFocusedColumnIndex(nextCol);
        }
      }
    }
  };

  // --- Update placement (cat number) ---
  const updateShowAward = (colIdx: number, pos: number, value: string) => {
    const key = `${colIdx}-${pos}`;
    
    // --- Auto-void logic: if this cat number is already voided elsewhere in the column, void this cell too ---
    let shouldBeVoided = false;
    if (value && value.trim() !== '') {
      shouldBeVoided = isCatNumberVoidedInColumn(colIdx, value);
    }
    
    setHouseholdPetTabData(prev => {
      const prevCell = prev.showAwards?.[key] || {};
      const newCell = {
        ...prevCell,
        catNumber: value,
        status: 'HHP',
      };
      return {
        ...prev,
        showAwards: {
          ...prev.showAwards,
          [key]: newCell
        }
      };
    });
    
    // Set void state after updating the data (outside the callback for proper timing)
    setTabDataVoidState(colIdx, pos, shouldBeVoided);
  };

  // --- Voiding logic ---
  function setTabDataVoidState(colIdx: number, pos: number, voided: boolean) {
    const key = `${colIdx}-${pos}`;
    setHouseholdPetTabData(prev => ({
      ...prev,
      voidedShowAwards: {
        ...prev.voidedShowAwards,
        [key]: voided
      }
    }));
  }

  // --- Getters ---
  const getShowAward = (colIdx: number, pos: number) => {
    const key = `${colIdx}-${pos}`;
    return householdPetTabData.showAwards?.[key] || { catNumber: '', status: 'HHP' };
  };
  const getVoidState = (colIdx: number, pos: number) => {
    const key = `${colIdx}-${pos}`;
    return householdPetTabData.voidedShowAwards?.[key] || false;
  };

  // --- Validation ---
  const validate = () => {
    const validationInput: householdPetValidation.HouseholdPetValidationInput = {
      columns,
      showAwards: householdPetTabData.showAwards || {},
      voidedShowAwards: householdPetTabData.voidedShowAwards || {},
      householdPetCount
    };
    setErrors(householdPetValidation.validateHouseholdPetTab(validationInput));
  };

  // --- Auto-validate when data changes (matches Championship tab behavior) ---
  React.useEffect(() => {
    validate();
  }, [columns, householdPetTabData.showAwards, householdPetTabData.voidedShowAwards, householdPetCount]);

  // --- Validate on blur ---
  const handleBlur = () => {
    validate();
  };

  // Add state for reset modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Add state for CSV error modal
  const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false);

  // Helper function to get appropriate border styling for errors (always red)
  const getBorderStyle = (errorKey: string) => {
    if (errors[errorKey]) {
      return 'cfa-input-error'; // Use CFA input error styling with red background fill
    }
    return 'border-gray-300';
  };

  // Helper function to get the clean message (remove [REMINDER] or [WARNING] prefix)
  const getCleanMessage = (message: string): string => {
    // Remove [REMINDER] and [WARNING] prefixes for display, but always treat as error
    if (message.startsWith('[REMINDER] ')) return message.replace('[REMINDER] ', '');
    if (message.startsWith('[WARNING] ')) return message.replace('[WARNING] ', '');
    return message;
  };

  // Helper function to get appropriate styling for errors (always red)
  const getErrorStyle = () => {
    return { color: '#ef4444' }; // Always red for errors
  };

  // Add hasFocusedOnActivation ref for autofocus logic
  const hasFocusedOnActivation = useRef(false);
  React.useEffect(() => {
    if (!isActive) {
      hasFocusedOnActivation.current = false;
    }
  }, [isActive]);

  // Add Jump to Ring handler
  const handleRingJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRingId = e.target.value;
    if (!selectedRingId) {
      setFocusedColumnIndex(null);
      return;
    }
    
    const ringId = parseInt(selectedRingId, 10);
    
    // Find the first column index with this ring id
    const colIdx = columns.findIndex(col => col.judge.id === ringId);
    if (colIdx === -1) return;
    
    // Set the focused column to this column index
    setFocusedColumnIndex(colIdx);
    
    // Find the corresponding <th> element in the table
    const th = document.getElementById(`ring-th-${colIdx}`);
    const container = tableContainerRef.current;
    if (th && container) {
      // The width of the frozen column (Position) is 140px
      const frozenWidth = 140;
      // Scroll so that the left of the <th> aligns with the left of the scroll area (after frozen column)
      const scrollLeft = th.offsetLeft - frozenWidth;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  // --- Reset handler ---
  // Remove 'const handleTabReset = () => {' at line 274
  // Remove 'col' in columns.map at 376
  // Remove 'const key = ...' at 377
  // Remove 'const error = ...' at 380
  // Remove 'e' in onChange at 422

  // --- Helper: Check if a cat number is voided anywhere in the column (all sections) ---
  const isCatNumberVoidedInColumn = (colIdx: number, catNumber: string): boolean => {
    if (!catNumber || !catNumber.trim()) return false;
    return Object.keys(householdPetTabData.voidedShowAwards).some(k => k.startsWith(`${colIdx}-`) && householdPetTabData.showAwards[k]?.catNumber === catNumber && householdPetTabData.voidedShowAwards[k]);
  };

  const handleSaveToCSVClick = () => {
    // Export the full show state for CSV export
    handleSaveToCSV(getShowState, showSuccess, showError);
  };

  const handleRestoreFromCSVClick = () => {
    onCSVImport();
  };

  const handleResetClick = () => {
    onTabReset();
  };

  return (
    <div className="p-8 space-y-8">
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Household Pet Tab"
        message="Are you sure you want to reset the Household Pet tab data? This action cannot be undone and will clear all household pet finals information, but will keep your show details and judge information intact."
        type="warning"
        confirmText="Reset Household Pet Tab"
        cancelText="Cancel"
        onConfirm={() => {
          setIsResetModalOpen(false);
          onTabReset();
          showSuccess('Household Pet Tab Reset', 'Household Pet tab data has been reset successfully.');
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* CSV Error Modal */}
      <Modal
        isOpen={isCSVErrorModalOpen}
        onClose={() => setIsCSVErrorModalOpen(false)}
        title="Validation Errors"
        message="CSV cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving."
        type="alert"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setIsCSVErrorModalOpen(false)}
      />
      <div className="cfa-section">
        <h2 className="cfa-section-header flex items-center justify-between">
          Household Pet Finals
          {/* Jump to Ring Dropdown */}
          <div className="flex-1 flex justify-end items-center">
            <select
              className="ml-4 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium shadow-sm focus:outline-none focus:border-cfa-gold focus:ring-2 focus:ring-cfa-gold/30 transition-all duration-200 ring-jump-dropdown"
              style={{ minWidth: 180, maxWidth: 260 }}
              onChange={handleRingJump}
              defaultValue=""
            >
              <option value="" disabled>Jump to Ring...</option>
              {columns.map((col, idx) => (
                <option key={idx} value={col.judge.id}>
                  Ring {col.judge.id} - {col.judge.acronym}
                </option>
              ))}
            </select>
          </div>
        </h2>
        <div className="cfa-table overflow-x-auto">
          <div className="table-container" ref={tableContainerRef}>
            <table className="border-collapse" style={{ width: 'auto', tableLayout: 'fixed' }}>
              <thead>
                {/* Header Row 1: Ring Numbers */}
                <tr className="cfa-table-header sticky-header sticky-header-1">
                  <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '80px', minWidth: '80px' }}></th>
                  {columns.map((column, index) => (
                    <th
                      id={`ring-th-${index}`}
                      key={`ring-${index}`}
                      className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300${focusedColumnIndex === index ? ' ring-glow' : ''}`}
                      style={{ width: '120px', minWidth: '120px' }}
                    >
                      Ring {column.judge.id}
                    </th>
                  ))}
                </tr>
                {/* Header Row 2: Judge Acronyms */}
                <tr className="cfa-table-header sticky-header sticky-header-2">
                  <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '80px', minWidth: '80px' }}></th>
                  {columns.map((column, index) => (
                    <th
                      key={`acronym-${index}`}
                      className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300${focusedColumnIndex === index ? ' ring-glow' : ''}`}
                      style={{ width: '120px', minWidth: '120px' }}
                    >
                      {column.judge.acronym}
                    </th>
                  ))}
                </tr>
                {/* Header Row 3: Ring Types */}
                <tr className="cfa-table-header sticky-header sticky-header-3">
                  <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '80px', minWidth: '80px' }}>Position</th>
                  {columns.map((column, index) => (
                    <th
                      key={`type-${index}`}
                      className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300${focusedColumnIndex === index ? ' ring-glow' : ''}`}
                      style={{ width: '120px', minWidth: '120px' }}
                    >
                      {column.judge.ringType}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Household Pet Final Section (Top 10/15) */}
                {Array.from({ length: totalCatRows }, (_, i) => (
                  <tr key={`hhp-final-${i}`} className="cfa-table-row">
                    <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '80px', minWidth: '80px' }}>
                      {i + 1}{i >= 10 ? '*' : ''}
                    </td>
                    {columns.map((_, colIdx) => {
                      const cell = getShowAward(colIdx, i) || { catNumber: '', status: 'HHP' };
                      const voided = getVoidState(colIdx, i);
                      return (
                        <td key={`hhp-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${focusedColumnIndex === colIdx ? ' ring-glow' : ''}`}> 
                          <div className="flex flex-col items-start">
                            <div className="flex gap-1 items-center">
                              <input
                                type="text"
                                className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${getBorderStyle(`${colIdx}-${i}`)} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                placeholder="Cat #"
                                value={cell.catNumber ?? ''}
                                onChange={e => updateShowAward(colIdx, i, e.target.value)}
                                onFocus={e => handleCatInputFocus(e, colIdx)}
                                onKeyDown={e => handleCatInputKeyDown(e, colIdx, i)}
                                onBlur={handleBlur}
                                disabled={voided}
                                ref={el => {
                                  if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                  catInputRefs.current[colIdx][i] = el;
                                  if (colIdx === 0 && i === 0) {
                                    if (el && isActive && !hasFocusedOnActivation.current) {
                                      setTimeout(() => {
                                        el.focus();
                                        setFocusedColumnIndex(0);
                                        hasFocusedOnActivation.current = true;
                                      }, 0);
                                    }
                                  }
                                }}
                              />
                              <select
                                className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${getBorderStyle(`${colIdx}-${i}`)} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                value="HHP"
                                disabled
                              >
                                <option value="HHP">HHP</option>
                              </select>
                              {cell.catNumber && (
                                <input
                                  type="checkbox"
                                  className="void-checkbox"
                                  checked={voided}
                                  onChange={() => {
                                    const newVoided = !voided;
                                    const catNumber = cell.catNumber;
                                    
                                    if (catNumber) {
                                      // Iterate through all positions in the same column (colIdx)
                                      for (let pos = 0; pos < totalCatRows; pos++) {
                                        const otherCell = getShowAward(colIdx, pos);
                                        if (otherCell.catNumber === catNumber) {
                                          setTabDataVoidState(colIdx, pos, newVoided);
                                        }
                                      }
                                    }
                                  }}
                                  disabled={!cell.catNumber}
                                />
                              )}
                            </div>
                            {errors[`${colIdx}-${i}`] && (
                              <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[`${colIdx}-${i}`])}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                // Check for validation errors before CSV export
                if (Object.keys(errors).length > 0) {
                  showError('CSV Export Error', 'Cannot export CSV while there are validation errors. Please fix all errors first.');
                  return;
                }
                handleSaveToCSVClick();
              }}
              className="cfa-button"
            >
              Save to CSV
            </button>
            <button
              type="button"
              onClick={handleRestoreFromCSVClick}
              className="cfa-button-secondary"
              style={{ backgroundColor: '#1e3a8a', borderColor: '#1e3a8a', color: 'white' }}
            >
              Load from CSV
            </button>
            <button
              type="button"
              onClick={handleResetClick}
              className="cfa-button-secondary"
            >
              Reset Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 