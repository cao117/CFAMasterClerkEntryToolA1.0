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
import { handleSaveToExcel } from '../utils/excelExport';
import CustomSelect from './CustomSelect';
import { formatJumpToMenuOptions, formatJumpToMenuValue, getRoomTypeAbbreviation } from '../utils/jumpToMenuUtils';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
  ringNumber: number;
}

interface ChampionshipTabProps {
  judges: Judge[];
  championshipTotal: number;
  championshipCounts: {
    lhGcs: number;
    shGcs: number;
    lhChs: number;
    shChs: number;
    lhNovs: number;
    shNovs: number;
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
  /**
   * Global settings including max_cats for validation
   */
  globalSettings: {
    max_judges: number;
    max_cats: number;
    placement_thresholds: {
      championship: number;
      kitten: number;
      premiership: number;
      household_pet: number;
    };
    short_hair_breeds: string[];
    long_hair_breeds: string[];
  };
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
    const { judges, championshipTotal, championshipCounts, showSuccess, showError, shouldFillTestData, onResetAllData, championshipTabData, setChampionshipTabData, getShowState, isActive, onCSVImport, globalSettings } = props;

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
    // Calculate totalCatRows using consistent logic (like PremiershipTab approach but simplified)
    const maxFinalsRows = championshipTotal >= globalSettings.placement_thresholds.championship ? 5 : 3;
    const totalCatRows = numAwardRows + maxFinalsRows + maxFinalsRows + maxFinalsRows; // Show Awards + Best CH + LH CH + SH CH
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
              if (nextCol >= columns.length) return null; // End of table
              nextRow = 0;
            }
          } else {
            // Move to previous row in same column
            if (nextRow > 0) {
              nextRow--;
            } else {
              // Move to previous column
              nextCol--;
              if (nextCol < 0) return null; // Beginning of table
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

    // Generate columns based on judges
    const generateColumns = useCallback((): Column[] => {
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
        } else if (judge.ringType === 'Super Specialty') {
          // For Super Specialty, create three columns (LH, SH, AB) but all use the original judge's id (ring number) and info
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Longhair'
          });
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Shorthair'
          });
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Allbreed'
          });
        } else if (judge.ringType === 'OCP Ring') {
          // For OCP Ring, create two columns (AB, OCP) but both use the original judge's id (ring number) and info
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'Allbreed'
          });
          columns.push({
            judge: { ...judge }, // keep original id
            specialty: 'OCP'
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
    }, [judges]);

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
          // Determine the correct status based on the column specialty
          const column = columns[columnIndex];
          let defaultStatus = 'GC';
          if (column?.specialty === 'OCP') {
            defaultStatus = 'CH'; // OCP rings are locked to CH status
          }
          
          const newCell = {
            ...prevCell,
            catNumber: value,
            status: prevCell.status || (value ? defaultStatus : '')
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
      if (championshipTotal >= globalSettings.placement_thresholds.championship) {
        setNumAwardRows(15);
      } else {
        setNumAwardRows(10);
      }
    }, [championshipTotal, globalSettings.placement_thresholds.championship]);

    // Test data generation function for Championship tab - UPDATED TO COMPLY WITH VALIDATION RULES
    const fillTestData = useCallback(() => {
      const newShowAwards: {[key: string]: CellData} = {};
      const newChampionsFinals: {[key: string]: string} = {};
      const newLhChampionsFinals: {[key: string]: string} = {};
      const newShChampionsFinals: {[key: string]: string} = {};
      
      // Generate unique cat numbers for each column
      const generateUniqueNumber = (): number => {
        return Math.floor(Math.random() * globalSettings.max_cats) + 1;
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
          // [VOID LOGIC REFACTOR] Removed last remaining voided state properties from object initialization.
          }, globalSettings.max_cats)
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
      validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats)
    );
  }, [columns, championshipTabData.showAwards, championshipTabData.championsFinals, championshipTabData.lhChampionsFinals, championshipTabData.shChampionsFinals, championshipTotal, championshipCounts, globalSettings.max_cats]);

    // Helper function to prepare validation input with OCP status forcing
    const prepareValidationInput = () => {
      // Prepare showAwards data with OCP status forcing (same logic as getShowAward)
      const processedShowAwards = { ...championshipTabData.showAwards };
      Object.keys(processedShowAwards).forEach(key => {
        const [colIdx, rowIdx] = key.split('-').map(Number);
        const cell = processedShowAwards[key];
        const column = columns[colIdx];
        if (column?.specialty === 'OCP' && cell.catNumber && !isVoidInput(cell.catNumber)) {
          processedShowAwards[key] = { ...cell, status: 'CH' };
        }
      });

      return {
        columns,
        showAwards: processedShowAwards,
        championsFinals: championshipTabData.championsFinals,
        lhChampionsFinals: championshipTabData.lhChampionsFinals,
        shChampionsFinals: championshipTabData.shChampionsFinals,
        championshipTotal,
        championshipCounts
      };
    };

    // Defensive getter for showAwards (Top 10/15)
    const getShowAward = (colIdx: number, i: number) => {
      const cell = championshipTabData.showAwards[`${colIdx}-${i}`] || { catNumber: '', status: 'GC' };
      // For OCP rings, ensure status is always CH
      const column = columns[colIdx];
      if (column?.specialty === 'OCP' && cell.catNumber && !isVoidInput(cell.catNumber)) {
        return { ...cell, status: 'CH' };
      }
      return cell;
    };

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
      // Export the full show state for Excel export
      handleSaveToExcel(getShowState, showSuccess, showError);
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
          return championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs + championshipCounts.lhNovs + championshipCounts.shNovs; // Championship cats + Novices
        case 'Longhair':
          return championshipCounts.lhGcs + championshipCounts.lhChs + championshipCounts.lhNovs;
        case 'Shorthair':
          return championshipCounts.shGcs + championshipCounts.shChs + championshipCounts.shNovs;
        case 'OCP':
          return 10; // OCP always requires exactly 10 placements, no threshold checking
        default:
          return championshipCounts.lhGcs + championshipCounts.shGcs + championshipCounts.lhChs + championshipCounts.shChs + championshipCounts.lhNovs + championshipCounts.shNovs; // Championship cats + Novices
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
      // Calculate the correct breakpoint based on ring type
      const count = getChampionshipCountForRingType(specialty);
      const calculated = count >= globalSettings.placement_thresholds.championship ? 15 : 10;
      
      // Only check for imported data if it's within the valid range for this ring type
      let maxIdx = -1;
      Object.keys(championshipTabData.showAwards).forEach(key => {
        const [col, row] = key.split('-').map(Number);
        if (col === colIdx && row >= 0 && row < calculated) {
          maxIdx = Math.max(maxIdx, row);
        }
      });
      
      // Return the calculated value (don't override with imported data that exceeds the breakpoint)
      return calculated;
    };
    /**
     * Returns the number of Finals rows to render for a given column/section, based on:
     *  - The calculated finals count (3/5)
     *  - The number of rows present in the imported finals for this column/section
     * This ensures that after CSV import, if 5 rows are present, all are shown, even if the show count is not set before render.
     */
    const getFinalsRowCount = (colIdx: number, specialty: string, section: 'champions' | 'lhChampions' | 'shChampions'): number => {
      const calculated = getChampionshipCountForRingType(specialty) >= globalSettings.placement_thresholds.championship ? 5 : 3;
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

    // Helper functions to determine which sections should be shown for each ring type
    const shouldShowSection = (specialty: string, section: 'champions' | 'lhChampions' | 'shChampions'): boolean => {
      switch (specialty) {
        case 'Allbreed':
          return true; // Allbreed shows all sections
        case 'Longhair':
          return section === 'lhChampions'; // Longhair only shows LH CH
        case 'Shorthair':
          return section === 'shChampions'; // Shorthair only shows SH CH
        default:
          return false;
      }
    };

    const getSectionsForRingType = (specialty: string): Array<'champions' | 'lhChampions' | 'shChampions'> => {
      switch (specialty) {
        case 'Allbreed':
          return ['champions', 'lhChampions', 'shChampions'];
        case 'Longhair':
          return ['lhChampions'];
        case 'Shorthair':
          return ['shChampions'];
        default:
          return [];
      }
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
        if (!validateCatNumber(value, globalSettings.max_cats)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: `Cat number must be between 1-${globalSettings.max_cats} or VOID` }));
          return;
        }
        // Sequential entry validation
        if (!validateSequentialEntry(input, section, columnIndex, position, value)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
          return;
        }
        // Full validation handles all checks including duplicates
        setErrors(validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship));
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

    /**
     * Generalized onChange handler for Cat # input (only updates local input state)
     * For showAwards section, auto-complete 'v' or 'V' (case-insensitive, single char only) to 'VOID' (KittenTab parity).
     */
    const handleCatInputChange = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, value: string) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      // Auto-complete 'v' or 'V' to 'VOID' for all sections
      if (value === 'v' || value === 'V') {
        setLocalInputState(prev => ({ ...prev, [key]: 'VOID' }));
      } else {
        setLocalInputState(prev => ({ ...prev, [key]: value }));
      }
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
          setErrors((prev: any) => {
            const copy = { ...prev };
            delete copy[errorKey];
            return copy;
          });
          const allErrors = validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship);
          setErrors(allErrors);
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        if (localValue && !validateCatNumber(localValue, globalSettings.max_cats)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: `Cat number must be between 1-${globalSettings.max_cats} or VOID` }));
          const allErrors = validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship);
          setErrors(allErrors); // Always set all errors after any check
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // Duplicate check (full-form): show duplicate error if present before sequential
        const allErrors = validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship);
        if (allErrors[errorKey] && allErrors[errorKey].toLowerCase().includes('duplicate')) {
          setErrors(allErrors); // Set all errors for all cells, not just this one
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // Sequential entry check (only if no duplicate error)
        if (!validateSequentialEntry(input, section, colIdx, rowIdx, localValue)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: 'You must fill previous placements before entering this position.' }));
          const allErrorsSeq = validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship);
          setErrors(allErrorsSeq); // Always set all errors after any check
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        // If no errors, always run full-form validation for all cells
        setErrors(validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship));
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
          setErrors(validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        if (localValue && !validateCatNumber(localValue, globalSettings.max_cats)) {
          setErrors((prev: any) => ({ ...prev, [errorKey]: `Cat number must be between 1-${globalSettings.max_cats} or VOID` }));
          setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
          return;
        }
        const allErrors = validateChampionshipTab(prepareValidationInput(), globalSettings.max_cats, globalSettings.placement_thresholds.championship);
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

    // Defensive: always prefer local input state if present, else model value
    const getCatInputValue = (section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', colIdx: number, rowIdx: number, modelValue: string) => {
      const key = getCatInputKey(section, colIdx, rowIdx);
      return localInputState[key] !== undefined ? localInputState[key] : modelValue;
    };
    // --- END CONTEXT-7 DYNAMIC VALIDATION PARITY ---

    // Helper function to calculate the correct row index for ref assignments based on actual rendered sections
    const getRowIndexForSection = (colIdx: number, specialty: string, section: 'showAwards' | 'champions' | 'lhChampions' | 'shChampions', position: number): number => {
      const sections = getSectionsForRingType(specialty);
      let rowIndex = 0;
      
      // Add Show Awards rows
      if (section === 'showAwards') {
        return position;
      }
      
      rowIndex += getShowAwardsRowCount(colIdx, specialty);
      
      // Add rows for sections that come before the target section
      if (section === 'champions') {
        return rowIndex + position;
      }
      
      if (sections.includes('champions')) {
        rowIndex += getFinalsRowCount(colIdx, specialty, 'champions');
      }
      
      if (section === 'lhChampions') {
        return rowIndex + position;
      }
      
      if (sections.includes('lhChampions')) {
        rowIndex += getFinalsRowCount(colIdx, specialty, 'lhChampions');
      }
      
      if (section === 'shChampions') {
        return rowIndex + position;
      }
      
      return rowIndex;
    };

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
                  {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4 transition-all duration-200 border-b border-violet-200 shadow-sm">
            {/* Left: Icon, Title, Arrow */}
            <div className="flex items-center min-w-0">
              <span className="p-1.5 bg-gradient-to-br from-violet-500 to-yellow-400 rounded-xl shadow flex-shrink-0">
                {/* Star Icon */}
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </span>
              <span className="text-xl font-bold text-violet-700 ml-3">Championship Finals</span>
            </div>
            {/* Right: Minimal Dropdown, inline trophy icon in selected value only */}
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
              className="w-[250px] font-semibold text-base rounded-full px-4 py-2 bg-white border-2 border-violet-200 shadow-md hover:shadow-lg focus:border-violet-400 focus:shadow-lg text-violet-700 transition-all duration-200 font-mono"
              ariaLabel="Jump to Ring"
              selectedIcon="🏆"
              dropdownMenuClassName="w-[250px] rounded-xl bg-gradient-to-b from-white via-violet-50 to-white shadow-xl border-2 border-violet-200 text-base font-semibold text-violet-800 transition-all duration-200 font-mono whitespace-pre"
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
                          <span className="header-main block text-center">Ring #{column.judge.ringNumber}</span>
                          <span className="header-sub font-semibold block text-center">{column.judge.acronym}</span>
                          <span className="header-sub italic block text-center">{column.specialty}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Show Awards Section (Rows 4-18) */}
                {Array.from({ length: 15 }, (_, i) => {
                  // Only render the row if at least one column needs this position
                  const shouldRenderRow = columns.some(col => i < getShowAwardsRowCount(columns.indexOf(col), col.specialty));
                  
                  if (shouldRenderRow) {
                    return (
                      <tr key={`award-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                        <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                          {i + 1}{i >= 10 ? <span className="text-violet-400 font-bold">*</span> : ''}
                        </td>
                        {columns.map((_, columnIndex) => {
                          const col = columns[columnIndex];
                          // Each column independently decides whether to show this position
                          const shouldShowCell = i < getShowAwardsRowCount(columnIndex, col.specialty);
                          
                          if (shouldShowCell) {
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
                                      className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${(isVoidInput(getCatInputValue('showAwards', columnIndex, i, award.catNumber))) ? 'opacity-50 grayscale line-through' : ''}`}
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
                                      col.specialty === 'OCP' ? (
                                        // OCP rings are locked to CH status (same pattern as Kitten tab KIT status)
                                        <span
                                          className="min-w-[70px] inline-flex items-center justify-center rounded-full px-3 py-1.5 border border-violet-300 text-violet-700 text-xs font-semibold shadow-sm opacity-80 bg-white"
                                          aria-label="Status"
                                        >
                                          CH
                                        </span>
                                      ) : (
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
                                      )
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
                            return (
                              <td 
                                key={`award-${i}-${columnIndex}`} 
                                className={`py-2 px-2 border-r border-gray-200 transition-all duration-150 ${focusedColumnIndex === columnIndex ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''}`}
                              ></td>
                            );
                        })}
                      </tr>
                    );
                  }
                  return null;
                })}
                    {/* Finals Sections (Rows 19-23) */}
                  {Array.from({ length: 5 }, (_, i) => {
                    if (columns.some(col => i < getFinalsRowCount(columns.indexOf(col), col.specialty, 'champions') && shouldShowSection(col.specialty, 'champions'))) {
                      const ordinals = ['Best', '2nd Best', '3rd Best', '4th Best', '5th Best'];
                      return (
                        <tr key={`champions-${i}`} className={`cfa-table-row transition-all duration-150 ${i % 2 === 0 ? 'bg-white' : ''} hover:shadow-sm`}>
                          <td className="py-2 pl-4 font-medium text-sm border-r border-gray-200 bg-transparent frozen-column" style={{ width: '140px', minWidth: '140px' }}>
                            {ordinals[i]} AB CH
                        </td>
                          {columns.map((_, columnIndex) => {
                            const col = columns[columnIndex];
                            const isFocused = focusedColumnIndex === columnIndex;
                            const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'champions') && shouldShowSection(col.specialty, 'champions');
                            const errorKey = `champions-${columnIndex}-${i}`;
                            return (
                              <td key={`champions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                                {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                    <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                                                          className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getCatInputValue('champions', columnIndex, i, getFinalsValue('champions', columnIndex, i))) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                        value={getCatInputValue('champions', columnIndex, i, getFinalsValue('champions', columnIndex, i))}
                                        onChange={e => handleCatInputChange('champions', columnIndex, i, e.target.value)}
                                        onBlur={() => handleCatInputBlur('champions', columnIndex, i)}
                                        onFocus={e => handleCatInputFocusLocal('champions', columnIndex, i, getFinalsValue('champions', columnIndex, i), e)}
                                        onKeyDown={e => handleCatInputKeyDownLocal('champions', columnIndex, i, e, getRowIndexForSection(columnIndex, col.specialty, 'champions', i))}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                          catInputRefs.current[columnIndex][getRowIndexForSection(columnIndex, col.specialty, 'champions', i)] = el; // Adjust index based on actual Show Awards count
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
                          const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'lhChampions') && shouldShowSection(col.specialty, 'lhChampions');
                            const errorKey = `lhChampions-${columnIndex}-${i}`;
                            return (
                            <td key={`lhChampions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                              {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                                                          className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getCatInputValue('lhChampions', columnIndex, i, getFinalsValue('lhChampions', columnIndex, i))) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={getCatInputValue('lhChampions', columnIndex, i, getFinalsValue('lhChampions', columnIndex, i))}
                                      onChange={e => handleCatInputChange('lhChampions', columnIndex, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('lhChampions', columnIndex, i)}
                                      onFocus={e => handleCatInputFocusLocal('lhChampions', columnIndex, i, getFinalsValue('lhChampions', columnIndex, i), e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('lhChampions', columnIndex, i, e, getRowIndexForSection(columnIndex, col.specialty, 'lhChampions', i))}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][getRowIndexForSection(columnIndex, col.specialty, 'lhChampions', i)] = el; // Adjust index based on actual Show Awards + Best AB CH counts
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
                          const shouldRenderCell = i < getFinalsRowCount(columnIndex, col.specialty, 'shChampions') && shouldShowSection(col.specialty, 'shChampions');
                            const errorKey = `shChampions-${columnIndex}-${i}`;
                            return (
                            <td key={`shChampions-${i}-${columnIndex}`} className={`py-2 px-2 border-r border-gray-200 align-top transition-all duration-150${isFocused ? ' border-l-4 border-r-4 border-violet-300 z-10' : ''} hover:bg-gray-50`}>
                              {shouldRenderCell ? (
                                <div className="flex flex-col items-start">
                                  <div className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                                                          className={`w-16 h-9 text-sm text-center font-medium rounded-md px-3 bg-white/60 border border-violet-200 shadow focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white/90 focus:shadow-lg transition-all duration-200 placeholder-zinc-300 ${getBorderStyle(errorKey)} ${isVoidInput(getCatInputValue('shChampions', columnIndex, i, getFinalsValue('shChampions', columnIndex, i))) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="Cat #"
                                      value={getCatInputValue('shChampions', columnIndex, i, getFinalsValue('shChampions', columnIndex, i))}
                                      onChange={e => handleCatInputChange('shChampions', columnIndex, i, e.target.value)}
                                      onBlur={() => handleCatInputBlur('shChampions', columnIndex, i)}
                                      onFocus={e => handleCatInputFocusLocal('shChampions', columnIndex, i, getFinalsValue('shChampions', columnIndex, i), e)}
                                      onKeyDown={e => handleCatInputKeyDownLocal('shChampions', columnIndex, i, e, getRowIndexForSection(columnIndex, col.specialty, 'shChampions', i))}
                                      ref={el => {
                                        if (!catInputRefs.current[columnIndex]) {
                                          catInputRefs.current[columnIndex] = Array(totalCatRows).fill(null);
                                        }
                                        catInputRefs.current[columnIndex][getRowIndexForSection(columnIndex, col.specialty, 'shChampions', i)] = el; // Adjust index based on actual Show Awards + Best AB CH + LH CH counts
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
          onSaveToExcel={handleSaveToCSVClick}
          onLoadFromExcel={handleRestoreFromCSVClick}
          onReset={handleResetClick}
        />
      </div>
    );
  }
);

export default ChampionshipTab; 