import React, { useMemo, useRef } from 'react';
import * as kittenValidation from '../validation/kittenValidation';
import { handleSaveToTempCSV, handleGenerateFinalCSV, handleRestoreFromCSV } from '../utils/formActions';
import Modal from './Modal';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface Column {
  judge: Judge;
  specialty: string;
  columnIndex: number;
}

interface KittenTabProps {
  judges: Judge[];
  kittenCounts: {
    lhKittens: number;
    shKittens: number;
    total: number;
  };
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo?: (title: string, message?: string, duration?: number) => void;
  onResetAllData?: () => void;
  isActive: boolean;
  kittenTabData: any;
  setKittenTabData: React.Dispatch<React.SetStateAction<any>>;
  onTabReset: () => void;
  getShowState: () => any;
}

export default function KittenTab({
  judges,
  kittenCounts,
  showSuccess,
  showError,
  showInfo: _showInfo,
  onResetAllData,
  isActive,
  kittenTabData,
  setKittenTabData,
  onTabReset,
  getShowState
}: KittenTabProps) {
  // --- Helper: Generate columns (one per judge, handle Double Specialty) ---
  const generateColumns = (): Column[] => {
    const cols: Column[] = [];
    judges.forEach((judge: Judge) => {
      if (judge.ringType === 'Double Specialty') {
        cols.push({ judge: { ...judge }, specialty: 'Longhair', columnIndex: cols.length });
        cols.push({ judge: { ...judge }, specialty: 'Shorthair', columnIndex: cols.length });
      } else {
        cols.push({ judge, specialty: judge.ringType, columnIndex: cols.length });
      }
    });
    return cols;
  };

  const columns: Column[] = useMemo(() => generateColumns(), [judges]);

  // --- Hair-specific breakpoint logic: 75 kittens per hair type ---
  const getAwardCount = (ringType: string) => {
    if (ringType === 'Allbreed') {
      return kittenCounts.total >= 75 ? 15 : 10;
    } else if (ringType === 'Longhair') {
      return kittenCounts.lhKittens >= 75 ? 15 : 10;
    } else if (ringType === 'Shorthair') {
      return kittenCounts.shKittens >= 75 ? 15 : 10;
    }
    return 10; // Default fallback
  };

  // --- State for focused column (for ring glow effect) - LIFTED TO APP STATE ---
  const focusedColumnIndex = kittenTabData.focusedColumnIndex;
  const setFocusedColumnIndex = (index: number | null) => {
    setKittenTabData((prev: any) => ({
      ...prev,
      focusedColumnIndex: index
    }));
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Error state - LIFTED TO APP STATE ---
  const errors = kittenTabData.errors || {};
  const setErrors = (newErrors: { [key: string]: string }) => {
    setKittenTabData((prev: any) => ({
      ...prev,
      errors: newErrors
    }));
  };

  // --- Cat input refs for keyboard navigation ---
  const totalCatRows = Math.max(...columns.map(col => getAwardCount(col.specialty)));
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

  // --- Update kitten placement (cat number) ---
  const updateShowAward = (colIdx: number, pos: number, field: 'catNumber' | 'status', value: string) => {
    const key = `${colIdx}-${pos}`;
    setKittenTabData((prev: any) => {
      if (field === 'catNumber') {
        const prevCell = prev.showAwards?.[key] || {};
        const newCell = {
          ...prevCell,
          catNumber: value,
          status: 'KIT',
        };
        // Voiding logic: if this cat number is voided elsewhere in the column, void this cell too
        if (value && value.trim() !== '') {
          const isVoided = Object.keys(prev.voidedShowAwards || {}).some(k => k.startsWith(`${colIdx}-`) && prev.showAwards?.[k]?.catNumber === value && prev.voidedShowAwards?.[k]);
          setKittenTabDataVoidState(colIdx, pos, isVoided);
        } else {
          setKittenTabDataVoidState(colIdx, pos, false);
        }
        return {
          ...prev,
          showAwards: {
            ...prev.showAwards,
            [key]: newCell
          }
        };
      }
      return {
        ...prev,
        showAwards: {
          ...prev.showAwards,
          [key]: {
            ...prev.showAwards?.[key],
            [field]: value
          }
        }
      };
    });
  };

  // --- Voiding logic ---
  function setKittenTabDataVoidState(colIdx: number, pos: number, voided: boolean) {
    const key = `${colIdx}-${pos}`;
    setKittenTabData((prev: any) => ({
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
    return kittenTabData.showAwards?.[key] || { catNumber: '', status: 'KIT' };
  };
  const getVoidState = (colIdx: number, pos: number) => {
    const key = `${colIdx}-${pos}`;
    return kittenTabData.voidedShowAwards?.[key] || false;
  };

  // --- Validation ---
  const validate = () => {
    const validationInput: kittenValidation.KittenValidationInput = {
      columns,
      showAwards: kittenTabData.showAwards || {},
      voidedShowAwards: kittenTabData.voidedShowAwards || {},
      kittenCounts
    };
    setErrors(kittenValidation.validateKittenTab(validationInput));
  };

  // --- Validate on blur ---
  const handleBlur = () => {
    validate();
  };

  // --- Table Structure: Sticky headers, frozen position column, columns = judges ---
  const maxFinalRows = Math.max(...columns.map(col => getAwardCount(col.specialty)));

  // Add state for reset modal - LIFTED TO APP STATE
  const isResetModalOpen = kittenTabData.isResetModalOpen || false;
  const setIsResetModalOpen = (open: boolean) => {
    setKittenTabData((prev: any) => ({
      ...prev,
      isResetModalOpen: open
    }));
  };

  // Helper function to get appropriate border styling for errors (always red)
  const getBorderStyle = (errorKey: string, _message: string) => {
    if (errors[errorKey]) {
      return 'border-red-500'; // Always red border for errors
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
  const getErrorStyle = (_message: string) => {
    return { color: '#ef4444' }; // Always red for errors
  };

  // Add hasFocusedOnActivation ref for autofocus logic (match PremiershipTab)
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
    const colIdx = columns.findIndex(col => col.judge.id === ringId);
    if (colIdx === -1) return;
    setFocusedColumnIndex(colIdx);
    const th = document.getElementById(`ring-th-${colIdx}`);
    const container = tableContainerRef.current;
    if (th && container) {
      const frozenWidth = 140;
      const scrollLeft = th.offsetLeft - frozenWidth;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Kittens Tab"
        message="Are you sure you want to reset the Kittens tab data? This action cannot be undone and will clear all kittens finals information, but will keep your show details and judge information intact."
        type="warning"
        confirmText="Reset Kittens Tab"
        cancelText="Cancel"
        onConfirm={() => {
          setIsResetModalOpen(false);
          onTabReset();
          showSuccess('Kittens Tab Reset', 'Kittens tab data has been reset successfully.');
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />
      <div className="cfa-section">
        <h2 className="cfa-section-header flex items-center justify-between">
          Kittens Finals
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
                      {column.specialty}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                                {/* Kittens Final Section (Top 10/15) */}
                {Array.from({ length: maxFinalRows }, (_, i) => (
                  <tr key={`kitten-final-${i}`} className="cfa-table-row">
                    <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '80px', minWidth: '80px' }}>
                      {i + 1}{i >= 10 ? '*' : ''}
                    </td>
                    {columns.map((col, colIdx) => {
                      const key = `${colIdx}-${i}`;
                      const cell = getShowAward(colIdx, i) || { catNumber: '', status: 'KIT' };
                      const voided = getVoidState(colIdx, i);
                      const error = errors[`${colIdx}-${i}`];
                      const maxRowsForThisColumn = getAwardCount(col.specialty);
                      
                      // Only show input if this row is within the breakpoint for this column
                      if (i < maxRowsForThisColumn) {
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${focusedColumnIndex === colIdx ? ' ring-glow' : ''}`}> 
                            <div className="flex flex-col items-start">
                              <div className="flex gap-1 items-center">
                                <input
                                  type="text"
                                  className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${getBorderStyle(`${colIdx}-${i}`, errors[`${colIdx}-${i}`] || '')} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                  placeholder="Cat #"
                                  value={cell.catNumber ?? ''}
                                  onChange={e => updateShowAward(colIdx, i, 'catNumber', e.target.value)}
                                  onFocus={e => handleCatInputFocus(e, colIdx)}
                                  onKeyDown={e => handleCatInputKeyDown(e, colIdx, i)}
                                  onBlur={handleBlur}
                                  disabled={voided}
                                  ref={el => {
                                    if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                    catInputRefs.current[colIdx][i] = el;
                                    if (colIdx === 0 && i === 0) {
                                      // Focus immediately when the ref is set (if tab is active and we haven't focused yet)
                                      if (el && isActive && !hasFocusedOnActivation.current) {
                                        setTimeout(() => {
                                          el.focus();
                                          setFocusedColumnIndex(0);
                                          hasFocusedOnActivation.current = true; // Mark as focused
                                        }, 0);
                                      }
                                    }
                                  }}
                                />
                                <select
                                  className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${getBorderStyle(`${colIdx}-${i}`, errors[`${colIdx}-${i}`] || '')} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                  value="KIT"
                                  disabled
                                >
                                  <option value="KIT">KIT</option>
                                </select>
                                {cell.catNumber && (
                                  <input
                                    type="checkbox"
                                    className="void-checkbox"
                                    checked={voided}
                                    onChange={e => setKittenTabDataVoidState(colIdx, i, e.target.checked)}
                                    disabled={!cell.catNumber}
                                  />
                                )}
                              </div>
                              {errors[`${colIdx}-${i}`] && (
                                <div className="text-xs mt-1" style={getErrorStyle(errors[`${colIdx}-${i}`])}>{getCleanMessage(errors[`${colIdx}-${i}`])}</div>
                              )}
                            </div>
                          </td>
                        );
                      } else {
                        // Show empty cell for rows beyond this column's breakpoint
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${focusedColumnIndex === colIdx ? ' ring-glow' : ''}`}>
                            &nbsp;
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Action buttons (Save, Generate, Restore, Reset) - match PremiershipTab */}
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                // Export the full show state for CSV export
                handleSaveToTempCSV(getShowState, showSuccess, showError);
              }}
              className="cfa-button"
            >
              Save to Temp CSV
            </button>
            <button
              type="button"
              onClick={() => {
                // Export the full show state for CSV export
                handleGenerateFinalCSV(getShowState, showSuccess, showError);
              }}
              className="cfa-button"
            >
              Generate Final CSV
            </button>
            <button
              type="button"
              onClick={() => handleRestoreFromCSV({}, showSuccess, showError)}
              className="cfa-button-secondary"
            >
              Restore from CSV
            </button>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="cfa-button-secondary"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 