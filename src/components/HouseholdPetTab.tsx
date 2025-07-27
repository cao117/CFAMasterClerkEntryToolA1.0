import React, { useMemo, useRef, useState } from 'react';
import * as householdPetValidation from '../validation/householdPetValidation';
import { handleSaveToCSV } from '../utils/formActions';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import CustomSelect from './CustomSelect'; // Added import for CustomSelect

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
    // Custom: If value is 'VOID', cursor at end, and Backspace pressed, clear input (KittenTab/PRTab parity)
    if (
      e.key === 'Backspace' &&
      e.currentTarget.value === 'VOID' &&
      e.currentTarget.selectionStart === 4 &&
      e.currentTarget.selectionEnd === 4
    ) {
      updateShowAward(colIdx, rowIdx, '');
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

  // Utility: Check if a cat number input is VOID (case-insensitive)
  function isVoidInput(catNumber: string): boolean {
    return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
  }

  // --- Update placement (cat number) ---
  const updateShowAward = (colIdx: number, pos: number, value: string) => {
    const key = `${colIdx}-${pos}`;
    // Auto-complete VOID when user types 'v' or 'V'
    const newValue = value.toLowerCase() === 'v' ? 'VOID' : value;
    setHouseholdPetTabData(prev => {
      const prevCell = prev.showAwards?.[key] || {};
      const newCell = {
        ...prevCell,
        catNumber: newValue,
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
  };

  // --- Handle cat number input (matches KittenTab pattern) ---
  const handleCatNumberInput = (colIdx: number, pos: number, value: string) => {
    // Auto-complete VOID when user types 'v' or 'V'
    if (value.toLowerCase() === 'v') {
      updateShowAward(colIdx, pos, 'VOID');
    } else {
      updateShowAward(colIdx, pos, value);
    }
  };

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
    return householdPetValidation.validateHouseholdPetTab(validationInput);
  };

  // --- Validate on blur (matches KittenTab pattern) ---
  const handleBlur = () => {
    const errors = validate();
    setErrors(errors);
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
  // Remove the useEffect for auto-focus (lines 227-249)

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
    setIsResetModalOpen(true);
  };
  const confirmReset = () => {
    setIsResetModalOpen(false);
    // Build initial showAwards for all visible cells (columns × rows)
    const newShowAwards: { [key: string]: { catNumber: string; status: string } } = {};
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      for (let i = 0; i < totalCatRows; i++) {
        newShowAwards[`${colIdx}-${i}`] = { catNumber: '', status: 'HHP' };
      }
    }
    setHouseholdPetTabData({ showAwards: newShowAwards, voidedShowAwards: {} });
    setFocusedColumnIndex(null);
    // Clear errors immediately (matches KittenTab behavior)
    setErrors({});
    // Show success message
    showSuccess('Household Pet Tab Reset', 'Household Pet tab data has been reset successfully.');
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
        onConfirm={confirmReset}
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
      {/* Household Pet Finals - Premium Design */}
      <div className="group relative">
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4 transition-all duration-200 border-b border-violet-200 shadow-sm">
          {/* Left: Icon, Title */}
          <div className="flex items-center min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-orange-400 to-orange-300 rounded-xl shadow flex-shrink-0">
              {/* Orange Heart Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </span>
            <span className="text-xl font-bold text-orange-700 ml-3">Household Pet Finals</span>
          </div>
          {/* Right: CustomSelect dropdown, orange theme */}
          <CustomSelect
            options={columns.map((col, idx) => `Ring ${col.judge.id} - ${col.judge.acronym}`)}
            value={
              focusedColumnIndex !== null && focusedColumnIndex >= 0 && focusedColumnIndex < columns.length
                ? `Ring ${columns[focusedColumnIndex].judge.id} - ${columns[focusedColumnIndex].judge.acronym}`
                : `Ring ${columns[0].judge.id} - ${columns[0].judge.acronym}`
            }
            onChange={(val: string) => {
              const ringId = parseInt(val.split(" ")[1]);
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
            }}
            className="w-[220px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-orange-200 shadow-md hover:shadow-lg focus:border-orange-400 focus:shadow-lg text-orange-700 transition-all duration-200"
            ariaLabel="Jump to Ring"
            selectedIcon="🐱"
            dropdownMenuClassName="w-[220px] rounded-xl bg-gradient-to-b from-white via-orange-50 to-white shadow-xl border-2 border-orange-200 text-base font-semibold text-orange-800 transition-all duration-200"
            borderColor="border-orange-300" // Orange border
            focusBorderColor="focus:border-orange-500" // Orange border on focus
            textColor="text-orange-700" // Orange text
          />
        </div>
        {/* Table scroll container with sticky header */}
        <div className="relative">
          <div
            className="outer-table-scroll-container overflow-x-auto border border-orange-200 bg-white shadow-lg"
            ref={tableContainerRef}
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}
          >
            <table className="border-collapse w-auto table-fixed divide-y divide-gray-200 bg-white" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}>
              <thead style={{ margin: 0, padding: 0 }}>
                <tr className="cfa-table-header-modern" style={{ margin: 0, padding: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, background: 'linear-gradient(90deg, #f59e42 0%, #fbbf24 100%)', color: '#fff', boxShadow: '0 6px 24px 0 rgba(245,158,66,0.12), 0 1.5px 0 0 #C7B273', borderBottom: '4px solid #C7B273' }}>
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
                      // Parity with KittenTab: width/minWidth/maxWidth 170px
                      style={{ width: 170, minWidth: 170, maxWidth: 170, verticalAlign: 'top', borderTopRightRadius: 0, margin: 0, padding: 0 }}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5 relative">
                        <span className="header-main block">Ring {column.judge.id}</span>
                        <span className="header-sub font-semibold block">{column.judge.acronym}</span>
                        <span className="header-sub italic block">{column.judge.ringType}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Household Pet Final Section (Top 10/15) */}
                {Array.from({ length: totalCatRows }, (_, i) => (
                  <tr key={`hhp-final-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : 'bg-orange-50'} hover:bg-orange-100/40 hover:shadow-sm`}>
                    <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                      {i + 1}{i >= 10 ? '*' : ''}
                    </td>
                    {columns.map((_, colIdx) => {
                      const cell = getShowAward(colIdx, i) || { catNumber: '', status: 'HHP' };
                      const voided = isVoidInput(cell.catNumber);
                      const error = errors[`${colIdx}-${i}`]; // Fixed: complete error assignment
                      return (
                        <td key={`hhp-final-cell-${colIdx}-${i}`} className={`py-2 px-2 border-r border-gray-300 align-top transition-all duration-150${focusedColumnIndex === colIdx ? ' border-l-4 border-r-4 border-orange-300 z-10' : ''} hover:bg-orange-50 whitespace-nowrap overflow-x-visible`} style={{ width: cell.catNumber ? 110 : 90, minWidth: cell.catNumber ? 110 : 90, maxWidth: cell.catNumber ? 110 : 90, transition: 'width 0.2s' }}>
                          <div className="flex flex-col items-start">
                            <div className="flex gap-2 items-center">
                              {/* Cat # input: bulletproof editable */}
                              <input
                                type="text"
                                className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-orange-200 shadow focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${error ? 'cfa-input-error' : ''} ${voided ? 'opacity-50 grayscale line-through' : ''}`}
                                placeholder="Cat #"
                                value={cell.catNumber}
                                onChange={e => handleCatNumberInput(colIdx, i, e.target.value)}
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
                                onKeyDown={e => handleCatInputKeyDown(e, colIdx, i)}
                                onFocus={e => handleCatInputFocus(e, colIdx)}
                                readOnly={false}
                                tabIndex={0}
                              />
                              {/* Static status label for HHP, styled like dropdown - HIDE if VOID */}
                              {!voided && (
                                <span className="min-w-[70px] px-3 py-1 rounded-full border border-orange-200 text-orange-700 font-semibold text-sm text-center select-none bg-white">HHP</span>
                              )}
                            </div>
                            {/* Error message */}
                            {error && (
                              <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full">
                                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                </svg>
                                {getCleanMessage(error)}
                              </div>
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
        {/* Premium Action Buttons - Centered, matches GeneralTab */}
        <ActionButtons
          onSaveToCSV={handleSaveToCSVClick}
          onLoadFromCSV={handleRestoreFromCSVClick}
          onReset={handleResetClick}
        />
      </div>
    </div>
  );
}