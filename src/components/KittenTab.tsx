import React, { useState, useEffect, useMemo, useRef } from 'react';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import * as kittenValidation from '../validation/kittenValidation';
import type { KittenValidationInput } from '../validation/kittenValidation';
import { handleSaveToCSV } from '../utils/formActions';
import CustomSelect from './CustomSelect';
import { formatJumpToMenuOptions, formatJumpToMenuValue, getRoomTypeAbbreviation } from '../utils/jumpToMenuUtils';

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
  errors: { [key: string]: string };
  focusedColumnIndex: number | null;
  isResetModalOpen: boolean;
  isCSVErrorModalOpen: boolean;
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

  // --- Handlers for focus and keyboard navigation ---
  const handleCatInputFocus = (e: React.FocusEvent<HTMLInputElement>, columnIndex: number) => {
    e.target.select(); // Auto-highlight all text when focused
    setFocusedColumnIndex(columnIndex);
  };

  const handleCatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, colIdx: number, rowIdx: number) => {
    // Custom: If value is 'VOID', cursor at end, and Backspace pressed, clear input (PRTab parity)
    if (
      e.key === 'Backspace' &&
      e.currentTarget.value === 'VOID' &&
      e.currentTarget.selectionStart === 4 &&
      e.currentTarget.selectionEnd === 4
    ) {
      updateShowAward(colIdx, rowIdx, 'catNumber', '');
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const lastRow = totalCatRows - 1;
      let nextCol = colIdx;
      let nextRow = rowIdx;
      let found = false;
      const isEnabled = (col: number, row: number) => {
        const ref = catInputRefs.current[col]?.[row];
        // All inputs are now enabled (including VOIDED ones) since they're editable
        return ref !== null && ref !== undefined;
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
  };

  // --- Handle cat number input with VOID auto-complete ---
  const handleCatNumberInput = (colIdx: number, pos: number, value: string) => {
    // Auto-complete VOID when user types 'v' or 'V'
    if (value.toLowerCase() === 'v') {
      updateShowAward(colIdx, pos, 'catNumber', 'VOID');
    } else {
      updateShowAward(colIdx, pos, 'catNumber', value);
    }
  };

  // --- Check if a cell is VOIDED ---
  const isVoided = (colIdx: number, pos: number): boolean => {
    const cell = getShowAward(colIdx, pos);
    return kittenValidation.isVoidInput(cell.catNumber);
  };

  // --- Getters ---
  const getShowAward = (colIdx: number, pos: number) => {
    const key = `${colIdx}-${pos}`;
    return kittenTabData.showAwards?.[key] || { catNumber: '', status: 'KIT' };
  };

  // --- Validation ---
  const validate = () => {
    const validationInput: kittenValidation.KittenValidationInput = {
      columns,
      showAwards: kittenTabData.showAwards || {},
      voidedShowAwards: {}, // Empty object since we no longer use voidedShowAwards
      kittenCounts
    };
    return kittenValidation.validateKittenTab(validationInput);
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
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4 transition-all duration-200 border-b border-violet-200 shadow-sm">
          {/* Left: Icon, Title, Arrow (if present) */}
          <div className="flex items-center min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl shadow flex-shrink-0">
              {/* Cat Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 9.5L3 5l4.5 2M19.5 9.5L21 5l-4.5 2M12 17c-4 0-7-2.5-7-6.5C5 7 8 5 12 5s7 2 7 5.5c0 4-3 6.5-7 6.5zm-2 0c0 1.5 2 2 2 2s2-.5 2-2" />
                <circle cx="9" cy="10" r="1" fill="white"/>
                <circle cx="15" cy="10" r="1" fill="white"/>
              </svg>
            </span>
            <span className="text-xl font-bold text-green-700 ml-3">Kittens Finals</span>
            {/* Optional: Scroll button, if you want parity with ChampionshipTab */}
            {/* <button ...>...</button> */}
          </div>
          {/* Right: Minimal Dropdown, inline cat icon in selected value only */}
          <CustomSelect
            options={formatJumpToMenuOptions(columns)}
            value={formatJumpToMenuValue(columns, focusedColumnIndex)}
            onChange={(selectedValue) => {
              const selectedIndex = columns.findIndex((col) => {
                const ringNumber = col.judge.id.toString().padStart(2, '0');
                const judgeAcronym = col.judge.acronym.padEnd(3, '\u00A0');
                const formattedOption = `Ring ${ringNumber} - ${judgeAcronym} - ${getRoomTypeAbbreviation(col.specialty)}`;
                return formattedOption === selectedValue;
              });
              if (selectedIndex !== -1) {
                setFocusedColumnIndex(selectedIndex);
                const th = document.getElementById(`ring-th-${selectedIndex}`);
                const container = tableContainerRef.current;
                if (th && container) {
                  const frozenWidth = 140;
                  const scrollLeft = th.offsetLeft - frozenWidth;
                  container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
              }
            }}
            className="w-[240px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-green-200 shadow-md hover:shadow-lg focus:border-green-400 focus:shadow-lg text-green-700 transition-all duration-200 font-mono"
            ariaLabel="Jump to Ring"
            selectedIcon="🐾"
            dropdownMenuClassName="w-[240px] rounded-xl bg-gradient-to-b from-white via-green-50 to-white shadow-xl border-2 border-green-200 text-base font-semibold text-green-800 transition-all duration-200 font-mono whitespace-pre"
            borderColor="border-green-300" // Green border
            focusBorderColor="focus:border-green-500" // Green border on focus
            textColor="text-green-700" // Green text
          />
        </div>
        {/* Table scroll container with sticky header */}
        <div className="relative">
          <div
            className="outer-table-scroll-container overflow-x-auto border border-green-200 bg-white shadow-lg"
            ref={tableContainerRef}
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}
          >
            <table className="border-collapse w-auto table-fixed divide-y divide-gray-200 bg-white" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}>
              <thead style={{ margin: 0, padding: 0 }}>
                <tr className="cfa-table-header-modern" style={{ margin: 0, padding: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)', color: '#fff', boxShadow: '0 6px 24px 0 rgba(34,197,94,0.12), 0 1.5px 0 0 #C7B273', borderBottom: '4px solid #C7B273' }}>
                  <th className="cfa-table-header-cell-modern text-left pl-6 align-bottom" style={{ minWidth: 140, maxWidth: 140, verticalAlign: 'top', borderTopLeftRadius: 0, margin: 0, padding: 0 }}>
                    <div className="flex flex-col justify-start items-start gap-0.5 relative">
                      <span className="header-main block">Position</span>
                      <span className="header-sub block">Placement</span>
                    </div>
                  </th>
                  {columns.map((column, index) => (
                    <th
                      key={`header-modern-${index}`}
                      id={`ring-th-${index}`}
                      className={`cfa-table-header-cell-modern text-center align-bottom`}
                      style={{ width: 170, minWidth: 170, maxWidth: 170, verticalAlign: 'top', borderTopRightRadius: 0, margin: 0, padding: 0 }}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 relative">
                        <span className="header-main block">Ring {column.judge.id}</span>
                        <span className="header-sub font-semibold block">{column.judge.acronym}</span>
                        <span className="header-sub italic block">{column.specialty}</span>
                      </div>
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
                      const voided = isVoided(colIdx, i);
                      const maxRowsForThisColumn = getAwardCount(col.specialty);
                      const errorKey = `${colIdx}-${i}`;
                      
                      // Only show input if this row is within the breakpoint for this column
                      if (i < maxRowsForThisColumn) {
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150 ${focusedColumnIndex === colIdx ? ' border-l-4 border-r-4 border-green-300 z-10' : ''} hover:bg-gray-50 whitespace-nowrap overflow-x-visible`}
                            style={{
                              width: (cell.catNumber && cell.catNumber.trim()) ? 110 : 90,
                              minWidth: (cell.catNumber && cell.catNumber.trim()) ? 110 : 90,
                              maxWidth: (cell.catNumber && cell.catNumber.trim()) ? 110 : 90,
                              transition: 'width 0.2s'
                            }}
                          > 
                            <div className="flex flex-col items-start">
                              <div className="flex gap-2 items-center">
                                {/* Cat # input: rounded-md, semi-transparent, focus ring, shadow */}
                                <input
                                  type="text"
                                  className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-green-200 shadow focus:border-green-400 focus:ring-2 focus:ring-green-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${voided ? 'opacity-50 grayscale line-through' : ''} ${getBorderStyle(errorKey)}`}
                                  placeholder="Cat #"
                                  value={cell.catNumber ?? ''}
                                  onChange={e => handleCatNumberInput(colIdx, i, e.target.value)}
                                  onFocus={e => handleCatInputFocus(e, colIdx)}
                                  onKeyDown={e => handleCatInputKeyDown(e, colIdx, i)}
                                  onBlur={handleBlur}
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
                                {/* Status label: static span, green theme, uniform design - HIDE if VOID */}
                                {!voided && (
                                  <span
                                    className="min-w-[70px] inline-flex items-center justify-center rounded-full px-3 py-1.5 border border-green-300 text-green-700 text-xs font-semibold shadow-sm opacity-80 bg-white"
                                    aria-label="Status"
                                  >
                                    KIT
                                  </span>
                                )}
                              </div>
                              {/* Error message */}
                              {errors[errorKey] && (
                                <div
                                  className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full"
                                >
                                  <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                  </svg>
                                  {getCleanMessage(errors[errorKey])}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      } else {
                        // Show empty cell for rows beyond this column's breakpoint
                        return (
                          <td key={`kitten-final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150 ${focusedColumnIndex === colIdx ? ' border-l-4 border-r-4 border-green-300 z-10' : ''} hover:bg-gray-50`}>
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