import { useState, useRef, useEffect, useMemo } from 'react';
import { handleSaveToCSV } from '../utils/formActions';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import * as premiershipValidation from '../validation/premiershipValidation';
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

interface PremiershipTabProps {
  judges: Judge[];
  premiershipTotal: number;
  premiershipCounts: {
    gps: number;
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
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
  voidedShowAwards: { [key: string]: boolean };
  voidedPremiersFinals: { [key: string]: boolean };
  voidedABPremiersFinals: { [key: string]: boolean };
  voidedLHPremiersFinals: { [key: string]: boolean };
  voidedSHPremiersFinals: { [key: string]: boolean };
  errors: { [key: string]: string };
};

/**
 * PremiershipTab: Full UI and validation for CFA Premiership Finals
 * Closely mimics ChampionshipTab structure and logic
 * - Renders columns for each judge
 * - Premiership Final (Top 10/15): GP, PR, NOV allowed
 * - Best AB PR, Best LH PR, Best SH PR: Only PR allowed
 * - Dynamic row/section enable/disable based on ring type and breakpoints
 * - Voiding, duplicate, sequential entry logic
 * - Inline error messages per cell/row
 * - Shared action button handlers
 */

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
  const [numAwardRows] = useState(10);
  
  // State for validation errors and modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false); // NEW: Modal for CSV error
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
  // Local errors state (like ChampionshipTab)
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  // Memoize columns for consistent reference
  const columns: Column[] = useMemo(() => generateColumns(), [judges]);

  // --- Helper: Get finals/Best PR counts for a ring type ---
  const getFinalsCount = (ringType: string) => {
    if (ringType === 'Allbreed') {
      return premiershipCounts.gps + premiershipCounts.prs >= 50 ? 15 : 10;
    } else if (ringType === 'Longhair') {
      return premiershipCounts.lhGps + premiershipCounts.lhPrs >= 50 ? 15 : 10;
    } else if (ringType === 'Shorthair') {
      return premiershipCounts.shGps + premiershipCounts.shPrs >= 50 ? 15 : 10;
    }
    return 10; // Default fallback
  };
  const getFinalsPositionsForRingTypeLocal = (ringType: string) => {
    let count = 0;
    switch (ringType) {
      case 'Allbreed':
        count = premiershipCounts.gps + premiershipCounts.prs;
        break;
      case 'Longhair':
        count = premiershipCounts.lhGps + premiershipCounts.lhPrs;
        break;
      case 'Shorthair':
        count = premiershipCounts.shGps + premiershipCounts.shPrs;
        break;
      default:
        count = premiershipCounts.gps + premiershipCounts.prs;
        break;
    }
    return count >= 50 ? 3 : 2; // 3 positions if 15 awards, 2 if 10 awards
  };

  // Accessibility: refs for ALL Cat # input fields (Show Awards + Finals)
  // We'll build a 2D array: catInputRefs[columnIndex][verticalRowIndex]
  // Calculate total rows: Show Awards + Best AB PR + Best LH PR + Best SH PR
  const maxFinalsRows = Math.max(...columns.map(col => getFinalsPositionsForRingTypeLocal(col.specialty)));
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
      const lastRow = totalCatRows - 1;
      let nextCol = colIdx;
      let nextRow = rowIdx;
      let found = false;
      // Helper to check if input is enabled
      const isEnabled = (col: number, row: number) => {
        const ref = catInputRefs.current[col]?.[row];
        return ref && !ref.disabled;
      };
      if (!e.shiftKey) {
        // Tab: go down, then to next column
        let tries = 0;
        do {
          if (nextRow < lastRow) {
            nextRow++;
          } else {
            nextRow = 0;
            nextCol++;
            if (nextCol >= columns.length) return; // Let default tab if at very end
          }
          tries++;
          if (isEnabled(nextCol, nextRow)) {
            found = true;
            break;
          }
        } while (tries < columns.length * totalCatRows);
      } else {
        // Shift+Tab: go up, then to previous column
        let tries = 0;
        do {
          if (nextRow > 0) {
            nextRow--;
          } else {
            nextCol--;
            if (nextCol < 0) return; // Let default shift+tab if at very start
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

  // --- Premiership Data State ---
  // Each column = one judge/ring
  // Each section = Premiership Final, Best AB PR, Best LH PR, Best SH PR
  // Data is stored as: { [columnIndex_position]: { catNumber, status, voided } }

  // Add refs and state for parity with ChampionshipTab
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --- Test Data Generation Function ---
  // const fillTestData = useCallback(() => {
  //   // Commented out unused function
  // }, [columns, getFinalsCount, getFinalsPositionsForRingTypeLocal, showSuccess, setPremiershipTabData]);

  // --- Helper: Check if a cat number is voided anywhere in the column (all sections) ---
  const isCatNumberVoidedInColumn = (colIdx: number, catNumber: string): boolean => {
    if (!catNumber || !catNumber.trim()) return false;
    return (
      Object.keys(premiershipTabData.voidedShowAwards).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.showAwards[k]?.catNumber === catNumber && premiershipTabData.voidedShowAwards[k]) ||
      Object.keys(premiershipTabData.voidedABPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.abPremiersFinals[k] === catNumber && premiershipTabData.voidedABPremiersFinals[k]) ||
      Object.keys(premiershipTabData.voidedLHPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.lhPremiersFinals[k] === catNumber && premiershipTabData.voidedLHPremiersFinals[k]) ||
      Object.keys(premiershipTabData.voidedSHPremiersFinals).some(k => k.startsWith(`${colIdx}-`) && premiershipTabData.shPremiersFinals[k] === catNumber && premiershipTabData.voidedSHPremiersFinals[k])
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
      voidedShowAwards: {
        ...prev.voidedShowAwards,
        [key]: shouldBeVoided ? true : false
      }
      };
    });
  };

  // --- Handler: Update finals sections ---
  const updateFinals = (section: 'premiers' | 'ab' | 'lh' | 'sh', colIdx: number, pos: number, value: string) => {
    const key = `${colIdx}-${pos}`;
    let shouldBeVoided = false;
    if (value && value.trim() !== '') {
      shouldBeVoided = isCatNumberVoidedInColumn(colIdx, value);
    }
    // Set voided state for the correct section
    let voidedKey = '';
    if (section === 'ab') voidedKey = 'voidedABPremiersFinals';
    if (section === 'lh') voidedKey = 'voidedLHPremiersFinals';
    if (section === 'sh') voidedKey = 'voidedSHPremiersFinals';
    setPremiershipTabData((prev: any) => ({
      ...prev,
      ...(section === 'premiers' ? { premiersFinals: { ...prev.premiersFinals, [key]: value } } : {}),
      ...(section === 'ab' ? { abPremiersFinals: { ...prev.abPremiersFinals, [key]: value } } : {}),
      ...(section === 'lh' ? { lhPremiersFinals: { ...prev.lhPremiersFinals, [key]: value } } : {}),
      ...(section === 'sh' ? { shPremiersFinals: { ...prev.shPremiersFinals, [key]: value } } : {}),
      ...(voidedKey ? { [voidedKey]: { ...prev[voidedKey], [key]: shouldBeVoided ? true : false } } : {}),
    }));
  };

  // --- Handler: Blur events for show awards - run validation here (like ChampionshipTab) ---
  const handleShowAwardBlur = (colIdx: number, pos: number, field: 'catNumber' | 'status', value: string) => {
    const errorKey = `showAwards-${colIdx}-${pos}`;
    const input = createValidationInput();
    
    // Run basic validation for this input
    if (field === 'catNumber' && value.trim() !== '') {
      // Validate cat number format
      if (!premiershipValidation.validateCatNumber(value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450' }));
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
    
    // Run basic validation for this input
    if (value.trim() !== '') {
      // Validate cat number format
      if (!premiershipValidation.validateCatNumber(value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450' }));
        return;
      }
      // Sequential entry validation
      if (!premiershipValidation.validateSequentialEntry(input, section === 'ab' ? 'abPremiers' : section === 'lh' ? 'lhPremiers' : 'shPremiers', colIdx, pos, value)) {
        setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
        return;
      }
      // Full validation handles all checks including duplicates
      setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
    }
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
      novs: premiershipCounts.novs,
      prs: premiershipCounts.prs
    },
    voidedShowAwards: premiershipTabData.voidedShowAwards,
    voidedABPremiersFinals: premiershipTabData.voidedABPremiersFinals,
    voidedLHPremiersFinals: premiershipTabData.voidedLHPremiersFinals,
    voidedSHPremiersFinals: premiershipTabData.voidedSHPremiersFinals
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
    // Reset only Premiership tab data
    setPremiershipTabData((prev: any) => ({
      ...prev,
      showAwards: {},
      premiersFinals: {},
      abPremiersFinals: {},
      lhPremiersFinals: {},
      shPremiersFinals: {},
      voidedShowAwards: {},
      voidedABPremiersFinals: {},
      voidedLHPremiersFinals: {},
      voidedSHPremiersFinals: {}
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

  // Add getVoidState for parity
  const getVoidState = (section: string, colIdx: number, pos: number): boolean => {
    const key = `${colIdx}-${pos}`;
    if (section === 'showAwards') return premiershipTabData.voidedShowAwards[key] || false;
    if (section === 'premiers') return premiershipTabData.voidedPremiersFinals[key] || false;
    if (section === 'ab') return premiershipTabData.voidedABPremiersFinals[key] || false;
    if (section === 'lh') return premiershipTabData.voidedLHPremiersFinals[key] || false;
    if (section === 'sh') return premiershipTabData.voidedSHPremiersFinals[key] || false;
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
      voidedShowAwards: {
        ...prev.voidedShowAwards,
        ...Object.fromEntries(matchingShowAwards.map(key => [key, voided]))
      },
      voidedABPremiersFinals: {
        ...prev.voidedABPremiersFinals,
        ...Object.fromEntries(matchingAB.map(key => [key, voided]))
      },
      voidedLHPremiersFinals: {
        ...prev.voidedLHPremiersFinals,
        ...Object.fromEntries(matchingLH.map(key => [key, voided]))
      },
      voidedSHPremiersFinals: {
        ...prev.voidedSHPremiersFinals,
        ...Object.fromEntries(matchingSH.map(key => [key, voided]))
      }
    }));
  };

  useEffect(() => {
    setErrors(premiershipValidation.validatePremiershipTab(createValidationInput()));
  }, [premiershipTabData.showAwards, premiershipTabData.abPremiersFinals, premiershipTabData.lhPremiersFinals, premiershipTabData.shPremiersFinals]);

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
        {/* Sticky header and dropdown - match ChampionshipTab layout */}
        <div className="sticky top-0 z-30 bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4">
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
            className="w-[220px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-blue-200 shadow-md hover:shadow-lg focus:border-blue-400 focus:shadow-lg text-blue-700 transition-all duration-200"
            ariaLabel="Jump to Ring"
            selectedIcon="🎗️"
            dropdownMenuClassName="w-[220px] rounded-xl bg-gradient-to-b from-white via-blue-50 to-white shadow-xl border-2 border-blue-200 text-base font-semibold text-blue-800 transition-all duration-200"
            highlightBg="bg-blue-50"
            highlightText="text-blue-900"
            selectedBg="bg-blue-100"
            selectedText="text-blue-800"
            hoverBg="bg-blue-50"
            hoverText="text-blue-900"
          />
        </div>
        {/* Table scroll container with sticky header */}
        <div className="relative">
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
                      <span className="header-main block">Position</span>
                      <span className="header-sub block">Placement</span>
                    </div>
                  </th>
                  {columns.map((column, index) => (
                    <th
                      key={`header-modern-${index}`}
                      id={`ring-th-${index}`}
                      className={`cfa-table-header-cell-modern text-center align-bottom`}
                      style={{ width: 190, minWidth: 190, maxWidth: 190, verticalAlign: 'top', borderTopRightRadius: 0, margin: 0, padding: 0 }}
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
                {/* Premiership Final Section (Top 10/15) */}
                {Array.from({ length: maxFinalRows }, (_, i) => (
                  columns.some(col => i < getFinalsCount(col.specialty)) ? (
                    <tr key={`final-${i}`} className="cfa-table-row">
                      <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                        {i + 1}{i >= 10 ? '*' : ''}
                      </td>
                      {columns.map((col, colIdx) => {
                        if (i < getFinalsCount(col.specialty)) {
                          const cell = premiershipTabData.showAwards[`${colIdx}-${i}`] || { catNumber: '', status: 'GP' };
                          const voided = getVoidState('showAwards', colIdx, i);
                          const error = errors[`${colIdx}-${i}`];
                          return (
                            <td key={`final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    data-testid={colIdx === 0 && i === 0 ? 'first-cat-input' : undefined}
                                    type="text"
                                    className={`w-10 h-7 text-xs text-center border rounded px-0.5 ${error ? 'cfa-input-error' : ''} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                    placeholder="Cat #"
                                    value={cell.catNumber ?? ''}
                                    onChange={e => updateShowAward(colIdx, i, 'catNumber', e.target.value)}
                                    onBlur={e => handleShowAwardBlur(colIdx, i, 'catNumber', e.target.value)}
                                    onFocus={e => handleCatInputFocus(e, colIdx)}
                                    onKeyDown={e => handleCatInputKeyDown(e, colIdx, i)}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][i] = el;
                                    }}
                                    maxLength={6}
                                    disabled={voided}
                                  />
                                  <select
                                    className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${error ? 'cfa-input-error' : ''} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                    value={cell.status || 'GP'}
                                    onChange={e => {
                                      updateShowAward(colIdx, i, 'status', e.target.value);
                                    }}
                                    disabled={voided}
                                  >
                                    <option value="GP">GP</option>
                                    <option value="PR">PR</option>
                                    <option value="NOV">NOV</option>
                                  </select>
                                  {/* Only show void checkbox if Cat # is non-empty */}
                                  {cell.catNumber && (
                                    <input
                                      type="checkbox"
                                      className="void-checkbox"
                                      checked={voided}
                                      onChange={e => updateVoidStateColumnWide('showAwards', colIdx, i, e.target.checked)}
                                      disabled={!cell.catNumber}
                                    />
                                  )}
                                </div>
                                {error && <div className="text-xs mt-1 text-red-600">{error}</div>}
                              </div>
                            </td>
                          );
                        } else {
                          return <td key={`final-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                        }
                      })}
                    </tr>
                  ) : null
                ))}
                {/* Best AB PR Section (Allbreed only) */}
                        {Array.from({ length: Math.max(...columns.map(col => col.specialty === 'Allbreed' ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => col.specialty === 'Allbreed' && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`abpr-${i}`} className="cfa-table-row">
                      <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                        {getOrdinalLabel(i, 'AB')}
                      </td>
                      {columns.map((col, colIdx) => {
                        if (col.specialty === 'Allbreed' && i < getFinalsPositionsForRingTypeLocal(col.specialty)) {
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.abPremiersFinals[key] || '';
                          const voided = getVoidState('ab', colIdx, i);
                          const errorKey = `abPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                            <td key={`abpr-${i}-${colIdx}-${error || ''}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${error ? 'cfa-input-error' : ''} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                    placeholder="Cat #"
                                    value={value ?? ''}
                                    onChange={e => updateFinals('ab', colIdx, i, e.target.value)}
                                    onBlur={e => handleFinalsBlur('ab', colIdx, i, e.target.value)}
                                    disabled={voided}
                                    onFocus={e => handleCatInputFocus(e, colIdx)}
                                    onKeyDown={e => handleCatInputKeyDown(e, colIdx, numAwardRows + i)}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][numAwardRows + i] = el;
                                    }}
                                  />
                                  {value && (
                                    <input
                                      type="checkbox"
                                      className="void-checkbox"
                                      checked={voided}
                                      onChange={e => updateVoidStateColumnWide('ab', colIdx, i, e.target.checked)}
                                      disabled={!value}
                                    />
                                  )}
                                </div>
                                {error && <div className="text-xs mt-1 text-red-600">{error}</div>}
                              </div>
                            </td>
                          );
                        } else {
                          return <td key={`abpr-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                        }
                      })}
                    </tr>
                  ) : null
                ))}
                {/* Best LH PR Section (Allbreed and Longhair) */}
                        {Array.from({ length: Math.max(...columns.map(col => (col.specialty === 'Allbreed' || col.specialty === 'Longhair') ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => (col.specialty === 'Allbreed' || col.specialty === 'Longhair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`lhpr-${i}`} className="cfa-table-row">
                      <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                        {getOrdinalLabel(i, 'LH')}
                      </td>
                      {columns.map((col, colIdx) => {
                        if ((col.specialty === 'Allbreed' || col.specialty === 'Longhair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) {
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.lhPremiersFinals[key] || '';
                          const voided = getVoidState('lh', colIdx, i);
                          const errorKey = `lhPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                            <td key={`lhpr-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${error ? 'cfa-input-error' : ''} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                    placeholder="Cat #"
                                    value={value ?? ''}
                                    onChange={e => updateFinals('lh', colIdx, i, e.target.value)}
                                    onBlur={e => handleFinalsBlur('lh', colIdx, i, e.target.value)}
                                    disabled={voided}
                                    onFocus={e => handleCatInputFocus(e, colIdx)}
                                    onKeyDown={e => handleCatInputKeyDown(e, colIdx, numAwardRows + maxFinalsRows + i)}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][numAwardRows + maxFinalsRows + i] = el;
                                    }}
                                  />
                                  {value && (
                                    <input
                                      type="checkbox"
                                      className="void-checkbox"
                                      checked={voided}
                                      onChange={e => updateVoidStateColumnWide('lh', colIdx, i, e.target.checked)}
                                      disabled={!value}
                                    />
                                  )}
                                </div>
                                {error && <div className="text-xs mt-1 text-red-600">{error}</div>}
                              </div>
                            </td>
                          );
                        } else {
                          return <td key={`lhpr-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                        }
                      })}
                    </tr>
                  ) : null
                ))}
                {/* Best SH PR Section (Allbreed and Shorthair) */}
                        {Array.from({ length: Math.max(...columns.map(col => (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') ? getFinalsPositionsForRingTypeLocal(col.specialty) : 0)) }, (_, i) => (
          columns.some(col => (col.specialty === 'Allbreed' || col.specialty === 'Shorthair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) ? (
                    <tr key={`shpr-${i}`} className="cfa-table-row">
                      <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                        {getOrdinalLabel(i, 'SH')}
                      </td>
                      {columns.map((col, colIdx) => {
                        if ((col.specialty === 'Allbreed' || col.specialty === 'Shorthair') && i < getFinalsPositionsForRingTypeLocal(col.specialty)) {
                          const key = `${colIdx}-${i}`;
                          const value = premiershipTabData.shPremiersFinals[key] || '';
                          const voided = getVoidState('sh', colIdx, i);
                          const errorKey = `shPremiersFinals-${colIdx}-${i}`;
                          const error = errors[errorKey];
                          return (
                            <td key={`shpr-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>
                              <div className="flex flex-col items-start">
                                <div className="flex gap-1 items-center">
                                  <input
                                    type="text"
                                    className={`w-14 h-7 text-xs text-center border rounded px-0.5 ${error ? 'cfa-input-error' : ''} ${voided ? 'voided-input' : ''} focus:outline-none focus:border-cfa-gold`}
                                    placeholder="Cat #"
                                    value={value ?? ''}
                                    onChange={e => updateFinals('sh', colIdx, i, e.target.value)}
                                    onBlur={e => handleFinalsBlur('sh', colIdx, i, e.target.value)}
                                    disabled={voided}
                                    onFocus={e => handleCatInputFocus(e, colIdx)}
                                    onKeyDown={e => handleCatInputKeyDown(e, colIdx, numAwardRows + maxFinalsRows + maxFinalsRows + i)}
                                    ref={el => {
                                      if (!catInputRefs.current[colIdx]) catInputRefs.current[colIdx] = [];
                                      catInputRefs.current[colIdx][numAwardRows + maxFinalsRows + maxFinalsRows + i] = el;
                                    }}
                                  />
                                  {value && (
                                    <input
                                      type="checkbox"
                                      className="void-checkbox"
                                      checked={voided}
                                      onChange={e => updateVoidStateColumnWide('sh', colIdx, i, e.target.checked)}
                                      disabled={!value}
                                    />
                                  )}
                                </div>
                                {error && <div className="text-xs mt-1 text-red-600">{error}</div>}
                              </div>
                            </td>
                          );
                        } else {
                          return <td key={`shpr-${i}-${colIdx}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(colIdx) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                        }
                      })}
                    </tr>
                  ) : null
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
        />
      </div>
    </div>
  );
} 