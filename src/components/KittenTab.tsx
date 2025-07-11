import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import { validateKittenTab } from '../validation/kittenValidation';
import type { KittenValidationInput } from '../validation/kittenValidation';
import { handleSaveToCSV } from '../utils/formActions';
import CustomSelect from './CustomSelect';

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
  isActive: boolean;
  kittenTabData: KittenTabData;
  setKittenTabData: React.Dispatch<React.SetStateAction<KittenTabData>>;
  onTabReset: () => void;
  getShowState: () => Record<string, unknown>;
  /**
   * Handler for CSV import functionality
   */
  onCSVImport: () => Promise<void>;
}

type KittenTabData = {
  showAwards: { [key: string]: { catNumber: string; status: string } };
  voidedShowAwards: { [key: string]: boolean };
  errors: { [key: string]: string };
  focusedColumnIndex: number | null;
  isResetModalOpen: boolean;
  isCSVErrorModalOpen: boolean; // NEW: Modal for CSV error
};

/**
 * Voiding logic: If a cat number is voided anywhere in a column, all instances of that cat number in that column are voided (including new ones). Unchecking void in any cell unvoids all. This logic applies across the full column, matching Championship and Premiership tabs.
 */
export default function KittenTab({
  judges,
  kittenCounts,
  showSuccess,
  showError,
  isActive,
  kittenTabData,
  setKittenTabData,
  onTabReset,
  getShowState,
  onCSVImport
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
    setKittenTabData((prev: KittenTabData) => ({
      ...prev,
      focusedColumnIndex: index
    }));
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Error state - LIFTED TO APP STATE ---
  const errors = kittenTabData.errors || {};
  const setErrors = (newErrors: { [key: string]: string }) => {
    setKittenTabData((prev: KittenTabData) => ({
      ...prev,
      errors: newErrors
    }));
  };

  // --- Modal state - LIFTED TO APP STATE ---
  const isResetModalOpen = kittenTabData.isResetModalOpen || false;
  const isCSVErrorModalOpen = kittenTabData.isCSVErrorModalOpen || false;

  // --- Cat input refs for keyboard navigation ---
  const totalCatRows = Math.max(...columns.map(col => getAwardCount(col.specialty)));
  const catInputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  React.useEffect(() => {
    catInputRefs.current = Array.from({ length: columns.length }, () => Array(totalCatRows).fill(null));
  }, [columns.length, totalCatRows]);

  // --- Helper: Check if a cat number is voided anywhere in the column (all sections) ---
  const isCatNumberVoidedInColumn = (colIdx: number, catNumber: string): boolean => {
    if (!catNumber || !catNumber.trim()) return false;
    return Object.keys(kittenTabData.voidedShowAwards).some(k => k.startsWith(`${colIdx}-`) && kittenTabData.showAwards[k]?.catNumber === catNumber && kittenTabData.voidedShowAwards[k]);
  };

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
    
    // --- Auto-void logic: if this cat number is already voided elsewhere in the column, void this cell too ---
    let shouldBeVoided = false;
    if (field === 'catNumber' && value && value.trim() !== '') {
      shouldBeVoided = isCatNumberVoidedInColumn(colIdx, value);
    }
    
    setKittenTabData((prev: KittenTabData) => {
      if (field === 'catNumber') {
        const prevCell = prev.showAwards?.[`${colIdx}-${pos}`] || {};
        const newCell = {
          ...prevCell,
          catNumber: value,
          status: 'KIT',
        };
        return {
          ...prev,
          showAwards: {
            ...prev.showAwards,
            [`${colIdx}-${pos}`]: newCell
          }
        };
      }
      return {
        ...prev,
        showAwards: {
          ...prev.showAwards,
          [`${colIdx}-${pos}`]: {
            ...prev.showAwards?.[`${colIdx}-${pos}`],
            [field]: value
          }
        }
      };
    });
    
    // Set void state after updating the data (outside the callback for proper timing)
    if (field === 'catNumber') {
      setKittenTabDataVoidState(colIdx, pos, shouldBeVoided);
    }
  };

  // --- Voiding logic ---
  function setKittenTabDataVoidState(colIdx: number, pos: number, voided: boolean) {
    const key = `${colIdx}-${pos}`;
    setKittenTabData((prev: KittenTabData) => ({
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
    const validationInput: KittenValidationInput = {
      columns,
      showAwards: kittenTabData.showAwards || {},
      voidedShowAwards: kittenTabData.voidedShowAwards || {},
      kittenCounts
    };
    return validateKittenTab(validationInput);
  };

  // --- Validate on blur ---
  const handleBlur = () => {
    const errors = validate();
    setErrors(errors);
  };

  // --- Table Structure: Sticky headers, frozen position column, columns = judges ---
  const maxFinalRows = Math.max(...columns.map(col => getAwardCount(col.specialty)));

  // Add state for reset modal - LIFTED TO APP STATE
  const setIsResetModalOpen = (open: boolean) => {
    setKittenTabData((prev: KittenTabData) => ({
      ...prev,
      isResetModalOpen: open
    }));
  };

  const setIsCSVErrorModalOpen = (open: boolean) => {
    setKittenTabData((prev: KittenTabData) => ({
      ...prev,
      isCSVErrorModalOpen: open
    }));
  };

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

  const handleSaveToCSVClick = () => {
    // Check for validation errors before CSV export
    if (Object.keys(kittenTabData.errors).length > 0) {
      setIsCSVErrorModalOpen(true);
      return;
    }
    // Export the full show state for CSV export
    handleSaveToCSV(getShowState, showSuccess, showError);
  };

  const handleRestoreFromCSVClick = () => {
    onCSVImport();
  };

  const handleResetClick = () => {
    setIsResetModalOpen(true);
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

      {/* Kittens Finals - Premium Design */}
      <div className="group relative">
        {/* Sticky header and dropdown */}
        <div className="sticky top-0 z-30 bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4">
          {/* Left: Icon, Title, Arrow */}
          <div className="flex items-center min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl shadow flex-shrink-0">
              {/* Minimal Cat Face Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 9.5L3 5l4.5 2M19.5 9.5L21 5l-4.5 2M12 17c-4 0-7-2.5-7-6.5C5 7 8 5 12 5s7 2 7 5.5c0 4-3 6.5-7 6.5zm-2 0c0 1.5 2 2 2 2s2-.5 2-2" />
                <circle cx="9" cy="10" r="1" fill="white"/>
                <circle cx="15" cy="10" r="1" fill="white"/>
              </svg>
            </span>
            <span className="text-xl font-bold text-green-700 ml-3">Kittens Finals</span>
            <button
              onClick={() => {
                if (tableContainerRef.current) {
                  tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="ml-3 w-7 h-7 flex items-center justify-center rounded-lg border border-green-400 bg-white shadow-sm transition-all duration-200 hover:border-green-500 hover:bg-green-50/70 hover:shadow-green-200/60 focus:outline-none focus:ring-2 focus:ring-green-300 group"
              aria-label="Scroll to Top"
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-200 rotate-180 group-hover:stroke-green-500"
                viewBox="0 0 24 24"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
          {/* Right: Minimal Dropdown, inline kitten icon in selected value only */}
          <select
            className="min-w-[200px] max-w-[240px] w-[220px] font-semibold text-base border border-green-200 rounded px-4 py-2 bg-white focus:ring-2 focus:ring-green-200 focus:outline-none transition-all duration-200 hover:border-green-300"
            onChange={handleRingJump}
            defaultValue=""
          >
            <option value="" disabled>🐱 Jump to Ring...</option>
            {columns.map((col, idx) => (
              <option key={idx} value={col.judge.id}>
                Ring {col.judge.id} - {col.judge.acronym}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          {/* Table scroll container with floating scroll buttons outside to the right */}
          <div
            className="outer-table-scroll-container overflow-x-auto rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-xl border border-green-200 bg-white shadow-lg"
            ref={tableContainerRef}
          >
            <table className="border-collapse w-auto table-fixed divide-y divide-gray-200 rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-xl bg-white">
              <thead>
                {/* Header Row 1: Ring Numbers */}
                <tr className="bg-white border-b border-green-200">
                  <th className="text-left pl-6 font-bold text-green-700 border-r border-green-200 frozen-column" style={{ width: '140px', minWidth: '140px' }}></th>
                  {columns.map((column, index) => (
                    <th
                      id={`ring-th-${index}`}
                      key={`ring-${index}`}
                      className={`text-center py-3 px-2 font-bold text-green-700 border-r border-green-200${focusedColumnIndex === index ? ' bg-green-50 border-l-4 border-r-4 border-green-300 z-10' : ''} whitespace-nowrap`}
                      style={{ width: 190, minWidth: 190, maxWidth: 190 }}
                    >
                      Ring {column.judge.id}
                    </th>
                  ))}
                </tr>
                {/* Header Row 2: Judge Acronyms */}
                <tr className="bg-white border-b border-green-200">
                  <th className="text-left py-2 pl-6 font-semibold text-green-700 border-r border-green-200 frozen-column" style={{ width: '140px', minWidth: '140px' }}></th>
                  {columns.map((column, index) => (
                    <th
                      key={`acronym-${index}`}
                      className={`text-center py-2 px-2 font-semibold text-green-700 border-r border-green-200${focusedColumnIndex === index ? ' bg-green-50 border-l-4 border-r-4 border-green-300 z-10' : ''}`}
                      style={{ width: 120, minWidth: 120 }}
                    >
                      {column.judge.acronym}
                    </th>
                  ))}
                </tr>
                {/* Header Row 3: Ring Types */}
                <tr className="bg-white border-b border-green-200">
                  <th className="text-left py-2 pl-6 font-semibold text-green-700 border-r border-green-200 frozen-column" style={{ width: '140px', minWidth: '140px' }}>Position</th>
                  {columns.map((column, index) => (
                    <th
                      key={`type-${index}`}
                      className={`text-center py-2 px-2 font-semibold text-green-700 border-r border-green-200${focusedColumnIndex === index ? ' bg-green-50 border-l-4 border-r-4 border-green-300 z-10' : ''}`}
                      style={{ width: 120, minWidth: 120 }}
                    >
                      {column.specialty}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Kittens Final Section (Top 10/15) */}
                {Array.from({ length: maxFinalRows }, (_, i) => (
                  <tr key={`kitten-final-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-green-50'} hover:bg-green-100/40 hover:shadow-sm`}>
                    <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                      {i + 1}{i >= 10 ? <span className="text-green-400 font-bold">*</span> : ''}
                    </td>
                    {columns.map((col, colIdx) => {
                      const cell = getShowAward(colIdx, i) || { catNumber: '', status: 'KIT' };
                      const voided = getVoidState(colIdx, i);
                      const maxRowsForThisColumn = getAwardCount(col.specialty);
                      const errorKey = `${colIdx}-${i}`;
                      
                      // Only show input if this row is within the breakpoint for this column
                      if (i < maxRowsForThisColumn) {
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150 ${focusedColumnIndex === colIdx ? ' bg-green-50 border-l-4 border-r-4 border-green-300 z-10' : ''} hover:bg-green-100/30 whitespace-nowrap overflow-x-visible`}
                            style={{
                              width: (cell.catNumber && cell.catNumber.trim()) ? 130 : 110,
                              minWidth: (cell.catNumber && cell.catNumber.trim()) ? 130 : 110,
                              maxWidth: (cell.catNumber && cell.catNumber.trim()) ? 130 : 110,
                              transition: 'width 0.2s'
                            }}
                          > 
                            <div className="flex flex-col items-start">
                              <div className="flex gap-2 items-center">
                                {/* Cat # input: rounded-md, semi-transparent, focus ring, shadow */}
                                <input
                                  type="text"
                                  className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-green-200 shadow focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${voided ? 'opacity-50 grayscale pointer-events-none line-through' : ''} ${getBorderStyle(errorKey)}`}
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
                                {/* Status select: green theme */}
                                <CustomSelect
                                  options={['KIT']}
                                  value="KIT"
                                  onChange={() => {}}
                                  className="min-w-[70px] pointer-events-none opacity-80"
                                  ariaLabel="Status"
                                />
                                {/* Void toggle: minimal, crisp, circular, green border, green gradient on check */}
                                {cell.catNumber && (
                                  <div className="relative group/void">
                                    <input
                                      type="checkbox"
                                      className="sr-only peer"
                                      checked={voided}
                                      onChange={e => {
                                        const newVoided = e.target.checked;
                                        const catNumber = cell.catNumber;
                                        if (catNumber) {
                                          for (let pos = 0; pos < maxFinalRows; pos++) {
                                            const otherCell = getShowAward(colIdx, pos);
                                            if (otherCell.catNumber === catNumber) {
                                              setKittenTabDataVoidState(colIdx, pos, newVoided);
                                            }
                                          }
                                        }
                                      }}
                                      onFocus={() => setFocusedColumnIndex(colIdx)}
                                      tabIndex={-1}
                                      id={`void-toggle-${colIdx}-${i}`}
                                    />
                                    <label htmlFor={`void-toggle-${colIdx}-${i}`} className="w-5 h-5 flex items-center justify-center rounded-full border border-red-500 bg-white shadow-sm transition-all duration-200 cursor-pointer peer-checked:bg-white peer-checked:border-red-500 peer-checked:ring-2 peer-checked:ring-red-200 hover:ring-2 hover:ring-red-200 focus:ring-2 focus:ring-red-200">
                                      {voided && (
                                        <svg className="w-3 h-3 text-red-500 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      )}
                                    </label>
                                    {/* Modern premium tooltip for void */}
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 z-20 hidden group-hover/void:flex flex-row items-center">
                                      {/* Arrow */}
                                      <span className="w-0 h-0 mr-1 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-teal-300"></span>
                                      {/* Tooltip Box */}
                                      <span className="bg-white border border-teal-300 shadow-lg rounded-lg px-3 py-2 flex items-start gap-2 transition-all duration-200">
                                        <svg className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span className="text-sm font-medium text-teal-800 leading-snug">Mark this placement void.</span>
                                      </span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              {/* Error message */}
                              {errors[errorKey] && (
                                <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[errorKey])}</div>
                              )}
                            </div>
                          </td>
                        );
                      } else {
                        // Show empty cell for rows beyond this column's breakpoint
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150 ${focusedColumnIndex === colIdx ? ' bg-green-50 border-l-4 border-r-4 border-green-300 z-10' : ''} hover:bg-green-100/30`}>
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

        {/* Premium Action Buttons */}
        <ActionButtons
          onSaveToCSV={handleSaveToCSVClick}
          onLoadFromCSV={handleRestoreFromCSVClick}
          onReset={handleResetClick}
          resetButtonText="Reset Tab"
        />
      </div>

      {/* CSV Error Modal */}
      <Modal
        isOpen={isCSVErrorModalOpen}
        onClose={() => setIsCSVErrorModalOpen(false)}
        title="CSV Export Error"
        message="CSV cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving."
        type="alert"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setIsCSVErrorModalOpen(false)}
      />
    </div>
  );
} 