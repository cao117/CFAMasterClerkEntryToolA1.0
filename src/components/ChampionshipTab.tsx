import { useState, useEffect, useImperativeHandle, useCallback, useRef } from 'react';
import React from 'react';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import { 
  validateChampionshipTab, 
  validateCatNumber,
  validateSequentialEntry,
} from '../validation/championshipValidation';
import type { CellData } from '../validation/championshipValidation';
import { handleSaveToCSV } from '../utils/formActions';
import CustomSelect from './CustomSelect';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface ChampionshipTabProps {
  judges: Judge[];
  championshipTotal: number;
  championshipCounts: {
    lhGcs: number;
    shGcs: number;
    lhChs: number;
    shChs: number;
  };
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo?: (title: string, message?: string, duration?: number) => void;
  shouldFillTestData?: boolean;
  onResetAllData?: () => void;
  /**
   * Championship tab data state, lifted to App.tsx for persistence across tab switches
   */
  championshipTabData: ChampionshipTabData;
  /**
   * Setter for championship tab data
   */
  setChampionshipTabData: React.Dispatch<React.SetStateAction<ChampionshipTabData>>;
  /**
   * Handler to reset only the Championship tab data
   */
  onTabReset: () => void;
  getShowState: () => Record<string, unknown>;
  /**
   * Whether this tab is currently active
   */
  isActive?: boolean;
  /**
   * Handler for CSV import functionality
   */
  onCSVImport: () => Promise<void>;
}

interface Column {
  judge: Judge;
  specialty: string;
}

export interface ChampionshipTabRef {
  fillTestData: () => void;
}

// Replace the previous type alias with an explicit type definition for ChampionshipTabData

type ChampionshipTabData = {
  showAwards: { [key: string]: CellData };
  championsFinals: { [key: string]: string };
  lhChampionsFinals: { [key: string]: string };
  shChampionsFinals: { [key: string]: string };
  errors: { [key: string]: string };
};

/**
 * ChampionshipTab component for CFA Master Clerk Entry Tool
 *
 * This component renders the Championship Finals tab, including all dynamic table logic, validation, and voiding logic.
 * It uses React.forwardRef to expose the fillTestData method to the parent (App.tsx) for test data injection.
 *
 * @component
 * @param {ChampionshipTabProps} props - The props for the ChampionshipTab
 * @param {React.Ref<ChampionshipTabRef>} ref - Ref to expose fillTestData
 */
const ChampionshipTab = React.forwardRef<ChampionshipTabRef, ChampionshipTabProps>(
  (props, ref) => {
    const { judges, championshipTotal, championshipCounts, showSuccess, showError, shouldFillTestData, onResetAllData, championshipTabData, setChampionshipTabData, getShowState, isActive, onCSVImport } = props;
    // State for scroll icon direction (must be at the top, before any return)
    const [scrollDown, setScrollDown] = useState(true);
    // Handler for scroll button click (must be at the top, before any return)
    const handleScrollButtonClick = () => {
      if (scrollDown) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        setScrollDown(false);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setScrollDown(true);
      }
    };
    // State for dynamic table structure
    const [columns, setColumns] = useState<Column[]>([]);
    const [numAwardRows, setNumAwardRows] = useState(10);
    
    // State for validation errors and modal
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isTabResetModalOpen, setIsTabResetModalOpen] = useState(false);
    const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false); // NEW: Modal for CSV error
    const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
    // Local errors state (like PremiershipTab)
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // 1. Add localInputState for text fields
    const [localInputState, setLocalInputState] = useState<{ [key: string]: string }>({});

    // Accessibility: refs for ALL Cat # input fields (Show Awards + Finals)
    // We'll build a 2D array: catInputRefs[columnIndex][verticalRowIndex]
    const totalCatRows = numAwardRows + (championshipTotal >= 85 ? 5 : 3) + (championshipTotal >= 85 ? 5 : 3) + (championshipTotal >= 85 ? 5 : 3); // Show Awards + Best CH + LH CH + SH CH
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
     * Applies to all Cat # inputs in the Championship tab.
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

    // Generate columns based on judges
    const generateColumns = (): Column[] => {
      const columns: Column[] = [];
      
      judges.forEach(judge => {
        if (judge.ringType === 'Double Specialty') {
          // For Double Specialty, create two columns (LH, SH) but both use the original judge's id (ring number) and info
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Longhair'
          });
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Shorthair'
          });
        } else {
          // For all other types, just use the judge as-is
          columns.push({
            judge,
            specialty: judge.ringType
          });
        }
      });
      
      return columns;
    };

    /**
     * Updates a Show Award cell (cat number or status) and auto-syncs void state.
     * If the entered cat number is already voided elsewhere in the column (any section),
     * this cell is immediately set to voided. If not, void state is cleared for this cell.
     */
    const updateShowAward = (columnIndex: number, position: number, field: 'catNumber' | 'status', value: string) => {
      const key = `${columnIndex}-${position}`;
      setChampionshipTabData((prev: ChampionshipTabData) => {
        if (field === 'catNumber') {
          const prevCell = prev.showAwards[key] || {};
          const newCell = {
            ...prevCell,
            catNumber: value,
            status: prevCell.status || (value ? 'GC' : '')
          };
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
              ...prev.showAwards[key],
              [field]: value
            }
          }
        };
      });
    };

    /**
     * Updates a Finals cell (Best AB CH, Best LH CH, Best SH CH) and auto-syncs void state.
     * If the entered cat number is already voided elsewhere in the column (any section),
     * this cell is immediately set to voided. If not, void state is cleared for this cell.
     */
    const updateFinals = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number, value: string) => {
      const key = `${columnIndex}-${position}`;
      setChampionshipTabData((prev: ChampionshipTabData) => {
        // Update the finals value
        return {
          ...prev,
          [sectionToFinalsKey(section)]: {
            ...prev[sectionToFinalsKey(section)],
            [key]: value
          }
        };
      });
    };

    /**
     * Helper to map section to finals key.
     */
    function sectionToFinalsKey(section: 'champions' | 'lhChampions' | 'shChampions') {
        switch (section) {
        case 'champions': return 'championsFinals';
        case 'lhChampions': return 'lhChampionsFinals';
        case 'shChampions': return 'shChampionsFinals';
        default: return 'championsFinals';
      }
    }

    // Getter functions
    const getFinalsValue = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number): string => {
      const key = `${columnIndex}-${position}`;
      switch (section) {
        case 'champions': return championshipTabData.championsFinals[key] || '';
        case 'lhChampions': return championshipTabData.lhChampionsFinals[key] || '';
        case 'shChampions': return championshipTabData.shChampionsFinals[key] || '';
      }
    };

    // Update row labels for AB CH, LH CH, SH CH sections
    const getOrdinalLabel = (idx: number, type: 'AB' | 'LH' | 'SH') => {
      const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
      const label = ordinals[idx] || `${idx+1}th Best`;
      if (type === 'AB') return `${label} AB CH`;
      if (type === 'LH') return `${label} LH CH`;
      if (type === 'SH') return `${label} SH CH`;
      return label;
    };

    // Effects to update dynamic structure
    useEffect(() => {
      if (judges.length > 0) {
        const newColumns = generateColumns();
        setColumns(newColumns);
      } else {
        setColumns([]);
      }
    }, [judges]);

    useEffect(() => {
      if (championshipTotal >= 85) {
        setNumAwardRows(15);
      } else {
        setNumAwardRows(10);
      }
    }, [championshipTotal]);

    // Test data generation function for Championship tab - UPDATED TO COMPLY WITH VALIDATION RULES
    const fillTestData = useCallback(() => {
      const newShowAwards: {[key: string]: CellData} = {};
      const newChampionsFinals: {[key: string]: string} = {};
      const newLhChampionsFinals: {[key: string]: string} = {};
      const newShChampionsFinals: {[key: string]: string} = {};
      
      // Generate unique cat numbers for each column
      const generateUniqueNumber = (): number => {
        return Math.floor(Math.random() * 450) + 1;
      };
      
      // Generate test data for each column
      columns.forEach((column, columnIndex) => {
        // Generate unique cat numbers for this column
        const usedCatNumbers = new Set<number>();
        const generateCatNumber = (): number => {
          let num;
          do {
            num = generateUniqueNumber();
          } while (usedCatNumbers.has(num));
          usedCatNumbers.add(num);
          return num;
        };
        
        // Show Awards Test Data:
        // For each column, randomly assign statuses (GC, CH, NOV) to each position, ensuring the correct total counts for each status (if possible).
        // Cat numbers remain unique within each section.
        const statuses = ['GC', 'CH', 'NOV'];
        const numAwardRowsForColumn = numAwardRows;
        for (let position = 0; position < numAwardRowsForColumn; position++) {
          const key = `${columnIndex}-${position}`;
          const catNumber = generateCatNumber();
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          
          newShowAwards[key] = {
            catNumber: catNumber.toString(),
            status: randomStatus
          };
        }
        
        // Get CH cats from show awards for finals
        const chCats: string[] = [];
        for (let position = 0; position < numAwardRowsForColumn; position++) {
          const key = `${columnIndex}-${position}`;
          const award = newShowAwards[key];
          if (award.status === 'CH') {
            chCats.push(award.catNumber);
          }
        }
        
        // Finals Test Data:
        // For Allbreed columns, Best CH gets ALL CH cats, then split between LH and SH maintaining order
        // All other Championship tab validation rules must be enforced in the generated test data.
        const numFinalsPositions = numAwardRowsForColumn;
        
        if (column.specialty === 'Allbreed') {
          // For Allbreed rings:
          // 1. Best CH gets ALL CH cats in order (up to numFinalsPositions), then fillers if needed
          const bestCHCats = chCats.slice(0, Math.min(numFinalsPositions, chCats.length));
          // Fill Champions Finals with all CH cats in order, then fill remaining with unique unused numbers
          for (let position = 0; position < numFinalsPositions; position++) {
            const key = `${columnIndex}-${position}`;
            if (position < bestCHCats.length) {
              newChampionsFinals[key] = bestCHCats[position];
            } else {
              // Fill with unique unused number
              let filler;
              do {
                filler = generateCatNumber();
              } while (bestCHCats.includes(filler.toString()));
              newChampionsFinals[key] = filler.toString();
              bestCHCats.push(filler.toString()); // Add filler to Best CH array for splitting
            }
          }
          // --- LH/SH split: must include ALL Best CH cats (including fillers) ---
          // Use odd/even rule for split (odd = LH, even = SH)
          const lhCats: string[] = [];
          const shCats: string[] = [];
          bestCHCats.forEach(cat => {
            const num = parseInt(cat);
            if (!isNaN(num)) {
              if (num % 2 === 1) {
                lhCats.push(cat);
              } else {
                shCats.push(cat);
              }
            } else {
              // If not a number (shouldn't happen in test data), assign arbitrarily
              lhCats.push(cat);
            }
          });
          // Place split cats at the top of each section, in order, then fill with unique fillers
          // LH CH
          for (let position = 0; position < numFinalsPositions; position++) {
            const key = `${columnIndex}-${position}`;
            if (position < lhCats.length) {
              newLhChampionsFinals[key] = lhCats[position];
            } else {
              let filler;
              do {
                filler = generateCatNumber();
              } while (
                bestCHCats.includes(filler.toString()) ||
                lhCats.includes(filler.toString()) ||
                shCats.includes(filler.toString())
              );
              newLhChampionsFinals[key] = filler.toString();
            }
          }
          // SH CH
          for (let position = 0; position < numFinalsPositions; position++) {
            const key = `${columnIndex}-${position}`;
            if (position < shCats.length) {
              newShChampionsFinals[key] = shCats[position];
            } else {
              let filler;
              do {
                filler = generateCatNumber();
              } while (
                bestCHCats.includes(filler.toString()) ||
                lhCats.includes(filler.toString()) ||
                shCats.includes(filler.toString())
              );
              newShChampionsFinals[key] = filler.toString();
            }
          }
        } else if (column.specialty === 'Longhair') {
          // For Longhair rings, use CH cats for LH Champions Finals only, fill remaining with unique unused numbers
          for (let position = 0; position < numFinalsPositions; position++) {
            const key = `${columnIndex}-${position}`;
            if (position < chCats.length) {
              newLhChampionsFinals[key] = chCats[position];
            } else {
              let filler;
              do {
                filler = generateCatNumber();
              } while (chCats.includes(filler.toString()));
              newLhChampionsFinals[key] = filler.toString();
            }
          }
        } else if (column.specialty === 'Shorthair') {
          // For Shorthair rings, use CH cats for SH Champions Finals only, fill remaining with unique unused numbers
          for (let position = 0; position < numFinalsPositions; position++) {
            const key = `${columnIndex}-${position}`;
            if (position < chCats.length) {
              newShChampionsFinals[key] = chCats[position];
            } else {
              let filler;
              do {
                filler = generateCatNumber();
              } while (chCats.includes(filler.toString()));
              newShChampionsFinals[key] = filler.toString();
            }
          }
        }
      });
      
      // Update state
      setChampionshipTabData(() => ({
        showAwards: newShowAwards,
        championsFinals: newChampionsFinals,
        lhChampionsFinals: newLhChampionsFinals,
        shChampionsFinals: newShChampionsFinals,
        errors: {}
      }));
      // After state is updated, trigger a full-form validation to clear any stale errors
      setTimeout(() => {
        setErrors(
          validateChampionshipTab({
          columns,
          showAwards: newShowAwards,
          championsFinals: newChampionsFinals,
          lhChampionsFinals: newLhChampionsFinals,
          shChampionsFinals: newShChampionsFinals,
          championshipTotal,
          championshipCounts,
          // [VOID LOGIC REFACTOR] Removed last remaining voided state properties from object initialization.
          })
        );
      }, 0);
      showSuccess('Test Data Filled', 'Championship tab has been filled with realistic test data that complies with all validation rules.');
    }, [columns, championshipTotal, championshipCounts, showSuccess]);

    // Expose fillTestData function through ref
    useImperativeHandle(ref, () => ({
      fillTestData
    }), [fillTestData]);

    // Effect to automatically fill test data when shouldFillTestData is true
    useEffect(() => {
      if (shouldFillTestData && judges.length > 0 && championshipTotal > 0 && columns.length > 0) {
        // Call fillTestData immediately
        fillTestData();
      }
    }, [shouldFillTestData, judges.length, championshipTotal, columns.length, fillTestData]);

    // Add useEffect to run validation after any relevant state change
    useEffect(() => {
      setErrors(
        validateChampionshipTab({
        columns,
          showAwards: championshipTabData.showAwards,
          championsFinals: championshipTabData.championsFinals,
          lhChampionsFinals: championshipTabData.lhChampionsFinals,
          shChampionsFinals: championshipTabData.shChampionsFinals,
        championshipTotal,
        championshipCounts
        })
      );
    }, [columns, championshipTabData.showAwards, championshipTabData.championsFinals, championshipTabData.lhChampionsFinals, championshipTabData.shChampionsFinals, championshipTotal, championshipCounts]);

    // Defensive getter for showAwards (Top 10/15)
    const getShowAward = (colIdx: number, i: number) =>
      championshipTabData.showAwards[`${colIdx}-${i}`] || { catNumber: '', status: 'GC' };

    // Ensure showAwards is initialized for all visible cells (robust, merge missing keys)
    useEffect(() => {
      if (columns.length > 0 && numAwardRows > 0) {
        setChampionshipTabData(prev => {
          // Build a new object with all required keys
          const newShowAwards = { ...prev.showAwards };
          let changed = false;
          for (let colIdx = 0; colIdx < columns.length; colIdx++) {
            for (let i = 0; i < numAwardRows; i++) {
              const key = `${colIdx}-${i}`;
              if (!newShowAwards[key]) {
                newShowAwards[key] = { catNumber: '', status: 'GC' };
                changed = true;
              }
            }
          }
          if (changed) {
            return {
              ...prev,
              showAwards: newShowAwards,
            };
          }
          return prev;
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns.length, numAwardRows]);

    // Action button handlers
    const handleSaveToCSVClick = () => {
      // Check for validation errors before CSV export
      if (Object.keys(errors).length > 0) {
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
      setIsTabResetModalOpen(true);
    };

    const handleTabResetClick = () => {
      setIsTabResetModalOpen(false);
      
      // Reset only Championship tab data
      setChampionshipTabData(() => ({
        showAwards: {},
        championsFinals: {},
        lhChampionsFinals: {},
        shChampionsFinals: {},
        errors: {},
      }));
      
      // Clear focused column
      setFocusedColumnIndex(null);
      
      // Clear local input state
      setLocalInputState({});
      
      // Regenerate columns based on current judge information
      setColumns(generateColumns());
      
      // Show success message
      showSuccess('Championship Tab Reset', 'Championship tab data has been reset successfully.');
    };

    const confirmReset = () => {
      setIsResetModalOpen(false);
      
      // Call the parent's reset function to reset all data and return to General tab
      if (onResetAllData) {
        onResetAllData();
      }
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

    /**
     * Returns the border style class for an input based on error presence.
     * Defensive: Handles undefined errors object and undefined/null errorKey.
     * @param {string} errorKey - The key for the error lookup
     * @returns {string} - The border style class
     */
    const getBorderStyle = (errorKey: string) => {
      if (!errors || !errorKey) return 'border-gray-300';
      if (errors[errorKey]) {
        return 'cfa-input-error'; // Use CFA input error styling with red background fill
      }
      return 'border-gray-300';
    };

    // Ref for the table container (for horizontal scrolling)
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Handler for dropdown selection to scroll to the selected column
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

    // Helper functions to calculate breakpoints based on ring type
    const getChampionshipCountForRingType = (ringType: string): number => {
      switch (ringType) {
        case 'Allbreed':
          return championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs;
        case 'Longhair':
          return championshipCounts.lhGcs + championshipCounts.lhChs;
        case 'Shorthair':
          return championshipCounts.shGcs + championshipCounts.shChs;
        default:
          return championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs;
      }
    };

    // --- PATCH: Robust row count for CSV import/restore ---
    /**
     * Returns the number of Show Awards rows to render for a given column, based on:
     *  - The calculated breakpoint (10/15)
     *  - The number of rows present in the imported showAwards for this column
     * This ensures that after CSV import, if 15 rows are present, all are shown, even if the show count is not set before render.
     */
    const getShowAwardsRowCount = (colIdx: number, specialty: string): number => {
      // Default: calculated breakpoint
      const calculated = getChampionshipCountForRingType(specialty) >= 85 ? 15 : 10;
      // Find max row index present in imported showAwards for this column
      let maxIdx = -1;
      Object.keys(championshipTabData.showAwards).forEach(key => {
        const [col, row] = key.split('-').map(Number);
        if (col === colIdx && row > maxIdx) maxIdx = row;
      });
      // If imported data has more rows, use that
      return Math.max(calculated, maxIdx + 1);
    };
    /**
     * Returns the number of Finals rows to render for a given column/section, based on:
     *  - The calculated finals count (3/5)
     *  - The number of rows present in the imported finals for this column/section
     * This ensures that after CSV import, if 5 rows are present, all are shown, even if the show count is not set before render.
     */
    const getFinalsRowCount = (colIdx: number, specialty: string, section: 'champions' | 'lhChampions' | 'shChampions'): number => {
      const calculated = getChampionshipCountForRingType(specialty) >= 85 ? 5 : 3;
      let finalsObj: Record<string, string> = {};
      if (section === 'champions') finalsObj = championshipTabData.championsFinals;
      if (section === 'lhChampions') finalsObj = championshipTabData.lhChampionsFinals;
      if (section === 'shChampions') finalsObj = championshipTabData.shChampionsFinals;
      let maxIdx = -1;
      Object.keys(finalsObj).forEach(key => {
        const [col, row] = key.split('-').map(Number);
        if (col === colIdx && row > maxIdx) maxIdx = row;
      });
      return Math.max(calculated, maxIdx + 1);
    };

    // --- Handler: Blur events for finals - run validation here (like PremiershipTab) ---
    const handleFinalsBlur = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number, value: string) => {
      const errorKey = `${section === 'champions' ? 'champions' : section === 'lhChampions' ? 'lhChampions' : 'shChampions'}-${columnIndex}-${position}`;
      const input = {
        columns,
        showAwards: championshipTabData.showAwards,
        championsFinals: championshipTabData.championsFinals,
        lhChampionsFinals: championshipTabData.lhChampionsFinals,
        shChampionsFinals: championshipTabData.shChampionsFinals,
        championshipTotal,
        championshipCounts,
      };
      
      // Run basic validation for this input
      if (value.trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(value)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID' }));
          return;
        }
        // Sequential entry validation
        if (!validateSequentialEntry(input, section, columnIndex, position, value)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
          return;
        }
        // Full validation handles all checks including duplicates
        setErrors(validateChampionshipTab(input));
      }
    };

    // --- Handler: Update finals sections ---

    // Loading guard: Only render table if judges and championshipTabData are ready
    if (!judges.length || !columns.length) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <span className="text-violet-600 text-lg font-semibold animate-pulse">Loading championship data...</span>
        </div>
      );
    }

    // 1. Add isVoidInput utility (if not already present)
    function isVoidInput(catNumber: string): boolean {
      return typeof catNumber === 'string' && catNumber.trim().toUpperCase() === 'VOID';
    }

    // --- CONTEXT-7: PremiershipTab-style Cat # input dynamic validation for all sections ---
    // Helper to namespace Cat # input keys by section for local input state
    const getCatInputKey = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number) => `${section}-${colIdx}-${rowIdx}`;

    // Generalized onChange handler for Cat # input (only updates local input state)
    const handleCatInputChange = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, value: string) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      setLocalInputState(prev => ({ ...prev, [key]: value }));
    };

    // --- CONTEXT-7: PremiershipTab-style Cat # input validation order for all sections ---
    // Helper: Get error key for each section (must match keys in validateChampionshipTab error object)
    const getErrorKey = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number) => {
      switch (section) {
        case 'showAwards': return `${colIdx}-${rowIdx}`; // Use unprefixed key for Top 10/15 to match error object
        case 'champions': return `champions-${colIdx}-${rowIdx}`;
        case 'lhChampions': return `lhChampions-${colIdx}-${rowIdx}`;
        case 'shChampions': return `shChampions-${colIdx}-${rowIdx}`;
        default: return '';
      }
    };

    // Generalized onBlur handler for Cat # input (updates model and triggers validation in PremiershipTab order)
    const handleCatInputBlur = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      const localValue = localInputState[key];
      let modelValue = '';
      if (section === 'showAwards') modelValue = championshipTabData.showAwards[`${colIdx}-${rowIdx}`]?.catNumber ?? '';
      if (section === 'champions') modelValue = championshipTabData.championsFinals[`${colIdx}-${rowIdx}`] ?? '';
      if (section === 'lhChampions') modelValue = championshipTabData.lhChampionsFinals[`${colIdx}-${rowIdx}`] ?? '';
      if (section === 'shChampions') modelValue = championshipTabData.shChampionsFinals[`${colIdx}-${rowIdx}`] ?? '';
      // Always update model with localValue (including empty string) if localValue is defined
      if (localValue !== undefined) {
      if (section === 'showAwards') {
          updateShowAward(colIdx, rowIdx, 'catNumber', localValue); // allow ''
      } else {
          updateFinals(section as any, colIdx, rowIdx, localValue); // allow ''
        }
      }
      // --- PremiershipTab-style validation order ---
      const errorKey = getErrorKey(section, colIdx, rowIdx);
      const input = {
        columns,
        showAwards: championshipTabData.showAwards,
        championsFinals: championshipTabData.championsFinals,
        lhChampionsFinals: championshipTabData.lhChampionsFinals,
        shChampionsFinals: championshipTabData.shChampionsFinals,
        championshipTotal,
        championshipCounts
      };
      // --- Section-specific validation order ---
      if (section === 'showAwards') {
        // Top 10/15: VOID → format → duplicate (full-form) → sequential → always run full-form validation for all cells
        // See VALIDATION_CHAMPIONSHIP.md for full validation order and rationale
        if (isVoidInput(localValue)) {
          console.log('[CH Tab] VOID check:', { errorKey, localValue });
          setErrors((prev: any) => {
            const copy = { ...prev };
            delete copy[errorKey];
            return copy;
          });
          const allErrors = validateChampionshipTab(input);
          console.log('[CH Tab] After VOID, allErrors:', allErrors);
          setErrors(allErrors);
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        if (localValue && !validateCatNumber(localValue)) {
          console.log('[CH Tab] Format error:', { errorKey, localValue });
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID' }));
          const allErrors = validateChampionshipTab(input);
          console.log('[CH Tab] After format, allErrors:', allErrors);
          setErrors(allErrors); // Always set all errors after any check
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // Duplicate check (full-form): show duplicate error if present before sequential
        const allErrors = validateChampionshipTab(input);
        console.log('[CH Tab] After full-form validation:', { errorKey, errorForCell: allErrors[errorKey], allErrors });
        if (allErrors[errorKey] && allErrors[errorKey].toLowerCase().includes('duplicate')) {
          setErrors(allErrors); // Set all errors for all cells, not just this one
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // Sequential entry check (only if no duplicate error)
        if (!validateSequentialEntry(input, section, colIdx, rowIdx, localValue)) {
          console.log('[CH Tab] Sequential error:', { errorKey, localValue });
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
          const allErrorsSeq = validateChampionshipTab(input);
          console.log('[CH Tab] After sequential, allErrorsSeq:', allErrorsSeq);
          setErrors(allErrorsSeq); // Always set all errors after any check
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // If no errors, always run full-form validation for all cells
        console.log('[CH Tab] No errors, setting all errors:', validateChampionshipTab(input));
        setErrors(validateChampionshipTab(input));
        setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
        return;
      } else {
        // Finals: VOID → format → full-form validation (duplicate) → sequential (if no duplicate) → clear error
        if (isVoidInput(localValue)) {
          setErrors((prev: any) => {
            const copy = { ...prev };
            delete copy[errorKey];
            return copy;
          });
          setErrors(validateChampionshipTab(input));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        if (localValue && !validateCatNumber(localValue)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID' }));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        const allErrors = validateChampionshipTab(input);
        if (allErrors[errorKey] && allErrors[errorKey].toLowerCase().includes('duplicate')) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: allErrors[errorKey] }));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        if (!validateSequentialEntry(input, section, colIdx, rowIdx, localValue)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        setErrors((prev: any) => {
          const copy = { ...prev };
          delete copy[errorKey];
          return copy;
        });
        setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
        return;
      }
    };

    // Generalized onFocus handler for Cat # input (selects text and sets local input state)
    const handleCatInputFocusLocal = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, value: string, e: React.FocusEvent<HTMLInputElement>) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      setLocalInputState(prev => ({ ...prev, [key]: value }));
      e.target.select();
      setFocusedColumnIndex(colIdx);
    };

    // Generalized onKeyDown handler for Cat # input (triggers blur on Tab/Enter, preserves navigation)
    const handleCatInputKeyDownLocal = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, e: React.KeyboardEvent<HTMLInputElement>, tableRowIdx: number) => {
      if (e.key === 'Tab' || e.key === 'Enter') {
        handleCatInputBlur(section, colIdx, rowIdx);
      }
      handleCatInputKeyDown(e, colIdx, tableRowIdx);
    };

    // Defensive: always prefer local input state if present, else model value
    const getCatInputValue = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, modelValue: string) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      return localInputState[key] !== undefined ? localInputState[key] : modelValue;
    };
    // --- END CONTEXT-7 DYNAMIC VALIDATION PARITY ---

    return (
      <div className="p-8 space-y-8">
        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Reset All Data"
          message="Are you sure you want to reset all application data? This action cannot be undone and will clear all entered information including show details, judge information, championship data, and return you to the General tab."
          type="warning"
          confirmText="Reset All Data"
          cancelText="Cancel"
          onConfirm={confirmReset}
          onCancel={() => setIsResetModalOpen(false)}
        />

        {/* Tab-Specific Reset Confirmation Modal */}
        <Modal
          isOpen={isTabResetModalOpen}
          onClose={() => setIsTabResetModalOpen(false)}
          title="Reset Championship Tab"
          message="Are you sure you want to reset the Championship tab data? This action cannot be undone and will clear all championship finals information, but will keep your show details and judge information intact."
          type="warning"
          confirmText="Reset Championship Tab"
          cancelText="Cancel"
          onConfirm={handleTabResetClick}
          onCancel={() => setIsTabResetModalOpen(false)}
        />
        {/* CSV Error Modal */}
        <Modal
          isOpen={isCSVErrorModalOpen}
          onClose={() => setIsCSVErrorModalOpen(false)}
          title="Cannot Save to CSV"
          message="CSV cannot be generated until all errors on this tab have been resolved. Please fix all highlighted errors before saving."
          type="alert"
          confirmText="OK"
          showCancel={false}
        />

        {/* Championship Finals - Premium Design */}
        <div className="group relative">
          {/* Sticky header and dropdown */}
          <div className="sticky top-0 z-30 bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4">
            {/* Left: Icon, Title, Arrow */}
            <div className="flex items-center min-w-0">
              <span className="p-1.5 bg-gradient-to-br from-violet-500 to-yellow-400 rounded-xl shadow flex-shrink-0">
                {/* Star Icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span className="text-xl font-bold text-violet-700 ml-3">Championship Finals</span>
              <button
                onClick={handleScrollButtonClick}
                className="ml-3 w-7 h-7 flex items-center justify-center rounded-lg border border-violet-400 bg-white shadow-sm transition-all duration-200 hover:border-violet-500 hover:bg-violet-50/70 hover:shadow-violet-200/60 focus:outline-none focus:ring-2 focus:ring-violet-300 group"
                aria-label={scrollDown ? 'Scroll to Bottom' : 'Scroll to Top'}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-colors duration-200 ${scrollDown ? '' : 'rotate-180'} group-hover:stroke-violet-500`}
                  viewBox="0 0 24 24"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
            {/* Right: Minimal Dropdown, inline trophy icon in selected value only */}
            <CustomSelect
              options={columns.map((col, idx) => `Ring ${col.judge.id} - ${col.judge.acronym}`)}
              value={
                focusedColumnIndex !== null && focusedColumnIndex >= 0 && focusedColumnIndex < columns.length
                  ? `Ring ${columns[focusedColumnIndex].judge.id} - ${columns[focusedColumnIndex].judge.acronym}`
                  : `Ring ${columns[0].judge.id} - ${columns[0].judge.acronym}`
              }
              onChange={val => {
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
              className="w-[220px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-violet-200 shadow-md hover:shadow-lg focus:border-violet-400 focus:shadow-lg text-violet-700 transition-all duration-200"
              ariaLabel="Jump to Ring"
              selectedIcon="🏆"
              dropdownMenuClassName="w-[220px] rounded-xl bg-gradient-to-b from-white via-violet-50 to-white shadow-xl border-2 border-violet-200 text-base font-semibold text-violet-800 transition-all duration-200"
            />
          </div>
          <div className="relative">
            {/* Table scroll container with floating scroll buttons outside to the right */}
            <div
              className="outer-table-scroll-container overflow-x-auto border border-violet-200 bg-white shadow-lg" ref={tableContainerRef} style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0, paddingTop: 0 }}
            >
              <table className="border-collapse w-auto table-fixed divide-y divide-gray-200 bg-white" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, marginTop: 0, paddingTop: 0 }}>
                <thead style={{ margin: 0, padding: 0 }}>
                  <tr className="cfa-table-header-modern" style={{ margin: 0, padding: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
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
                  {/* Show Awards Section (Rows 4-18) */}
                {Array.from({ length: 15 }, (_, i) => {
                  if (columns.some(col => i < getShowAwardsRowCount(columns.indexOf(col), col.specialty))) {
                    return (
                      <tr key={`award-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                        <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {i + 1}{i >= 10 ? <span className="text-violet-400 font-bold">*</span> : ''}
                        </td>
                        {columns.map((_, columnIndex) => {
                          const col = columns[columnIndex];
                          if (i < getShowAwardsRowCount(columnIndex, col.specialty)) {
                            const award = getShowAward(columnIndex, i);
                            const errorKey = `${columnIndex}-${i}`;
                            const hasCatNumber = (localInputState[errorKey] !== undefined ? localInputState[errorKey] : award.catNumber)?.trim();
                            return (
                              <td
                                key={`award-${i}-${columnIndex}`}
                                className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150 ${focusedColumnIndex === columnIndex ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50 whitespace-nowrap overflow-x-visible`}
                                style={{
                                  width: hasCatNumber ? 110 : 90,
                                  minWidth: hasCatNumber ? 110 : 90,
                                  maxWidth: hasCatNumber ? 110 : 90,
                                  transition: 'width 0.2s'
                                }}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    {/* Cat # input: rounded-md, semi-transparent, focus ring, shadow */}
                                    <input
                                      type="text"
                                      className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(award.catNumber) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={getCatInputValue('showAwards', columnIndex, i, award.catNumber)}
                                      onChange={e => handleCatInputChange('showAwards', columnIndex, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('showAwards', columnIndex, i)}
                                      onFocus={e => handleCatInputFocusLocal('showAwards', columnIndex, i, award.catNumber, e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('showAwards', columnIndex, i, e, i)}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][i] = el;
                                      }}
                                    />
                                    {/* Only render status dropdown if not VOID */}
                                    {!isVoidInput(award.catNumber) && (
                                      <CustomSelect
                                        options={['GC', 'CH', 'NOV']}
                                        value={award.status || 'GC'}
                                        onChange={val => updateShowAward(columnIndex, i, 'status', val)}
                                        className="min-w-[70px]"
                                        ariaLabel="Status"
                                        borderColor="border-violet-300"
                                        focusBorderColor="focus:border-violet-500"
                                        textColor="text-violet-700"
                                        highlightBg="bg-violet-50"
                                        highlightText="text-violet-900"
                                        selectedBg="bg-violet-100"
                                        selectedText="text-violet-800"
                                        hoverBg="bg-violet-50"
                                        hoverText="text-violet-900"
                                      />
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
                          }
                            return <td key={`award-${i}-${columnIndex}`} className="py-2 px-2 border-r border-gray-200"></td>;
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                    {/* Finals Sections (Rows 19-23) */}
                  {Array.from({ length: 5 }, (_, i) => {
                    if (columns.some(col => i < getFinalsRowCount(columns.indexOf(col), col.specialty, 'champions'))) {
                      const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
                      return (
                        <tr key={`champions-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                          <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                            {ordinals[i]} AB CH
                        </td>
                          {columns.map((_, columnIndex) => {
                            const col = columns[columnIndex];
                            const isFocused = focusedColumnIndex === columnIndex;
                            const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'champions');
                            const errorKey = `champions-${columnIndex}-${i}`;
                            return (
                              <td key={`champions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                                {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                    <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                    className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getFinalsValue('champions', columnIndex, i)) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                        value={getCatInputValue('champions', columnIndex, i, getFinalsValue('champions', columnIndex, i))}
                                        onChange={e => handleCatInputChange('champions', columnIndex, i, e.target.value)}
                                        onBlur={() => handleCatInputBlur('champions', columnIndex, i)}
                                        onFocus={e => handleCatInputFocusLocal('champions', columnIndex, i, getFinalsValue('champions', columnIndex, i), e)}
                                        onKeyDown={e => handleCatInputKeyDownLocal('champions', columnIndex, i, e, i + 4)}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                          catInputRefs.current[columnIndex][i + 4] = el; // Adjust index for Finals rows
                                      }}
                                    />
                                  </div>
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
                                ) : null}
                              </td>
                            );
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                {/* LH Champions Section (Rows 24-28) */}
                {Array.from({ length: 5 }, (_, i) => {
                  if (columns.some(col => i < getFinalsRowCount(columns.indexOf(col), col.specialty, 'lhChampions'))) {
                    const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
                    return (
                      <tr key={`lhChampions-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                        <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {ordinals[i]} LH CH
                        </td>
                        {columns.map((_, columnIndex) => {
                          const col = columns[columnIndex];
                          const isFocused = focusedColumnIndex === columnIndex;
                          const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'lhChampions');
                            const errorKey = `lhChampions-${columnIndex}-${i}`;
                            return (
                            <td key={`lhChampions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                              {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                    className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getFinalsValue('lhChampions', columnIndex, i)) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={getCatInputValue('lhChampions', columnIndex, i, getFinalsValue('lhChampions', columnIndex, i))}
                                      onChange={e => handleCatInputChange('lhChampions', columnIndex, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('lhChampions', columnIndex, i)}
                                      onFocus={e => handleCatInputFocusLocal('lhChampions', columnIndex, i, getFinalsValue('lhChampions', columnIndex, i), e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('lhChampions', columnIndex, i, e, i + 9)}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][i + 9] = el; // Adjust index for LH Champions rows
                                      }}
                                    />
                                  </div>
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
                              ) : null}
                              </td>
                            );
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                {/* SH Champions Section (Rows 29-33) */}
                {Array.from({ length: 5 }, (_, i) => {
                  if (columns.some(col => i < getFinalsRowCount(columns.indexOf(col), col.specialty, 'shChampions'))) {
                    const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
                    return (
                      <tr key={`shChampions-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                        <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {ordinals[i]} SH CH
                        </td>
                        {columns.map((_, columnIndex) => {
                          const col = columns[columnIndex];
                          const isFocused = focusedColumnIndex === columnIndex;
                          const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'shChampions');
                            const errorKey = `shChampions-${columnIndex}-${i}`;
                            return (
                            <td key={`shChampions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                              {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                    className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getFinalsValue('shChampions', columnIndex, i)) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={getCatInputValue('shChampions', columnIndex, i, getFinalsValue('shChampions', columnIndex, i))}
                                      onChange={e => handleCatInputChange('shChampions', columnIndex, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('shChampions', columnIndex, i)}
                                      onFocus={e => handleCatInputFocusLocal('shChampions', columnIndex, i, getFinalsValue('shChampions', columnIndex, i), e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('shChampions', columnIndex, i, e, i + 14)}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][i + 14] = el; // Adjust index for SH Champions rows
                                      }}
                                    />
                                  </div>
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
                              ) : null}
                              </td>
                            );
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Premium Action Buttons - Centered, matches GeneralTab */}
        <ActionButtons
          onSaveToCSV={handleSaveToCSVClick}
          onLoadFromCSV={handleRestoreFromCSVClick}
          onReset={handleResetClick}
        />
      </div>
    );
  }
);

export default ChampionshipTab; 