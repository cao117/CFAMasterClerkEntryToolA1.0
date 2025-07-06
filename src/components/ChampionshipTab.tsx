import { useState, useEffect, useImperativeHandle, useCallback, useRef } from 'react';
import React from 'react';
import Modal from './Modal';
import { 
  validateChampionshipTab, 
  validateCatNumber,
  validateSequentialEntry,
} from '../validation/championshipValidation';
import type { CellData } from '../validation/championshipValidation';
import { handleSaveToCSV, handleRestoreFromCSV } from '../utils/formActions';

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
      voidedShowAwards: { [key: string]: boolean };
      voidedChampionsFinals: { [key: string]: boolean };
      voidedLHChampionsFinals: { [key: string]: boolean };
      voidedSHChampionsFinals: { [key: string]: boolean };
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
    const { judges, championshipTotal, championshipCounts, showSuccess, showError, shouldFillTestData, onResetAllData, championshipTabData, setChampionshipTabData, getShowState, isActive } = props;
    // State for dynamic table structure
    const [columns, setColumns] = useState<Column[]>([]);
    const [numAwardRows, setNumAwardRows] = useState(10);
    
    // State for validation errors and modal
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isTabResetModalOpen, setIsTabResetModalOpen] = useState(false);
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
          // --- Auto-void logic: if this cat number is voided elsewhere in the column, void this cell too ---
          if (value && value.trim() !== '') {
            const isVoided = (
              Object.keys(prev.voidedShowAwards).some(k => k.startsWith(`${columnIndex}-`) && prev.showAwards[k]?.catNumber === value && prev.voidedShowAwards[k]) ||
              Object.keys(prev.voidedChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.championsFinals[k] === value && prev.voidedChampionsFinals[k]) ||
              Object.keys(prev.voidedLHChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.lhChampionsFinals[k] === value && prev.voidedLHChampionsFinals[k]) ||
              Object.keys(prev.voidedSHChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.shChampionsFinals[k] === value && prev.voidedSHChampionsFinals[k])
            );
            setChampionshipTabDataVoidState('voidedShowAwards', columnIndex, position, isVoided);
          } else {
            setChampionshipTabDataVoidState('voidedShowAwards', columnIndex, position, false);
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
        // --- Auto-void logic: if this cat number is voided elsewhere in the column, void this cell too ---
        let isVoided = false;
        if (value && value.trim() !== '') {
          isVoided = (
            Object.keys(prev.voidedShowAwards).some(k => k.startsWith(`${columnIndex}-`) && prev.showAwards[k]?.catNumber === value && prev.voidedShowAwards[k]) ||
            Object.keys(prev.voidedChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.championsFinals[k] === value && prev.voidedChampionsFinals[k]) ||
            Object.keys(prev.voidedLHChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.lhChampionsFinals[k] === value && prev.voidedLHChampionsFinals[k]) ||
            Object.keys(prev.voidedSHChampionsFinals).some(k => k.startsWith(`${columnIndex}-`) && prev.shChampionsFinals[k] === value && prev.voidedSHChampionsFinals[k])
          );
          setChampionshipTabDataVoidState(sectionToVoidKey(section), columnIndex, position, isVoided);
        } else {
          setChampionshipTabDataVoidState(sectionToVoidKey(section), columnIndex, position, false);
        }
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
     * Helper to set void state for a given section/position.
     */
    function setChampionshipTabDataVoidState(section: 'voidedShowAwards' | 'voidedChampionsFinals' | 'voidedLHChampionsFinals' | 'voidedSHChampionsFinals', columnIndex: number, position: number, voided: boolean) {
      const key = `${columnIndex}-${position}`;
      setChampionshipTabData((prev: ChampionshipTabData) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: voided
          }
      }));
    }

    /**
     * Helper to map section to void state key.
     */
    function sectionToVoidKey(section: 'champions' | 'lhChampions' | 'shChampions') {
      switch (section) {
        case 'champions': return 'voidedChampionsFinals';
        case 'lhChampions': return 'voidedLHChampionsFinals';
        case 'shChampions': return 'voidedSHChampionsFinals';
        default: return 'voidedChampionsFinals';
      }
    }

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
    const getShowAward = (columnIndex: number, position: number): CellData => {
      const key = `${columnIndex}-${position}`;
      return championshipTabData.showAwards[key] || { catNumber: '', status: 'GC' };
    };

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
        voidedShowAwards: {},
        voidedChampionsFinals: {},
        voidedLHChampionsFinals: {},
        voidedSHChampionsFinals: {},
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
          voidedShowAwards: {},
          voidedChampionsFinals: {},
          voidedLHChampionsFinals: {},
          voidedSHChampionsFinals: {}
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

    // Action button handlers
    const handleSaveToCSVClick = () => {
      const errors = validateChampionshipTab({
        columns,
        showAwards: championshipTabData.showAwards,
        championsFinals: championshipTabData.championsFinals,
        lhChampionsFinals: championshipTabData.lhChampionsFinals,
        shChampionsFinals: championshipTabData.shChampionsFinals,
        championshipTotal,
        championshipCounts
      });
      setErrors(errors);
      if (Object.keys(errors).length > 0) {
        showError(
          'Championship Validation Errors',
          'Please fix all validation errors before saving to CSV. Check the form for highlighted fields with errors.',
          8000
        );
        return;
      }
      // Export the full show state for CSV export
      handleSaveToCSV(getShowState, showSuccess, showError);
    };

    const handleRestoreFromCSVClick = () => {
      handleRestoreFromCSV({ columns, showAwards: championshipTabData.showAwards, championsFinals: championshipTabData.championsFinals, lhChampionsFinals: championshipTabData.lhChampionsFinals, shChampionsFinals: championshipTabData.shChampionsFinals, championshipTotal }, showSuccess, showError);
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
        voidedShowAwards: {},
        voidedChampionsFinals: {},
        voidedLHChampionsFinals: {},
        voidedSHChampionsFinals: {},
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

    /**
     * Synchronized voiding logic for Championship tab.
     * If a cat number is voided in any cell in a column, all other cells in that column with the same cat number (across all sections) are also voided.
     * If any voided checkbox is unchecked, all instances are unvoided.
     * This matches the Premiership tab logic and CFA rules.
     *
     * @param section Section name ('showAwards' | 'championsFinals' | 'lhChampionsFinals' | 'shChampionsFinals')
     * @param columnIndex Column index (ring)
     * @param position Row/position in section
     * @param voided Boolean: true to void, false to unvoid
     */
    const updateVoidStateColumnWide = (
      section: 'showAwards' | 'championsFinals' | 'lhChampionsFinals' | 'shChampionsFinals',
      columnIndex: number,
      position: number,
      voided: boolean
    ) => {
      // Get the Cat # for the toggled cell
      let catNumber = '';
      if (section === 'showAwards') catNumber = championshipTabData.showAwards[`${columnIndex}-${position}`]?.catNumber || '';
      if (section === 'championsFinals') catNumber = championshipTabData.championsFinals[`${columnIndex}-${position}`] || '';
      if (section === 'lhChampionsFinals') catNumber = championshipTabData.lhChampionsFinals[`${columnIndex}-${position}`] || '';
      if (section === 'shChampionsFinals') catNumber = championshipTabData.shChampionsFinals[`${columnIndex}-${position}`] || '';
      if (!catNumber) return;
      // Find all keys in all sections for this column where the Cat # matches
      setChampionshipTabData((prev: ChampionshipTabData) => {
        const newData = { ...prev };
        // Show Awards
        Object.keys(newData.showAwards).forEach(key => {
          const [colIdx] = key.split('-').map(Number);
          if (colIdx === columnIndex && newData.showAwards[key]?.catNumber === catNumber) {
            newData.voidedShowAwards[key] = voided;
          }
        });
        // Best AB CH
        Object.keys(newData.championsFinals).forEach(key => {
          const [colIdx] = key.split('-').map(Number);
          if (colIdx === columnIndex && newData.championsFinals[key] === catNumber) {
            newData.voidedChampionsFinals[key] = voided;
          }
        });
        // Best LH CH
        Object.keys(newData.lhChampionsFinals).forEach(key => {
          const [colIdx] = key.split('-').map(Number);
          if (colIdx === columnIndex && newData.lhChampionsFinals[key] === catNumber) {
            newData.voidedLHChampionsFinals[key] = voided;
          }
        });
        // Best SH CH
        Object.keys(newData.shChampionsFinals).forEach(key => {
          const [colIdx] = key.split('-').map(Number);
          if (colIdx === columnIndex && newData.shChampionsFinals[key] === catNumber) {
            newData.voidedSHChampionsFinals[key] = voided;
          }
        });
        return newData;
      });
    };

    const getVoidState = (section: 'showAwards' | 'championsFinals' | 'lhChampionsFinals' | 'shChampionsFinals', columnIndex: number, position: number): boolean => {
      const key = `${columnIndex}-${position}`;
      switch (section) {
        case 'showAwards':
          return championshipTabData.voidedShowAwards[key] || false;
        case 'championsFinals':
          return championshipTabData.voidedChampionsFinals[key] || false;
        case 'lhChampionsFinals':
          return championshipTabData.voidedLHChampionsFinals[key] || false;
        case 'shChampionsFinals':
          return championshipTabData.voidedSHChampionsFinals[key] || false;
        default:
          return false;
      }
    };

    const shouldApplyRingGlow = (columnIndex: number): boolean => {
      return focusedColumnIndex === columnIndex;
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

    const getBreakpointForRingType = (ringType: string): number => {
      const count = getChampionshipCountForRingType(ringType);
      return count >= 85 ? 15 : 10;
    };

    const getFinalsPositionsForRingType = (ringType: string): number => {
      const count = getChampionshipCountForRingType(ringType);
      return count >= 85 ? 5 : 3;
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
        voidedShowAwards: championshipTabData.voidedShowAwards,
        voidedChampionsFinals: championshipTabData.voidedChampionsFinals,
        voidedLHChampionsFinals: championshipTabData.voidedLHChampionsFinals,
        voidedSHChampionsFinals: championshipTabData.voidedSHChampionsFinals
      };
      
      // Run basic validation for this input
      if (value.trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(value)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'Cat number must be between 1-450' }));
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

    if (judges.length === 0) {
      return (
        <div className="p-8 space-y-8">
          <div className="cfa-section">
            <h2 className="cfa-section-header">Championship Finals</h2>
            <p className="text-gray-600 mb-6">Dynamic championship table based on judge information from the General tab.</p>
            
            <div className="text-center py-12">
              <div className="cfa-badge cfa-badge-warning mb-4">No Judges Available</div>
              <p className="text-gray-600">Please add judges in the General tab to populate the championship table.</p>
            </div>
          </div>
        </div>
      );
    }

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

        <div className="cfa-section">
          <h2 className="cfa-section-header flex items-center justify-between">
            Championship Finals
            {/* Dropdown for ring jump */}
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
                    <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}></th>
                    {columns.map((column, index) => (
                      <th 
                        id={`ring-th-${index}`} 
                        key={`ring-${index}`} 
                        className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300 ${shouldApplyRingGlow(index) ? 'ring-glow' : ''}`} 
                        style={{ width: '120px', minWidth: '120px' }}
                      >
                        Ring {column.judge.id}
                      </th>
                    ))}
                  </tr>

                  {/* Header Row 2: Judge Acronyms */}
                  <tr className="cfa-table-header sticky-header sticky-header-2">
                    <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}></th>
                    {columns.map((column, index) => (
                      <th 
                        key={`acronym-${index}`} 
                        className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300 ${shouldApplyRingGlow(index) ? 'ring-glow' : ''}`} 
                        style={{ width: '120px', minWidth: '120px' }}
                      >
                        {column.judge.acronym}
                      </th>
                    ))}
                  </tr>

                  {/* Header Row 3: Ring Types */}
                  <tr className="cfa-table-header sticky-header sticky-header-3">
                    <th className="text-left py-1 pl-4 font-medium border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}>Position</th>
                    {columns.map((column, index) => (
                      <th 
                        key={`type-${index}`} 
                        className={`text-center py-1 px-1 font-medium text-sm border-r border-gray-300 ${shouldApplyRingGlow(index) ? 'ring-glow' : ''}`} 
                        style={{ width: '120px', minWidth: '120px' }}
                      >
                        {column.specialty}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Show Awards Section (Rows 4-18) */}
                  {/*
                    Render up to 15 rows, but for each cell, only render the input if that row is within the enabled range for that column.
                    For columns with <85 cats, only render up to 10 rows; for >=85, up to 15 rows.
                  */}
                  {Array.from({ length: 15 }, (_, i) => (
                    // Only render the row if at least one column needs it
                    columns.some(col => i < getBreakpointForRingType(col.specialty)) ? (
                      <tr key={`award-${i}`} className="cfa-table-row">
                        <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {i + 1}{i >= 10 ? '*' : ''}
                        </td>
                        {columns.map((_, columnIndex) => {
                          const col = columns[columnIndex];
                          // Only render input if this row is enabled for this column
                          if (i < getBreakpointForRingType(col.specialty)) {
                            const award = getShowAward(columnIndex, i);
                            const errorKey = `${columnIndex}-${i}`;
                            return (
                              <td key={`award-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}> 
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-1 items-center">
                                    <input
                                      type="text"
                                      className={`w-10 h-7 text-xs text-center border rounded px-0.5 ${getBorderStyle(errorKey)} focus:border-cfa-gold focus:outline-none ${
                                        getVoidState('showAwards', columnIndex, i) ? 'voided-input' : ''
                                      }`}
                                      placeholder="Cat #"
                                      value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : award.catNumber}
                                      onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                      onBlur={(e) => {
                                        updateShowAward(columnIndex, i, 'catNumber', e.target.value);
                                        setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                      }}
                                      disabled={getVoidState('showAwards', columnIndex, i)}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][i] = el;
                                      }}
                                      onKeyDown={(e) => handleCatInputKeyDown(e, columnIndex, i)}
                                      onFocus={(e) => handleCatInputFocus(e, columnIndex)}
                                    />
                                    <select
                                      className="w-14 h-7 text-xs border border-gray-300 rounded focus:border-cfa-gold focus:outline-none"
                                      value={award.status}
                                      onChange={(e) => updateShowAward(columnIndex, i, 'status', e.target.value)}
                                      onFocus={() => setFocusedColumnIndex(columnIndex)}
                                      disabled={getVoidState('showAwards', columnIndex, i)}
                                      tabIndex={-1}
                                    >
                                      <option value="GC">GC</option>
                                      <option value="CH">CH</option>
                                      <option value="NOV">NOV</option>
                                    </select>
                                    {award.catNumber && award.catNumber.trim() && (
                                      <div className="void-tooltip">
                                        <input
                                          type="checkbox"
                                          className="void-checkbox"
                                          checked={getVoidState('showAwards', columnIndex, i)}
                                          onChange={(e) => updateVoidStateColumnWide('showAwards', columnIndex, i, e.target.checked)}
                                          onFocus={() => setFocusedColumnIndex(columnIndex)}
                                          tabIndex={-1}
                                        />
                                        <span className="tooltip-text">
                                          Mark this placement as voided (award given but not received by cat)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {errors[errorKey] && (
                                    <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[errorKey])}</div>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            // Render empty cell for columns that do not need this row
                            // Always apply border/padding classes for visual consistency
                            // Also apply ring-glow if this is the focused column, for highlight continuity
                            return <td key={`award-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                          }
                        })}
                      </tr>
                    ) : null
                  ))}

                  {/* Champions Finals Section (Rows 19-23) - Only for Allbreed rings */}
                  {Array.from({ length: 5 }, (_, i) => (
                    columns.some(col => col.specialty === 'Allbreed' && i < getFinalsPositionsForRingType(col.specialty)) ? (
                      <tr key={`ch-final-${i}`} className="cfa-table-row">
                        <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {getOrdinalLabel(i, 'AB')}
                        </td>
                        {columns.map((col, columnIndex) => {
                          const enabled = col.specialty === 'Allbreed' && i < getFinalsPositionsForRingType(col.specialty);
                          if (enabled) {
                            const value = getFinalsValue('champions', columnIndex, i);
                            const errorKey = `champions-${columnIndex}-${i}`;
                            // Map Finals Cat # input to refs: rowIdx = numAwardRows + i
                            const finalsRowIdx = Math.max(...columns.map(col => getBreakpointForRingType(col.specialty))) + i;
                            return (
                              <td 
                                key={`ch-final-${i}-${columnIndex}`} 
                                className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      className={`w-10 h-7 text-xs text-center border rounded px-0.5 font-medium ${
                                        getBorderStyle(errorKey)
                                      } focus:border-cfa-gold focus:outline-none ${
                                        getVoidState('championsFinals', columnIndex, i) ? 'voided-input' : ''
                                      }`}
                                      placeholder="Cat #"
                                      value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                      disabled={getVoidState('championsFinals', columnIndex, i)}
                                      onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                      onBlur={(e) => {
                                        updateFinals('champions', columnIndex, i, e.target.value);
                                        setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                        handleFinalsBlur('champions', columnIndex, i, e.target.value);
                                      }}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][finalsRowIdx] = el;
                                      }}
                                      onKeyDown={(e) => handleCatInputKeyDown(e, columnIndex, finalsRowIdx)}
                                      onFocus={(e) => handleCatInputFocus(e, columnIndex)}
                                    />
                                    {value && value.trim() && (
                                      <div className="void-tooltip ml-1">
                                        <input
                                          type="checkbox"
                                          className="void-checkbox"
                                          checked={getVoidState('championsFinals', columnIndex, i)}
                                          onChange={(e) => updateVoidStateColumnWide('championsFinals', columnIndex, i, e.target.checked)}
                                          onFocus={() => setFocusedColumnIndex(columnIndex)}
                                          tabIndex={-1}
                                        />
                                        <span className="tooltip-text">
                                          Mark this placement as voided (award given but not received by cat)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {errors[errorKey] && (
                                    <>
                                      {console.log('[ChampionshipTab] Render error for', errorKey, errors[errorKey])}
                                      <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[errorKey])}</div>
                                    </>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            // Render empty cell for columns that do not need this row
                            // Always apply border/padding classes for visual consistency
                            // Also apply ring-glow if this is the focused column, for highlight continuity
                            return <td key={`ch-final-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                          }
                        })}
                      </tr>
                    ) : null
                  ))}

                  {/* Longhair Champions Finals Section (Rows 24-28) - Only for Longhair and Allbreed rings */}
                  {Array.from({ length: 5 }, (_, i) => (
                    columns.some(col => (col.specialty === 'Longhair' || col.specialty === 'Allbreed') && i < getFinalsPositionsForRingType(col.specialty)) ? (
                      <tr key={`lh-final-${i}`} className="cfa-table-row">
                        <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {getOrdinalLabel(i, 'LH')}
                        </td>
                        {columns.map((col, columnIndex) => {
                          const enabled = (col.specialty === 'Longhair' || col.specialty === 'Allbreed') && i < getFinalsPositionsForRingType(col.specialty);
                          if (enabled) {
                            const value = getFinalsValue('lhChampions', columnIndex, i);
                            const errorKey = `lhChampions-${columnIndex}-${i}`;
                            // Map Finals Cat # input to refs: rowIdx = numAwardRows + numBestCH + i
                            const finalsRowIdx = Math.max(...columns.map(col => getBreakpointForRingType(col.specialty))) + Math.max(...columns.map(col => col.specialty === 'Allbreed' ? getFinalsPositionsForRingType(col.specialty) : 0)) + i;
                            return (
                              <td 
                                key={`lh-final-${i}-${columnIndex}`} 
                                className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      className={`w-10 h-7 text-xs text-center border rounded px-0.5 font-medium ${
                                        getBorderStyle(errorKey)
                                      } focus:border-cfa-gold focus:outline-none ${
                                        getVoidState('lhChampionsFinals', columnIndex, i) ? 'voided-input' : ''
                                      }`}
                                      placeholder="Cat #"
                                      value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                      disabled={getVoidState('lhChampionsFinals', columnIndex, i)}
                                      onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                      onBlur={(e) => {
                                        updateFinals('lhChampions', columnIndex, i, e.target.value);
                                        setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                        handleFinalsBlur('lhChampions', columnIndex, i, e.target.value);
                                      }}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][finalsRowIdx] = el;
                                      }}
                                      onKeyDown={(e) => handleCatInputKeyDown(e, columnIndex, finalsRowIdx)}
                                      onFocus={(e) => handleCatInputFocus(e, columnIndex)}
                                    />
                                    {value && value.trim() && (
                                      <div className="void-tooltip ml-1">
                                        <input
                                          type="checkbox"
                                          className="void-checkbox"
                                          checked={getVoidState('lhChampionsFinals', columnIndex, i)}
                                          onChange={(e) => updateVoidStateColumnWide('lhChampionsFinals', columnIndex, i, e.target.checked)}
                                          onFocus={() => setFocusedColumnIndex(columnIndex)}
                                          tabIndex={-1}
                                        />
                                        <span className="tooltip-text">
                                          Mark this placement as voided (award given but not received by cat)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {errors[errorKey] && (
                                    <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[errorKey])}</div>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            // Render empty cell for columns that do not need this row
                            // Always apply border/padding classes for visual consistency
                            // Also apply ring-glow if this is the focused column, for highlight continuity
                            return <td key={`lh-final-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                          }
                        })}
                      </tr>
                    ) : null
                  ))}

                  {/* Shorthair Champions Finals Section (Rows 29-33) - Only for Shorthair and Allbreed rings */}
                  {Array.from({ length: 5 }, (_, i) => (
                    columns.some(col => (col.specialty === 'Shorthair' || col.specialty === 'Allbreed') && i < getFinalsPositionsForRingType(col.specialty)) ? (
                      <tr key={`sh-final-${i}`} className="cfa-table-row">
                        <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300 frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {getOrdinalLabel(i, 'SH')}
                        </td>
                        {columns.map((col, columnIndex) => {
                          const enabled = (col.specialty === 'Shorthair' || col.specialty === 'Allbreed') && i < getFinalsPositionsForRingType(col.specialty);
                          if (enabled) {
                            const value = getFinalsValue('shChampions', columnIndex, i);
                            const errorKey = `shChampions-${columnIndex}-${i}`;
                            // Map Finals Cat # input to refs: rowIdx = numAwardRows + numBestCH + numBestLHCH + i
                            const finalsRowIdx = Math.max(...columns.map(col => getBreakpointForRingType(col.specialty))) + Math.max(...columns.map(col => col.specialty === 'Allbreed' ? getFinalsPositionsForRingType(col.specialty) : 0)) + i;
                            return (
                              <td 
                                key={`sh-final-${i}-${columnIndex}`} 
                                className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}
                              >
                                <div className="flex flex-col items-start">
                                  <div className="flex items-center">
                                    <input
                                      type="text"
                                      className={`w-10 h-7 text-xs text-center border rounded px-0.5 font-medium ${
                                        getBorderStyle(errorKey)
                                      } focus:border-cfa-gold focus:outline-none ${
                                        getVoidState('shChampionsFinals', columnIndex, i) ? 'voided-input' : ''
                                      }`}
                                      placeholder="Cat #"
                                      value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                      disabled={getVoidState('shChampionsFinals', columnIndex, i)}
                                      onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                      onBlur={(e) => {
                                        updateFinals('shChampions', columnIndex, i, e.target.value);
                                        setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                        handleFinalsBlur('shChampions', columnIndex, i, e.target.value);
                                      }}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][finalsRowIdx] = el;
                                      }}
                                      onKeyDown={(e) => handleCatInputKeyDown(e, columnIndex, finalsRowIdx)}
                                      onFocus={(e) => handleCatInputFocus(e, columnIndex)}
                                    />
                                    {value && value.trim() && (
                                      <div className="void-tooltip ml-1">
                                        <input
                                          type="checkbox"
                                          className="void-checkbox"
                                          checked={getVoidState('shChampionsFinals', columnIndex, i)}
                                          onChange={(e) => updateVoidStateColumnWide('shChampionsFinals', columnIndex, i, e.target.checked)}
                                          onFocus={() => setFocusedColumnIndex(columnIndex)}
                                          tabIndex={-1}
                                        />
                                        <span className="tooltip-text">
                                          Mark this placement as voided (award given but not received by cat)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {errors[errorKey] && (
                                    <div className="text-xs mt-1" style={getErrorStyle()}>{getCleanMessage(errors[errorKey])}</div>
                                  )}
                                </div>
                              </td>
                            );
                          } else {
                            // Render empty cell for columns that do not need this row
                            // Always apply border/padding classes for visual consistency
                            // Also apply ring-glow if this is the focused column, for highlight continuity
                            return <td key={`sh-final-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-300 align-top${shouldApplyRingGlow(columnIndex) ? ' ring-glow' : ''}`}>&nbsp;</td>;
                          }
                        })}
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend for rows 11-15 */}
            {numAwardRows > 10 && (
              <div className="mt-4 text-sm text-gray-600">
                <span className="font-medium">*</span> Positions 11-15 available when ≥85 cats in championship
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveToCSVClick}
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
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ChampionshipTab; 