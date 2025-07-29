import React, { useState, useRef, useEffect, useMemo } from 'react';
import { handleSaveToExcel } from '../utils/excelExport';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import * as premiershipValidation from '../validation/premiershipValidation';
import CustomSelect from './CustomSelect';
import { formatJumpToMenuOptions, formatJumpToMenuValue, getRoomTypeAbbreviation } from '../utils/jumpToMenuUtils';


interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
  ringNumber: number;
}

interface Column {
  judge: Judge;
  specialty: string;
  columnIndex: number;
}

interface PremiershipTabProps {
  judges: Judge[];
  premiershipTotal: number;
  premiershipCounts: {
    gps: number;
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
    lhNovs: number;
    shNovs: number;
    novs: number;
    prs: number;
  };
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  isActive: boolean;
  premiershipTabData: PremiershipTabData;
  setPremiershipTabData: React.Dispatch<React.SetStateAction<PremiershipTabData>>;
  getShowState: () => Record<string, unknown>;
  /**
   * Handler for CSV import functionality
   */
  onCSVImport: () => Promise<void>;
}

type PremiershipTabData = {
  showAwards: { [key: string]: { catNumber: string; status: string } };
  premiersFinals: { [key: string]: string };
  abPremiersFinals: { [key: string]: string };
  lhPremiersFinals: { [key: string]: string };
  shPremiersFinals: { [key: string]: string };
  errors: { [key: string]: string };
};

/**
 * PremiershipTab: Full UI and validation for CFA Premiership Finals
 * Closely mimics ChampionshipTab and KittenTab structure and logic
 * - Renders columns for each judge
 * - Premiership Final (Top 10/15): GP, PR, NOV allowed
 * - Best AB PR, Best LH PR, Best SH PR: Only PR allowed
 * - Dynamic row/section enable/disable based on ring type and breakpoints
 * - Voiding is input-driven: typing 'VOID' (case-insensitive) or 'v' in any cat number input voids that cell and all matching cat numbers in the column (no checkbox)
 * - Unvoiding: changing a 'VOID' cell to any other value unvoids all instances in the column
 * - Voided state is determined solely by the input value
 * - Voided cells are visually grayed out and struck through, but not disabled
 * - Validation and CSV import/export skip or preserve 'VOID' cells as described
 * - Inline error messages per cell/row
 * - Shared action button handlers
 */

// Add isVoidInput utility at the top for void logic parity with ChampionshipTab
function isVoidInput(catNumber: string): boolean {
  return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
}

// Helper: Build initial showAwards object for all visible cells (columns × rows)
function buildInitialShowAwards(columns: Column[], getFinalsCount: (ringType: string) => number) {
  const showAwards: { [key: string]: { catNumber: string; status: string } } = {};
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const rowCount = getFinalsCount(columns[colIdx].specialty);
    for (let i = 0; i < rowCount; i++) {
      showAwards[`${colIdx}-${i}`] = { catNumber: '', status: 'GP' };
    }
  }
  return showAwards;
}

export default function PremiershipTab({
  judges,
  premiershipTotal,
  premiershipCounts,
  showSuccess,
  showError,
  premiershipTabData,
  setPremiershipTabData,
  getShowState,
  isActive,
  onCSVImport
}: PremiershipTabProps) {
  // State for dynamic table structure
  const [numAwardRows, setNumAwardRows] = useState(10);
  
  // State for validation errors and modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false); // NEW: Modal for CSV error
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
  // Local errors state (like ChampionshipTab)
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Add localInputState for Cat # fields (Show Awards)
  const [localInputState, setLocalInputState] = useState<{ [key: string]: string }>({});

  // Add a ref to track last committed value for each Cat # input
  const lastCommittedCatNumber = useRef<{ [key: string]: string }>({});

  // Generalized handler for Cat # input blur/focusout
  const handleCatNumberBlurOrFocusOut = (colIdx: number, rowIdx: number, section: 'showAwards' | 'ab' | 'lh' | 'sh', value: string) => {
    const key =
      section === 'showAwards'
        ? `${colIdx}-${rowIdx}`
        : section === 'ab'
        ? `${colIdx}-${rowIdx}`
        : section === 'lh'
        ? `${colIdx}-${rowIdx}`
        : `${colIdx}-${rowIdx}`;
    if (lastCommittedCatNumber.current[key] !== value) {
      // Only validate if value changed
      if (section === 'showAwards') {
        handleShowAwardBlur(colIdx, rowIdx, 'catNumber', value);
      } else {
        handleFinalsBlur(section, colIdx, rowIdx, value);
      }
      lastCommittedCatNumber.current[key] = value;
    }
  };

  // Memoize columns for consistent reference
  const columns: Column[] = useMemo(() => {
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
  }, [judges]);

  // Update numAwardRows based on breakpoint (like Championship tab)
  useEffect(() => {
    if (premiershipTotal >= 50) {
      setNumAwardRows(15);
    } else {
      setNumAwardRows(10);
    }
  }, [premiershipTotal]);

  // --- Helper: Get finals/Best PR counts for a ring type ---
  const getFinalsCount = (ringType: string) => {
    if (ringType === 'Allbreed') {
      return premiershipCounts.gps + premiershipCounts.prs + premiershipCounts.lhNovs + premiershipCounts.shNovs >= 50 ? 15 : 10;
    } else if (ringType === 'Longhair') {
      return premiershipCounts.lhGps + premiershipCounts.lhPrs + premiershipCounts.lhNovs >= 50 ? 15 : 10;
    } else if (ringType === 'Shorthair') {
      return premiershipCounts.shGps + premiershipCounts.shPrs + premiershipCounts.shNovs >= 50 ? 15 : 10;
    }
    return 10; // Default fallback
  };

  // --- Helper: Get sections that should be shown for each ring type ---
  const getSectionsForRingType = (specialty: string): Array<'ab' | 'lh' | 'sh'> => {
    switch (specialty) {
      case 'Allbreed':
        return ['ab', 'lh', 'sh'];
      case 'Longhair':
        return ['lh'];
      case 'Shorthair':
        return ['sh'];
      default:
        return [];
    }
  };

  // --- Helper: Get Show Awards row count for a column ---
  const getShowAwardsRowCount = (colIdx: number, specialty: string): number => {
    // Calculate the correct breakpoint based on ring type
    const count = getFinalsCount(specialty);
    
    // Only check for imported data if it's within the valid range for this ring type
    let maxIdx = -1;
    Object.keys(premiershipTabData.showAwards).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx && row >= 0 && row < count) {
        maxIdx = Math.max(maxIdx, row);
      }
    });
    
    // Return the calculated value (don't override with imported data that exceeds the breakpoint)
    return count;
  };

  // --- Helper: Get Finals row count for a column/section ---
  const getFinalsRowCount = (colIdx: number, specialty: string, section: 'ab' | 'lh' | 'sh'): number => {
    const calculated = getFinalsCount(specialty) >= 50 ? 3 : 2;
    let finalsObj: Record<string, string> = {};
    if (section === 'ab') finalsObj = premiershipTabData.abPremiersFinals;
    if (section === 'lh') finalsObj = premiershipTabData.lhPremiersFinals;
    if (section === 'sh') finalsObj = premiershipTabData.shPremiersFinals;
    let maxIdx = -1;
    Object.keys(finalsObj).forEach(key => {
      const [col, row] = key.split('-').map(Number);
      if (col === colIdx && row > maxIdx) {
        maxIdx = row;
      }
    });
    return Math.max(calculated, maxIdx + 1);
  };
  const getFinalsPositionsForRingTypeLocal = (ringType: string) => {
    let count = 0;
    switch (ringType) {
      case 'Allbreed':
        count = premiershipCounts.gps + premiershipCounts.prs + premiershipCounts.lhNovs + premiershipCounts.shNovs;
        break;
      case 'Longhair':
        count = premiershipCounts.lhGps + premiershipCounts.lhPrs + premiershipCounts.lhNovs;
        break;
      case 'Shorthair':
        count = premiershipCounts.shGps + premiershipCounts.shPrs + premiershipCounts.shNovs;
        break;
      default:
        count = premiershipCounts.gps + premiershipCounts.prs + premiershipCounts.lhNovs + premiershipCounts.shNovs;
        break;
    }
    return count >= 50 ? 3 : 2; // 3 positions if 15 awards, 2 if 10 awards
  };

  // Helper function to calculate row index for each section (like Championship tab)
  const getRowIndexForSection = (colIdx: number, specialty: string, section: 'showAwards' | 'ab' | 'lh' | 'sh', position: number): number => {
    const sections = getSectionsForRingType(specialty);
    let rowIndex = 0;
    
    // Add Show Awards rows
    if (section === 'showAwards') {
      return position;
    }
    
    rowIndex += getShowAwardsRowCount(colIdx, specialty);
    
    // Add rows for sections that come before the target section
    if (section === 'ab') {
      return rowIndex + position;
    }
    
    if (sections.includes('ab')) {
      rowIndex += getFinalsRowCount(colIdx, specialty, 'ab');
    }
    
    if (section === 'lh') {
      return rowIndex + position;
    }
    
    if (sections.includes('lh')) {
      rowIndex += getFinalsRowCount(colIdx, specialty, 'lh');
    }
    
    if (section === 'sh') {
      return rowIndex + position;
    }
    
    return rowIndex;
  };

  // Accessibility: refs for ALL Cat # input fields (Show Awards + Finals)
  // We'll build a 2D array: catInputRefs[columnIndex][verticalRowIndex]
  // Calculate totalCatRows using consistent logic (like ChampionshipTab approach)
  const maxFinalsRows = premiershipTotal >= 50 ? 3 : 2;
  const totalCatRows = numAwardRows + maxFinalsRows + maxFinalsRows + maxFinalsRows; // Show Awards + AB + LH + SH
  const catInputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  useEffect(() => {
    // Initialize refs 2D array to match columns and totalCatRows
    catInputRefs.current = Array.from({ length: columns.length }, () => Array(totalCatRows).fill(null));
  }, [columns.length, totalCatRows]);

  // Focus first Cat # input on mount or when columns/rows change, after refs are populated
  useEffect(() => {
    if (isActive && columns.length > 0 && totalCatRows > 0) {
      // Use a longer timeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (catInputRefs.current[0] && catInputRefs.current[0][0]) {
          catInputRefs.current[0][0].focus();
          catInputRefs.current[0][0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [isActive, columns.length, totalCatRows]);


  /**
   * Handles focus events for Cat # input fields.
   * Selects all text in the input and sets the focused column.
   * Applies to all Cat # inputs in the Premiership tab.
   * @param e React focus event
   * @param columnIndex The column index of the focused input
   */
  const handleCatInputFocus = (e: React.FocusEvent<HTMLInputElement>, columnIndex: number) => {
    e.target.select();
    setFocusedColumnIndex(columnIndex);
  };

  // Handler for custom tab/shift+tab navigation for ALL Cat # fields, skipping disabled inputs
  const handleCatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, colIdx: number, rowIdx: number) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      // Helper to check if input is enabled
      const isEnabled = (col: number, row: number) => {
        const ref = catInputRefs.current[col]?.[row];
        return ref && !ref.disabled;
      };

      // Helper to find the next logical position based on table structure
      const findNextPosition = (currentCol: number, currentRow: number, forward: boolean) => {
        const col = columns[currentCol];
        if (!col) return null;

        // Get the sections that should be shown for this ring type
        const sections = getSectionsForRingType(col.specialty);
        
        // Calculate the total number of rows for this column
        const showAwardsCount = getShowAwardsRowCount(currentCol, col.specialty);
        const totalRows = showAwardsCount + sections.reduce((total, section) => {
          return total + getFinalsRowCount(currentCol, col.specialty, section);
        }, 0);

        let nextCol = currentCol;
        let nextRow = currentRow;

        if (forward) {
          // Move to next row in same column
          if (nextRow < totalRows - 1) {
            nextRow++;
          } else {
            // Move to next column
            nextCol++;
            if (nextCol >= columns.length) {
              return null; // End of table
            }
            nextRow = 0;
          }
        } else {
          // Move to previous row in same column
          if (nextRow > 0) {
            nextRow--;
          } else {
            // Move to previous column
            nextCol--;
            if (nextCol < 0) {
              return null; // Beginning of table
            }
            const prevCol = columns[nextCol];
            const prevSections = getSectionsForRingType(prevCol.specialty);
            const prevShowAwardsCount = getShowAwardsRowCount(nextCol, prevCol.specialty);
            nextRow = prevShowAwardsCount + prevSections.reduce((total, section) => {
              return total + getFinalsRowCount(nextCol, prevCol.specialty, section);
            }, 0) - 1;
          }
        }

        return { col: nextCol, row: nextRow };
      };

      // Find next position
      const nextPos = findNextPosition(colIdx, rowIdx, !e.shiftKey);
      
      if (nextPos && isEnabled(nextPos.col, nextPos.row)) {
        const nextRef = catInputRefs.current[nextPos.col]?.[nextPos.row];
        if (nextRef) {
          nextRef.focus();
          setFocusedColumnIndex(nextPos.col);
        }
      }
    }
  };

  // --- Premiership Data State ---
  // Each column = one judge/ring
  // Each section = Premiership Final, Best AB PR, Best LH PR, Best SH PR
  // Data is stored as: { [columnIndex_position]: { catNumber, status, voided } }

  // Add refs and state for parity with ChampionshipTab
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Helper: Check if a cat number is voided anywhere in the column (all sections) ---
  const isCatNumberVoidedInColumn = (colIdx: number, catNumber: string): boolean => {
    if (!catNumber || !catNumber.trim()) return false;
    return (
      Object.keys(premiershipTabData.showAwards).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.showAwards[k]?.catNumber === catNumber && isVoidInput(premiershipTabData.showAwards[k].catNumber)) ||
      Object.keys(premiershipTabData.abPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.abPremiersFinals[k] === catNumber && isVoidInput(premiershipTabData.abPremiersFinals[k])) ||
      Object.keys(premiershipTabData.lhPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.lhPremiersFinals[k] === catNumber && isVoidInput(premiershipTabData.lhPremiersFinals[k])) ||
      Object.keys(premiershipTabData.shPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.shPremiersFinals[k] === catNumber && isVoidInput(premiershipTabData.shPremiersFinals[k]))
    );
  };

  // --- Handler: Update show awards (Premiership Final) ---
  const updateShowAward = (colIdx: number, pos: number, field: 'catNumber' | 'status', value: string) => {
    const key = `${colIdx}-${pos}`;
    let shouldBeVoided = false;
    if (value && value.trim() !== '') {
      shouldBeVoided = isCatNumberVoidedInColumn(colIdx, value);
    }
    setPremiershipTabData((prev: any) => {
      const prevCell = prev.showAwards[key] || {};
      let newCell = { ...prevCell, [field]: value };
      // If setting catNumber and status is missing, default to 'GP'
      if (field === 'catNumber' && value && (!prevCell.status || prevCell.status === '')) {
        newCell.status = 'GP';
      }
      return {
      ...prev,
      showAwards: {
        ...prev.showAwards,
          [key]: newCell
      },
      };
    });
  };

  // --- Handler: Update finals sections ---
  const updateFinals = (section: 'premiers' | 'ab' | 'lh' | 'sh', colIdx: number, pos: number, value: string) => {
    const key = `${colIdx}-${pos}`;
    setPremiershipTabData(prev => {
      // Defensive copy
      const newState = { ...prev };
      if (section === 'ab') {
        newState.abPremiersFinals = { ...prev.abPremiersFinals, [key]: value };
      } else if (section === 'lh') {
        newState.lhPremiersFinals = { ...prev.lhPremiersFinals, [key]: value };
      } else if (section === 'sh') {
        newState.shPremiersFinals = { ...prev.shPremiersFinals, [key]: value };
      } else if (section === 'premiers') {
        newState.premiersFinals = { ...prev.premiersFinals, [key]: value };
      }
      return newState;
    });
  };

  // --- Handler: Blur events for show awards - run validation here (like ChampionshipTab) ---
  const handleShowAwardBlur = (colIdx: number, pos: number, field: 'catNumber' | 'status', value: string) => {
    const errorKey = `showAwards-${colIdx}-${pos}`;
    const input = createValidationInput();
    
    // Run basic validation for this input
    if (field === 'catNumber' && value.trim() !== '') {
      if (isVoidInput(value)) {
        // VOID is always valid, clear any error
        setErrors((prev: any) => {
          const copy = { ...prev };
          delete copy[errorKey];
          return copy;
        });
        // Still run full validation to clear any stale errors
        setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
        return;
      }
      // Validate cat number format
      if (!premiershipValidation.validateCatNumber(value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID' }));
        return;
      }
      // Sequential entry validation
      if (!premiershipValidation.validateSequentialEntry(input, 'showAwards', colIdx, pos, value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
        return;
      }
      // Duplicate validation REMOVED: always rely on main validation function for duplicate errors
    }
    
    // Always trigger full validation after any blur to ensure all relationship-based errors are applied
    setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
  };

  // --- Handler: Blur events for finals - run validation here (like ChampionshipTab) ---
  const handleFinalsBlur = (section: 'ab' | 'lh' | 'sh', colIdx: number, pos: number, value: string) => {
    const errorKey = `${section === 'ab' ? 'abPremiersFinals' : section === 'lh' ? 'lhPremiersFinals' : 'shPremiersFinals'}-${colIdx}-${pos}`;
    const input = createValidationInput();
    // VOID check
      if (isVoidInput(value)) {
        setErrors((prev: any) => {
          const copy = { ...prev };
          delete copy[errorKey];
          return copy;
        });
        // Still run full validation to clear any stale errors
        setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
        return;
      }
    // Range/Format check
      if (!premiershipValidation.validateCatNumber(value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID' }));
        return;
      }
    // Full-form validation (get all errors)
    const allErrors = premiershipValidation.validatePremiershipTab(input);
    if (allErrors[errorKey] && allErrors[errorKey].toLowerCase().includes('duplicate')) {
      setErrors((prev: any) => ({ ...prev, [errorKey]: allErrors[errorKey] }));
      return;
    }
    // Sequential entry check (only if no duplicate error)
      if (!premiershipValidation.validateSequentialEntry(input, section === 'ab' ? 'abPremiers' : section === 'lh' ? 'lhPremiers' : 'shPremiers', colIdx, pos, value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
        return;
      }
    // If no errors, clear error
    setErrors((prev: any) => {
      const copy = { ...prev };
      delete copy[errorKey];
      return copy;
    });
  };

  // --- Handler: Update void state ---
  // const updateVoidState = (section: string, colIdx: number, pos: number, voided: boolean) => {
  //   // Commented out unused function
  // };

  // Create validation input function
  const createValidationInput = (): premiershipValidation.PremiershipValidationInput => ({
    columns,
    showAwards: premiershipTabData.showAwards,
    premiersFinals: premiershipTabData.premiersFinals,
    abPremiersFinals: premiershipTabData.abPremiersFinals,
    lhPremiersFinals: premiershipTabData.lhPremiersFinals,
    shPremiersFinals: premiershipTabData.shPremiersFinals,
    premiershipTotal,
    premiershipCounts: {
      gps: premiershipCounts.gps,
      lhGps: premiershipCounts.lhGps,
      shGps: premiershipCounts.shGps,
      lhPrs: premiershipCounts.lhPrs,
      shPrs: premiershipCounts.shPrs,
      lhNovs: premiershipCounts.lhNovs,
      shNovs: premiershipCounts.shNovs,
      novs: premiershipCounts.novs,
      prs: premiershipCounts.prs
    },
  });

  // --- Render Table UI ---
  // For each judge/column, render sections: Premiership Final, Best AB PR, Best LH PR, Best SH PR
  // Only render sections/rows that are enabled for the ring type and breakpoints

  // Action button handlers (to be replaced with real logic)
  const handleSaveToCSVClick = () => {
    // Check for validation errors before CSV export
    if (Object.keys(errors).length > 0) {
      // Show error modal or toast
      showError('CSV Export Error', 'Cannot export CSV while there are validation errors. Please fix all errors first.');
      return;
    }
    // Export the full show state for Excel export
    handleSaveToExcel(getShowState, showSuccess, showError);
  };

  const handleRestoreFromCSVClick = () => {
    onCSVImport();
  };

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };
  const confirmReset = () => {
    setIsResetModalOpen(false);
    // Reset only Premiership tab data, then immediately re-initialize showAwards for all visible cells
    setPremiershipTabData((prev: any) => ({
      ...prev,
      showAwards: buildInitialShowAwards(columns, getFinalsCount),
      premiersFinals: {},
      abPremiersFinals: {},
      lhPremiersFinals: {},
      shPremiersFinals: {},
    }));
    showSuccess('Premiership Tab Reset', 'Premiership tab data has been reset successfully.');
  };

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

  // Add shouldApplyRingGlow
  const shouldApplyRingGlow = (columnIndex: number): boolean => focusedColumnIndex === columnIndex;

  // Add getVoidState for parity - now includes local input state for immediate feedback
  const getVoidState = (section: string, colIdx: number, pos: number): boolean => {
    const key = `${colIdx}-${pos}`;
    // Check local input state first for immediate feedback, then fall back to model data
    const localValue = localInputState[key];
    if (localValue !== undefined) {
      return isVoidInput(localValue);
    }
    // Fallback to model data
    if (section === 'showAwards') return isVoidInput(premiershipTabData.showAwards[key]?.catNumber || '');
    if (section === 'premiers') return isVoidInput(premiershipTabData.premiersFinals[key] || '');
    if (section === 'ab') return isVoidInput(premiershipTabData.abPremiersFinals[key] || '');
    if (section === 'lh') return isVoidInput(premiershipTabData.lhPremiersFinals[key] || '');
    if (section === 'sh') return isVoidInput(premiershipTabData.shPremiersFinals[key] || '');
    return false;
  };

  // Helper to get ordinal label for Best sections (parity with ChampionshipTab)
  const getOrdinalLabel = (idx: number, type: 'AB' | 'LH' | 'SH') => {
    const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
    const label = ordinals[idx] || `${idx + 1}th Best`;
    if (type === 'AB') return `${label} AB Premier`;
    if (type === 'LH') return `${label} LH Premier`;
    if (type === 'SH') return `${label} SH Premier`;
    return label;
  };

  // Update void logic: toggling void applies to all cells in the same column with the same Cat # (all sections), cross-section
  const updateVoidStateColumnWide = (section: string, colIdx: number, pos: number, voided: boolean) => {
    // Get the Cat # for the toggled cell
    let catNumber = '';
    if (section === 'showAwards') catNumber = premiershipTabData.showAwards[`${colIdx}-${pos}`]?.catNumber || '';
    if (section === 'ab') catNumber = premiershipTabData.abPremiersFinals[`${colIdx}-${pos}`] || '';
    if (section === 'lh') catNumber = premiershipTabData.lhPremiersFinals[`${colIdx}-${pos}`] || '';
    if (section === 'sh') catNumber = premiershipTabData.shPremiersFinals[`${colIdx}-${pos}`] || '';
    if (!catNumber) return;
    // Find all keys in all sections for this column where the Cat # matches
    const matchingShowAwards = Object.keys(premiershipTabData.showAwards).filter(key => key.startsWith(`${colIdx}-`) && premiershipTabData.showAwards[key]?.catNumber === catNumber);
    const matchingAB = Object.keys(premiershipTabData.abPremiersFinals).filter(key => key.startsWith(`${colIdx}-`) && premiershipTabData.abPremiersFinals[key] === catNumber);
    const matchingLH = Object.keys(premiershipTabData.lhPremiersFinals).filter(key => key.startsWith(`${colIdx}-`) && premiershipTabData.lhPremiersFinals[key] === catNumber);
    const matchingSH = Object.keys(premiershipTabData.shPremiersFinals).filter(key => key.startsWith(`${colIdx}-`) && premiershipTabData.shPremiersFinals[key] === catNumber);
    // Update all void state objects for all matching keys
    setPremiershipTabData((prev: any) => ({
      ...prev,
      showAwards: {
        ...prev.showAwards,
        ...Object.fromEntries(matchingShowAwards.map(key => [key, voided ? 'VOID' : premiershipTabData.showAwards[key]?.catNumber]))
      },
      abPremiersFinals: {
        ...prev.abPremiersFinals,
        ...Object.fromEntries(matchingAB.map(key => [key, voided ? 'VOID' : premiershipTabData.abPremiersFinals[key]]))
      },
      lhPremiersFinals: {
        ...prev.lhPremiersFinals,
        ...Object.fromEntries(matchingLH.map(key => [key, voided ? 'VOID' : premiershipTabData.lhPremiersFinals[key]]))
      },
      shPremiersFinals: {
        ...prev.shPremiersFinals,
        ...Object.fromEntries(matchingSH.map(key => [key, voided ? 'VOID' : premiershipTabData.shPremiersFinals[key]]))
      }
    }));
  };

  useEffect(() => {
    setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
  }, [premiershipTabData.showAwards, premiershipTabData.abPremiersFinals, premiershipTabData.lhPremiersFinals, premiershipTabData.shPremiersFinals]);

  // Defensive getter for showAwards (Top 10/15)
  const getShowAward = (colIdx: number, i: number) =>
    premiershipTabData.showAwards[`${colIdx}-${i}`] || { catNumber: '', status: 'GP' };

  // --- Cat # Input Handlers (Context-7, robust, decoupled) ---
  // onChange: only update localInputState
  // onBlur/onKeyDown (Tab/Enter): if value changed, update main data model and validate

  // Helper to get the key for each input, now namespaced by section
  const getCatInputKey = (section: 'showAwards' | 'ab' | 'lh' | 'sh', colIdx: number, rowIdx: number) => `${section}-${colIdx}-${rowIdx}`;

  // Generalized onChange handler for Cat # input
  /**
   * For showAwards section, auto-complete 'v' or 'V' (case-insensitive, single char only) to 'VOID' (ChampionshipTab/KittenTab parity).
   */
  const handleCatInputChange = (section: 'showAwards' | 'ab' | 'lh' | 'sh', colIdx: number, rowIdx: number, value: string) => {
    const key = getCatInputKey(section, colIdx, rowIdx);
    // Auto-complete 'v' or 'V' to 'VOID' for all sections
    if (value === 'v' || value === 'V') {
      setLocalInputState(prev => ({ ...prev, [key]: 'VOID' }));
    } else {
      setLocalInputState(prev => ({ ...prev, [key]: value }));
    }
  };

  // Generalized onBlur handler for Cat # input
  const handleCatInputBlur = (section: 'showAwards' | 'ab' | 'lh' | 'sh', colIdx: number, rowIdx: number) => {
    const key = getCatInputKey(section, colIdx, rowIdx);
    const localValue = localInputState[key];
    let modelValue = '';
    if (section === 'showAwards') modelValue = premiershipTabData.showAwards[key]?.catNumber ?? '';
    if (section === 'ab') modelValue = premiershipTabData.abPremiersFinals[key] ?? '';
    if (section === 'lh') modelValue = premiershipTabData.lhPremiersFinals[key] ?? '';
    if (section === 'sh') modelValue = premiershipTabData.shPremiersFinals[key] ?? '';
    // Always update model with localValue (including empty string) if localValue is defined
    if (localValue !== undefined) {
      if (section === 'showAwards') {
        updateShowAward(colIdx, rowIdx, 'catNumber', localValue); // allow ''
        handleShowAwardBlur(colIdx, rowIdx, 'catNumber', localValue);
      } else {
        updateFinals(section, colIdx, rowIdx, localValue); // allow ''
        handleFinalsBlur(section, colIdx, rowIdx, localValue);
      }
    }
    // Clear local input state for this field
    setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
  };

  // Generalized onFocus handler for Cat # input
  const handleCatInputFocusLocal = (section: 'showAwards' | 'ab' | 'lh' | 'sh', colIdx: number, rowIdx: number, value: string, e: React.FocusEvent<HTMLInputElement>) => {
    const key = getCatInputKey(section, colIdx, rowIdx);
    setLocalInputState(prev => ({ ...prev, [key]: value }));
    e.target.select();
    setFocusedColumnIndex(colIdx);
  };

  // Generalized onKeyDown handler for Cat # input
  const handleCatInputKeyDownLocal = (section: 'showAwards' | 'ab' | 'lh' | 'sh', colIdx: number, rowIdx: number, e: React.KeyboardEvent<HTMLInputElement>, tableRowIdx: number) => {
    // Custom: If value is 'VOID', cursor at end, and Backspace pressed, clear input for ALL sections
    if (
      e.key === 'Backspace' &&
      e.currentTarget.value === 'VOID' &&
      e.currentTarget.selectionStart === 4 &&
      e.currentTarget.selectionEnd === 4
    ) {
      const key = getCatInputKey(section, colIdx, rowIdx);
      setLocalInputState(prev => ({ ...prev, [key]: '' }));
      e.preventDefault();
      return;
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      handleCatInputBlur(section, colIdx, rowIdx);
    }
    handleCatInputKeyDown(e, colIdx, tableRowIdx);
  };

  if (judges.length === 0) {
    return (
      <div className="p-8 space-y-8">
        <div className="cfa-section">
          <h2 className="cfa-section-header">Premiership Finals</h2>
          <p className="text-gray-600 mb-6">Dynamic premiership table based on judge information from the General tab.</p>
          <div className="text-center py-12">
            <div className="cfa-badge cfa-badge-warning mb-4">No Judges Available</div>
            <p className="text-gray-600">Please add judges in the General tab to populate the premiership table.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- Table Structure: Sticky headers, frozen position column, columns = judges ---
  // Only render Premiership Final section for now
  const maxFinalRows = Math.max(...columns.map(col => getFinalsCount(col.specialty)));

  // --- GUARD: Only render table if all visible showAwards keys are initialized ---
  let allShowAwardsReady = true;
  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const rowCount = getFinalsCount(columns[colIdx].specialty);
    for (let i = 0; i < rowCount; i++) {
      const key = `${colIdx}-${i}`;
      if (!premiershipTabData.showAwards[key] || typeof premiershipTabData.showAwards[key].catNumber !== 'string') {
        allShowAwardsReady = false;
        break;
      }
    }
    if (!allShowAwardsReady) break;
  }

  // Ensure showAwards is initialized for all visible cells (robust, merge missing keys)
  useEffect(() => {
    if (columns.length > 0 && maxFinalRows > 0) {
      setPremiershipTabData(prev => {
        // Build a new object with all required keys
        const newShowAwards = { ...prev.showAwards };
        let changed = false;
      for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const rowCount = getFinalsCount(columns[colIdx].specialty);
          for (let i = 0; i < rowCount; i++) {
            const key = `${colIdx}-${i}`;
            if (!newShowAwards[key]) {
              newShowAwards[key] = { catNumber: '', status: 'GP' };
              changed = true;
            }
        }
      }
        // Only update if we added any missing keys
        if (changed) {
          // Always merge and preserve all finals sections
          return {
        ...prev,
        showAwards: newShowAwards,
            premiersFinals: { ...prev.premiersFinals },
            abPremiersFinals: { ...prev.abPremiersFinals },
            lhPremiersFinals: { ...prev.lhPremiersFinals },
            shPremiersFinals: { ...prev.shPremiersFinals },
          };
        }
        return prev;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, maxFinalRows]);

  // Ensure finals sections are initialized for all visible cells (robust, merge missing keys)
  useEffect(() => {
    if (columns.length > 0 && maxFinalRows > 0) {
      setPremiershipTabData(prev => {
        let changed = false;
        // AB PR
        const newAB = { ...prev.abPremiersFinals };
        columns.forEach((col, colIdx) => {
          if (col.specialty === 'Allbreed') {
            const rowCount = getFinalsPositionsForRingTypeLocal(col.specialty);
            for (let i = 0; i < rowCount; i++) {
              const key = `${colIdx}-${i}`;
              if (!(key in newAB)) {
                newAB[key] = '';
                changed = true;
              }
            }
          }
        });
        // LH PR
        const newLH = { ...prev.lhPremiersFinals };
        columns.forEach((col, colIdx) => {
          if (col.specialty === 'Allbreed' || col.specialty === 'Longhair') {
            const rowCount = getFinalsPositionsForRingTypeLocal(col.specialty);
            for (let i = 0; i < rowCount; i++) {
              const key = `${colIdx}-${i}`;
              if (!(key in newLH)) {
                newLH[key] = '';
                changed = true;
              }
            }
          }
        });
        // SH PR
        const newSH = { ...prev.shPremiersFinals };
        columns.forEach((col, colIdx) => {
          if (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') {
            const rowCount = getFinalsPositionsForRingTypeLocal(col.specialty);
            for (let i = 0; i < rowCount; i++) {
              const key = `${colIdx}-${i}`;
              if (!(key in newSH)) {
                newSH[key] = '';
                changed = true;
              }
            }
          }
        });
        if (changed) {
          return {
            ...prev,
            abPremiersFinals: newAB,
            lhPremiersFinals: newLH,
            shPremiersFinals: newSH,
          };
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, maxFinalRows]);

  return (
    <div className="p-8 space-y-8">
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Premiership Tab"
        message="Are you sure you want to reset the Premiership tab data? This action cannot be undone and will clear all premiership finals information, but will keep your show details and judge information intact."
        type="warning"
        confirmText="Reset Premiership Tab"
        cancelText="Cancel"
        onConfirm={confirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
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
      {/* Premiership Finals - Premium Design */}
      <div className="group relative">
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4 transition-all duration-200 border-b border-violet-200 shadow-sm">
          {/* Left: Icon, Title, Arrow (if present) */}
          <div className="flex items-center min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-400 rounded-xl shadow flex-shrink-0">
              {/* Blue Ribbon Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="5" strokeWidth="2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 13v6m0 0l-2.5-2.5M12 19l2.5-2.5" />
              </svg>
            </span>
            <span className="text-xl font-bold text-blue-700 ml-3">Premiership Finals</span>
            {/* Optional: Scroll button, if you want parity with ChampionshipTab */}
            {/* <button ...>...</button> */}
          </div>
          {/* Right: Minimal Dropdown, inline blue icon in selected value only */}
          <CustomSelect
            options={formatJumpToMenuOptions(columns)}
            value={formatJumpToMenuValue(columns, focusedColumnIndex)}
            onChange={(selectedValue) => {
              const selectedIndex = columns.findIndex((col) => {
                const ringNumber = col.judge.ringNumber.toString().padStart(2, '0');
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
            className="w-[240px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-blue-200 shadow-md hover:shadow-lg focus:border-blue-400 focus:shadow-lg text-blue-700 transition-all duration-200 font-mono"
            ariaLabel="Jump to Judge"
            selectedIcon="🎗️"
            dropdownMenuClassName="w-[240px] rounded-xl bg-gradient-to-b from-white via-blue-50 to-white shadow-xl border-2 border-blue-200 text-base font-semibold text-blue-800 transition-all duration-200 font-mono whitespace-pre"
            borderColor="border-blue-300" // Blue border
            focusBorderColor="focus:border-blue-500" // Blue border on focus
            textColor="text-blue-700" // Blue text
          />
        </div>
        {/* Table scroll container with sticky header */}
        <div className="relative">
          {/* GUARD: Only render table if all showAwards are ready */}
          {!allShowAwardsReady ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <span className="text-blue-600 text-lg font-semibold animate-pulse">Initializing awards table...</span>
            </div>
          ) : (
          <div
            className="outer-table-scroll-container overflow-x-auto border border-blue-200 bg-white shadow-lg"
            ref={tableContainerRef}
            style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}
          >
            <table className="border-collapse w-auto table-fixed divide-y divide-gray-200 bg-white" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, marginTop: 0, paddingTop: 0 }}>
              <thead style={{ margin: 0, padding: 0 }}>
                <tr className="cfa-table-header-modern" style={{ margin: 0, padding: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', color: '#fff', boxShadow: '0 6px 24px 0 rgba(59,130,246,0.12), 0 1.5px 0 0 #C7B273', borderBottom: '4px solid #C7B273' }}>
                  <th className="cfa-table-header-cell-modern text-left pl-6 align-bottom" style={{ minWidth: 140, maxWidth: 140, verticalAlign: 'top', borderTopLeftRadius: 0, margin: 0, padding: 0 }}>
                    <div className="flex flex-col justify-start items-start gap-0.5 relative">
      

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
                        {/* Changed from 'Ring #' to 'Judge #' for clarity, per user request. No logic affected. */}
                        <span className="header-main block">Ring #{column.judge.ringNumber}</span>
                        <span className="header-sub font-semibold block">{column.judge.acronym}</span>
                        <span className="header-sub italic block">{column.specialty}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Premiership Final Section (Top 10/15) */}
                  {maxFinalRows === 0 || columns.length === 0 ? (
                    <tr><td colSpan={columns.length + 1} style={{ color: 'red', textAlign: 'center' }}>No awards rows rendered (maxFinalRows={maxFinalRows}, columns={columns.length})</td></tr>
                  ) : null}
                {Array.from({ length: 15 }, (_, i) => {
                  // Only render the row if at least one column needs this position
                  const shouldRenderRow = columns.some(col => i < getShowAwardsRowCount(columns.indexOf(col), col.specialty));
                  
                  if (shouldRenderRow) {
                    return (
                      <tr key={`final-row-${i}`} className="cfa-table-row">
                        {/* Frozen position column: apply thick blue right border if first data column is focused */}
                        <td
                          className={`py-2 pl-4 font-medium text-sm bg-white frozen-column ${
                            shouldApplyRingGlow(0) && focusedColumnIndex === 0 ? 'border-r-4 border-blue-300' : 'border-r border-gray-300'
                          }`}
                          style={{ width: '140px', minWidth: '140px' }}
                        >
                          {i + 1}{i >= 10 ? '*' : ''}
                        </td>
                        {columns.map((col, colIdx) => {
                          const cell = getShowAward(colIdx, i);
                          const errorKey = `${colIdx}-${i}`;
                          const catNumber = cell.catNumber;
                          const status = cell.status;
                          const hasCatNumber = catNumber?.trim();
                          // Apply thick blue borders on both sides for focused column, thin blue border otherwise
                          const cellBorderClass = shouldApplyRingGlow(colIdx)
                            ? 'border-l-4 border-r-4 border-blue-300 z-10'
                            : 'border-r border-blue-200';
                          // Each column independently decides whether to show this position
                          const shouldShowCell = i < getShowAwardsRowCount(colIdx, col.specialty);
                          
                          if (shouldShowCell) {
                            return (
                              <td
                                key={`final-cell-${col.judge.id}-${col.specialty}-${i}`}
                                className={`py-2 px-2 align-top transition-all duration-150 whitespace-nowrap overflow-x-visible ${cellBorderClass} hover:bg-gray-50`}
                                style={{
                                  width: hasCatNumber ? 110 : 90,
                                  minWidth: hasCatNumber ? 110 : 90,
                                  maxWidth: hasCatNumber ? 110 : 90,
                                  transition: 'width 0.2s',
                                }}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    {/* Cat # input: bulletproof editable */}
                                    <input
                                      type="text"
                                      className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-blue-200 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${errors[errorKey] ? 'cfa-input-error' : ''} ${isVoidInput(localInputState[getCatInputKey('showAwards', colIdx, i)] ?? catNumber) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={localInputState[getCatInputKey('showAwards', colIdx, i)] ?? catNumber}
                                      onChange={e => handleCatInputChange('showAwards', colIdx, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('showAwards', colIdx, i)}
                                      onFocus={e => handleCatInputFocusLocal('showAwards', colIdx, i, catNumber, e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('showAwards', colIdx, i, e, i)}
                                      ref={el => {
                                        if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                        catInputRefs.current[colIdx][getRowIndexForSection(colIdx, col.specialty, 'showAwards', i)] = el;
                                      }}
                                    />
                                    {/* Only render status dropdown if not VOID */}
                                    {!isVoidInput(catNumber) && (
                                      <CustomSelect
                                        options={['GP', 'PR', 'NOV']}
                                        value={status || 'GP'} // Defensive: always default to 'GP' if missing
                                        onChange={val => updateShowAward(colIdx, i, 'status', val)}
                                        className="min-w-[70px]"
                                        ariaLabel="Status"
                                        borderColor="border-blue-300"
                                        focusBorderColor="focus:border-blue-500"
                                        textColor="text-blue-700"
                                        highlightBg="bg-blue-50"
                                        highlightText="text-blue-900"
                                        selectedBg="bg-blue-100"
                                        selectedText="text-blue-800"
                                        hoverBg="bg-blue-50"
                                        hoverText="text-blue-900"
                                      />
                                    )}
                                  </div>
                                  {/* Error message */}
                                  {errors[errorKey] && (
                                    <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full">
                                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                      </svg>
                                      {errors[errorKey]}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            return (
                              <td 
                                key={`final-cell-${col.judge.id}-${col.specialty}-${i}`} 
                                className={`py-2 px-2 border-r border-blue-200 align-top transition-all duration-150 ${shouldApplyRingGlow(colIdx) ? ' border-l-4 border-r-4 border-blue-300 z-10' : ''}`}
                              >&nbsp;</td>
                            );
                          }
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                {/* Best AB PR Section (Allbreed only) */}
                        {Array.from({ length: Math.max(...columns.map(col => col.specialty === 'Allbreed' ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => col.specialty === 'Allbreed' && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`abpr-${i}`} className="cfa-table-row">
                      {/* Frozen position column: apply thick blue right border if first data column is focused */}
                      <td
                        className={`py-2 pl-4 font-medium text-sm bg-white frozen-column ${shouldApplyRingGlow(0) && focusedColumnIndex === 0 ? 'border-r-4 border-blue-300' : 'border-r border-gray-300'}`}
                        style={{ width: '140px', minWidth: '140px' }}
                      >
                        {getOrdinalLabel(i, 'AB')}
                      </td>
                      {columns.map((col, colIdx) => {
                        const isFocused = focusedColumnIndex === colIdx;
                        const shouldRenderCell = col.specialty === 'Allbreed' && i < getFinalsPositionsForRingTypeLocal(col.specialty);
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.abPremiersFinals[key] || '';
                          const errorKey = `abPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                          <td key={`abpr-${i}-${colIdx}-${error || ''}`} className={`py-2 px-2 align-top transition-all duration-150 whitespace-nowrap overflow-x-visible${isFocused ? ' border-l-4 border-r-4 border-blue-300 z-10' : ' border-r border-blue-200'} hover:bg-gray-50`}>
                            {shouldRenderCell ? (
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-16 h-9 text-sm font-medium text-center rounded-md px-3 bg-white/60 border border-blue-200 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${error ? 'cfa-input-error' : ''} ${isVoidInput(localInputState[getCatInputKey('ab', colIdx, i)] ?? value) ? 'opacity-50 grayscale line-through' : ''}`}
                                    placeholder="Cat #"
                                    value={localInputState[getCatInputKey('ab', colIdx, i)] ?? value}
                                    onChange={e => handleCatInputChange('ab', colIdx, i, e.target.value)}
                                    onBlur={() => handleCatInputBlur('ab', colIdx, i)}
                                    onFocus={e => handleCatInputFocusLocal('ab', colIdx, i, value, e)}
                                    onKeyDown={e => handleCatInputKeyDownLocal('ab', colIdx, i, e, getRowIndexForSection(colIdx, col.specialty, 'ab', i))}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][getRowIndexForSection(colIdx, col.specialty, 'ab', i)] = el;
                                    }}
                                  />
                                </div>
                                  {error && (
                                    <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full">
                                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                      </svg>
                                      {error}
                                    </div>
                                  )}
                              </div>
                            ) : null}
                            </td>
                          );
                      })}
                    </tr>
                  ) : null
                ))}
                {/* Best LH PR Section (Allbreed and Longhair) */}
                        {Array.from({ length: Math.max(...columns.map(col => (col.specialty === 'Allbreed' || col.specialty === 'Longhair') ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => (col.specialty === 'Allbreed' || col.specialty === 'Longhair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`lhpr-${i}`} className="cfa-table-row">
                      {/* Frozen position column: apply thick blue right border if first data column is focused */}
                      <td
                        className={`py-2 pl-4 font-medium text-sm bg-white frozen-column ${shouldApplyRingGlow(0) && focusedColumnIndex === 0 ? 'border-r-4 border-blue-300' : 'border-r border-gray-300'}`}
                        style={{ width: '140px', minWidth: '140px' }}
                      >
                        {getOrdinalLabel(i, 'LH')}
                      </td>
                      {columns.map((col, colIdx) => {
                        const isFocused = focusedColumnIndex === colIdx;
                        const shouldRenderCell = (col.specialty === 'Allbreed' || col.specialty === 'Longhair') && i < getFinalsPositionsForRingTypeLocal(col.specialty);
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.lhPremiersFinals[key] || '';
                          const errorKey = `lhPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                              <td key={`lhpr-${i}-${colIdx}`} className={`py-2 px-2 align-top transition-all duration-150 whitespace-nowrap overflow-x-visible ${shouldApplyRingGlow(colIdx) ? 'border-l-4 border-r-4 border-blue-300 z-10' : 'border-r border-blue-200'} hover:bg-gray-50`}> 
                            {shouldRenderCell ? (
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-16 h-9 text-sm font-medium text-center rounded-md px-3 bg-white/60 border border-blue-200 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${error ? 'cfa-input-error' : ''} ${isVoidInput(localInputState[getCatInputKey('lh', colIdx, i)] ?? value) ? 'opacity-50 grayscale line-through' : ''}`}
                                    placeholder="Cat #"
                                    value={localInputState[getCatInputKey('lh', colIdx, i)] ?? value}
                                    onChange={e => handleCatInputChange('lh', colIdx, i, e.target.value)}
                                    onBlur={() => handleCatInputBlur('lh', colIdx, i)}
                                    onFocus={e => handleCatInputFocusLocal('lh', colIdx, i, value, e)}
                                    onKeyDown={e => handleCatInputKeyDownLocal('lh', colIdx, i, e, getRowIndexForSection(colIdx, col.specialty, 'lh', i))}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][getRowIndexForSection(colIdx, col.specialty, 'lh', i)] = el;
                                    }}
                                  />
                                </div>
                                  {error && (
                                    <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full">
                                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                      </svg>
                                      {error}
                                    </div>
                                  )}
                              </div>
                            ) : null}
                            </td>
                          );
                      })}
                    </tr>
                  ) : null
                ))}
                {/* Best SH PR Section (Allbreed and Shorthair) */}
                        {Array.from({ length: Math.max(...columns.map(col => (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`shpr-${i}`} className="cfa-table-row">
                      {/* Frozen position column: apply thick blue right border if first data column is focused */}
                      <td
                        className={`py-2 pl-4 font-medium text-sm bg-white frozen-column ${shouldApplyRingGlow(0) && focusedColumnIndex === 0 ? 'border-r-4 border-blue-300' : 'border-r border-gray-300'}`}
                        style={{ width: '140px', minWidth: '140px' }}
                      >
                        {getOrdinalLabel(i, 'SH')}
                      </td>
                      {columns.map((col, colIdx) => {
                        const isFocused = focusedColumnIndex === colIdx;
                        const shouldRenderCell = (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') && i < getFinalsPositionsForRingTypeLocal(col.specialty);
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.shPremiersFinals[key] || '';
                          const errorKey = `shPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                              <td key={`shpr-${i}-${colIdx}`} className={`py-2 px-2 align-top transition-all duration-150 whitespace-nowrap overflow-x-visible ${shouldApplyRingGlow(colIdx) ? 'border-l-4 border-r-4 border-blue-300 z-10' : 'border-r border-blue-200'} hover:bg-gray-50`}> 
                            {shouldRenderCell ? (
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-16 h-9 text-sm font-medium text-center rounded-md px-3 bg-white/60 border border-blue-200 shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${error ? 'cfa-input-error' : ''} ${isVoidInput(localInputState[getCatInputKey('sh', colIdx, i)] ?? value) ? 'opacity-50 grayscale line-through' : ''}`}
                                    placeholder="Cat #"
                                    value={localInputState[getCatInputKey('sh', colIdx, i)] ?? value}
                                    onChange={e => handleCatInputChange('sh', colIdx, i, e.target.value)}
                                    onBlur={() => handleCatInputBlur('sh', colIdx, i)}
                                    onFocus={e => handleCatInputFocusLocal('sh', colIdx, i, value, e)}
                                    onKeyDown={e => handleCatInputKeyDownLocal('sh', colIdx, i, e, getRowIndexForSection(colIdx, col.specialty, 'sh', i))}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][getRowIndexForSection(colIdx, col.specialty, 'sh', i)] = el;
                                    }}
                                  />
                                </div>
                                  {error && (
                                    <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-3 py-2 shadow text-xs text-red-700 font-semibold flex items-center gap-2 whitespace-normal break-words w-full">
                                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                      </svg>
                                      {error}
                                    </div>
                                  )}
                              </div>
                            ) : null}
                            </td>
                          );
                      })}
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Premium Action Buttons */}
        <ActionButtons
          onSaveToExcel={handleSaveToCSVClick}
          onLoadFromExcel={handleRestoreFromCSVClick}
          onReset={handleResetClick}
        />
      </div>
    </div>
  );
} 