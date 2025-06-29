import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import Modal from './Modal';
import { 
  validateChampionshipTab, 
  validateCatNumber, 
  checkDuplicateCatNumbersInShowAwards,
  checkDuplicateCatNumbersInChampionsFinals,
  checkDuplicateCatNumbersInLHChampionsFinals,
  checkDuplicateCatNumbersInSHChampionsFinals,
  validateSequentialEntry,
  type ChampionshipValidationInput,
  type CellData
} from '../validation/championshipValidation';
import { handleSaveToTempCSV, handleGenerateFinalCSV, handleRestoreFromCSV, handleReset } from '../utils/formActions';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface ChampionshipTabProps {
  judges: Judge[];
  championshipTotal: number;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo?: (title: string, message?: string, duration?: number) => void;
  shouldFillTestData?: boolean;
  onResetAllData?: () => void;
}

interface Column {
  judge: Judge;
  specialty: string;
}

export interface ChampionshipTabRef {
  fillTestData: () => void;
}

const ChampionshipTab = forwardRef<ChampionshipTabRef, ChampionshipTabProps>(
  ({ judges, championshipTotal, showSuccess, showError, showInfo: _showInfo, shouldFillTestData, onResetAllData }, ref) => {
    // State for dynamic table structure
    const [columns, setColumns] = useState<Column[]>([]);
    const [numAwardRows, setNumAwardRows] = useState(10);
    
    // State for all championship tab data (atomic updates)
    interface ChampionshipData {
      showAwards: { [key: string]: CellData };
      championsFinals: { [key: string]: string };
      lhChampionsFinals: { [key: string]: string };
      shChampionsFinals: { [key: string]: string };
    }
    const [championshipData, setChampionshipData] = useState<ChampionshipData>({
      showAwards: {},
      championsFinals: {},
      lhChampionsFinals: {},
      shChampionsFinals: {}
    });
    // State for validation errors and modal
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // 1. Add localInputState for text fields
    const [localInputState, setLocalInputState] = useState<{ [key: string]: string }>({});

    // 1. Define a bright yellow color for alerting CH cells
    const BRIGHT_YELLOW = '#FFF700'; // Eye-pleasing, alert yellow

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

    // Helper function to create validation input object
    const createValidationInput = (): ChampionshipValidationInput => ({
      columns,
      showAwards: championshipData.showAwards,
      championsFinals: championshipData.championsFinals,
      lhChampionsFinals: championshipData.lhChampionsFinals,
      shChampionsFinals: championshipData.shChampionsFinals,
      championshipTotal
    });

    // Update show awards - update state and trigger full validation
    const updateShowAward = (columnIndex: number, position: number, field: 'catNumber' | 'status', value: string) => {
      const key = `${columnIndex}-${position}`;
      setChampionshipData(prev => {
        // Get current state for this position, using default if not exists
        const currentAward = prev.showAwards[key] || { catNumber: '', status: 'GC' };
        
        return {
          ...prev,
          showAwards: {
            ...prev.showAwards,
            [key]: {
              ...currentAward,
              [field]: value
            }
          }
        };
      });
    };

    // Handle blur events for show awards - run all validation here
    const handleShowAwardBlur = (columnIndex: number, position: number, field: 'catNumber' | 'status', value: string) => {
      const key = `${columnIndex}-${position}`;
      const input = createValidationInput();
      
      // Run basic validation for this input
      if (field === 'catNumber' && value.trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(value)) {
          setErrors(prev => ({ ...prev, [key]: 'Cat number must be between 1-450 or VOID (all caps)' }));
          return;
        }
        // Skip further validation for VOID entries
        if (value.trim().toUpperCase() === 'VOID') return;
        // Sequential entry validation
        if (!validateSequentialEntry(input, 'showAwards', columnIndex, position, value)) {
          setErrors(prev => ({ ...prev, [key]: 'Must fill positions sequentially (no skipping positions)' }));
          return;
        }
        // Duplicate validation
        if (checkDuplicateCatNumbersInShowAwards(input, columnIndex, value, key)) {
          setErrors(prev => ({ ...prev, [key]: 'Duplicate cat number within this column' }));
          return;
        }
      }
      
      // Always trigger full validation after any blur to ensure all relationship-based errors are applied
      setErrors(validateChampionshipTab(createValidationInput()));
    };

    // Update finals - update state and trigger full validation
    const updateFinals = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number, value: string) => {
      const key = `${columnIndex}-${position}`;
      setChampionshipData(prev => ({
        ...prev,
        [section === 'champions' ? 'championsFinals' : section === 'lhChampions' ? 'lhChampionsFinals' : 'shChampionsFinals']:
          {
            ...prev[section === 'champions' ? 'championsFinals' : section === 'lhChampions' ? 'lhChampionsFinals' : 'shChampionsFinals'],
            [key]: value
          }
      }));
    };

    // Handle blur events for finals - run all validation here
    const handleFinalsBlur = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number, value: string) => {
      const errorKey = `${section}-${columnIndex}-${position}`;
      const key = `${columnIndex}-${position}`;
      const input = createValidationInput();
      
      // Run basic validation for this input
      if (value.trim() !== '') {
        // Validate cat number format
        if (!validateCatNumber(value)) {
          setErrors(prev => ({ ...prev, [errorKey]: 'Cat number must be between 1-450 or VOID (all caps)' }));
          return;
        }
        // Skip further validation for VOID entries
        if (value.trim().toUpperCase() === 'VOID') return;
        // Sequential entry validation
        if (!validateSequentialEntry(input, section, columnIndex, position, value)) {
          setErrors(prev => ({ ...prev, [errorKey]: 'Must fill positions sequentially (no skipping positions)' }));
          return;
        }
        // Duplicate validation
        let hasDuplicate = false;
        switch (section) {
          case 'champions':
            hasDuplicate = checkDuplicateCatNumbersInChampionsFinals(input, columnIndex, value, key);
            break;
          case 'lhChampions':
            hasDuplicate = checkDuplicateCatNumbersInLHChampionsFinals(input, columnIndex, value, key);
            break;
          case 'shChampions':
            hasDuplicate = checkDuplicateCatNumbersInSHChampionsFinals(input, columnIndex, value, key);
            break;
        }
        if (hasDuplicate) {
          setErrors(prev => ({ ...prev, [errorKey]: 'Duplicate cat number within this section' }));
          return;
        }
      }
      
      // Always trigger full validation after any blur to ensure all relationship-based errors are applied
      setErrors(validateChampionshipTab(createValidationInput()));
    };

    // Getter functions
    const getShowAward = (columnIndex: number, position: number): CellData => {
      const key = `${columnIndex}-${position}`;
      return championshipData.showAwards[key] || { catNumber: '', status: 'GC' };
    };

    const getFinalsValue = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number, position: number): string => {
      const key = `${columnIndex}-${position}`;
      switch (section) {
        case 'champions': return championshipData.championsFinals[key] || '';
        case 'lhChampions': return championshipData.lhChampionsFinals[key] || '';
        case 'shChampions': return championshipData.shChampionsFinals[key] || '';
      }
    };

    const isFinalsEnabled = (section: 'champions' | 'lhChampions' | 'shChampions', columnIndex: number): boolean => {
      const column = columns[columnIndex];
      if (!column) return false;
      
      switch (section) {
        case 'champions':
          // Best CH section only enabled for Allbreed rings
          return column.specialty === 'Allbreed';
        case 'lhChampions':
          // Best LH CH section enabled for Longhair and Allbreed rings
          return column.specialty === 'Longhair' || column.specialty === 'Allbreed';
        case 'shChampions':
          // Best SH CH section enabled for Shorthair and Allbreed rings
          return column.specialty === 'Shorthair' || column.specialty === 'Allbreed';
        default:
          return false;
      }
    };

    // Helper to get Best CH cat numbers for a column (Allbreed only)
    const getBestCHCats = (columnIndex: number): string[] => {
      const numFinalsPositions = championshipTotal >= 85 ? 5 : 3;
      const bestCH: string[] = [];
      for (let i = 0; i < numFinalsPositions; i++) {
        const key = `${columnIndex}-${i}`;
        const value = championshipData.championsFinals[key];
        if (value && value.trim().toUpperCase() !== 'VOID') bestCH.push(value.trim());
      }
      return bestCH;
    };

    // Helper to get all CH cat numbers from Show Awards for a column
    const getCHCatNumbersFromShowAwards = (columnIndex: number): string[] => {
      const numAwardRows = championshipTotal >= 85 ? 15 : 10;
      const chCats: string[] = [];
      for (let i = 0; i < numAwardRows; i++) {
        const key = `${columnIndex}-${i}`;
        const award = championshipData.showAwards[key];
        if (award && award.status === 'CH' && award.catNumber && award.catNumber.trim().toUpperCase() !== 'VOID') {
          chCats.push(award.catNumber.trim());
        }
      }
      return chCats;
    };

    // Helper to get Best Allbreed Champion cat numbers for a column
    const getBestAllbreedChampionCats = (columnIndex: number): string[] => {
      const column = columns[columnIndex];
      if (!column || column.specialty !== 'Allbreed') return [];
      
      const numFinalsPositions = championshipTotal >= 85 ? 5 : 3;
      const bestCHCats: string[] = [];
      for (let i = 0; i < numFinalsPositions; i++) {
        const key = `${columnIndex}-${i}`;
        const value = championshipData.championsFinals[key];
        if (value && value.trim() !== '' && value.trim().toUpperCase() !== 'VOID') {
          bestCHCats.push(value.trim());
        }
      }
      return bestCHCats;
    };

    // Helper to check if navy blue outline should be applied
    const shouldApplyNavyBlueOutline = (columnIndex: number, value: string): boolean => {
      const chCats = getCHCatNumbersFromShowAwards(columnIndex);
      const bestCHCats = getBestAllbreedChampionCats(columnIndex);
      
      // Apply navy blue outline if:
      // 1. No CH cats in Show Awards section
      // 2. There are Best Allbreed Champion cats
      // 3. This value matches one of the Best Allbreed Champion cats
      return chCats.length === 0 && bestCHCats.length > 0 && bestCHCats.includes(value.trim());
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
      
      // Helper function to shuffle array
      function shuffle<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }
      
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
        for (let position = 0; position < numAwardRows; position++) {
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
        for (let position = 0; position < numAwardRows; position++) {
          const key = `${columnIndex}-${position}`;
          const award = newShowAwards[key];
          if (award.status === 'CH') {
            chCats.push(award.catNumber);
          }
        }
        
        // Finals Test Data:
        // For Allbreed columns, Best CH gets ALL CH cats, then split between LH and SH maintaining order
        // All other Championship tab validation rules must be enforced in the generated test data.
        const numFinalsPositions = championshipTotal >= 85 ? 5 : 3;
        
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
      setChampionshipData({
        showAwards: newShowAwards,
        championsFinals: newChampionsFinals,
        lhChampionsFinals: newLhChampionsFinals,
        shChampionsFinals: newShChampionsFinals
      });
      setErrors({});
      // After state is updated, trigger a full-form validation to clear any stale errors
      setTimeout(() => {
        setErrors(validateChampionshipTab({
          columns,
          showAwards: newShowAwards,
          championsFinals: newChampionsFinals,
          lhChampionsFinals: newLhChampionsFinals,
          shChampionsFinals: newShChampionsFinals,
          championshipTotal
        }));
      }, 0);
      showSuccess('Test Data Filled', 'Championship tab has been filled with realistic test data that complies with all validation rules.');
    }, [judges, championshipTotal, columns, numAwardRows, showSuccess]);

    // Expose fillTestData function through ref
    useImperativeHandle(ref, () => ({
      fillTestData
    }), [judges, championshipTotal, columns, fillTestData]);

    // Effect to automatically fill test data when shouldFillTestData is true
    useEffect(() => {
      if (shouldFillTestData && judges.length > 0 && championshipTotal > 0 && columns.length > 0) {
        // Call fillTestData immediately
        fillTestData();
      }
    }, [shouldFillTestData, judges.length, championshipTotal, columns.length, fillTestData]);

    // Add useEffect to run validation after any relevant state change
    useEffect(() => {
      setErrors(validateChampionshipTab({
        columns,
        showAwards: championshipData.showAwards,
        championsFinals: championshipData.championsFinals,
        lhChampionsFinals: championshipData.lhChampionsFinals,
        shChampionsFinals: championshipData.shChampionsFinals,
        championshipTotal
      }));
    }, [columns, championshipData, championshipTotal]);

    // Action button handlers
    const handleSaveToTempCSVClick = () => {
      const errors = validateChampionshipTab({
        columns,
        showAwards: championshipData.showAwards,
        championsFinals: championshipData.championsFinals,
        lhChampionsFinals: championshipData.lhChampionsFinals,
        shChampionsFinals: championshipData.shChampionsFinals,
        championshipTotal
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
      handleSaveToTempCSV({ columns, showAwards: championshipData.showAwards, championsFinals: championshipData.championsFinals, lhChampionsFinals: championshipData.lhChampionsFinals, shChampionsFinals: championshipData.shChampionsFinals, championshipTotal }, showSuccess, showError);
    };

    const handleGenerateFinalCSVClick = () => {
      const errors = validateChampionshipTab({
        columns,
        showAwards: championshipData.showAwards,
        championsFinals: championshipData.championsFinals,
        lhChampionsFinals: championshipData.lhChampionsFinals,
        shChampionsFinals: championshipData.shChampionsFinals,
        championshipTotal
      });
      setErrors(errors);
      if (Object.keys(errors).length > 0) {
        showError(
          'Championship Validation Errors',
          'Please fix all validation errors before generating the final CSV. Check the form for highlighted fields with errors.',
          8000
        );
        return;
      }
      handleGenerateFinalCSV({ columns, showAwards: championshipData.showAwards, championsFinals: championshipData.championsFinals, lhChampionsFinals: championshipData.lhChampionsFinals, shChampionsFinals: championshipData.shChampionsFinals, championshipTotal }, showSuccess, showError);
    };

    const handleRestoreFromCSVClick = () => {
      handleRestoreFromCSV({ columns, showAwards: championshipData.showAwards, championsFinals: championshipData.championsFinals, lhChampionsFinals: championshipData.lhChampionsFinals, shChampionsFinals: championshipData.shChampionsFinals, championshipTotal }, showSuccess, showError);
    };

    const handleResetClick = () => {
      handleReset(setIsResetModalOpen);
    };

    const confirmReset = () => {
      setIsResetModalOpen(false);
      
      // Call the parent's reset function to reset all data and return to General tab
      if (onResetAllData) {
        onResetAllData();
      }
    };

    // Helper function to check if an error message is actually a warning
    const isWarning = (message: string): boolean => {
      return message.startsWith('[WARNING]');
    };
    // Helper function to check if an error message is actually a reminder
    const isReminder = (message: string): boolean => {
      return message.startsWith('[REMINDER]');
    };

    // Helper function to get the clean message (remove [REMINDER] or [WARNING] prefix)
    const getCleanMessage = (message: string): string => {
      if (isReminder(message)) return message.replace('[REMINDER] ', '');
      if (isWarning(message)) return message.replace('[WARNING] ', '');
      return message;
    };

    // Helper function to get appropriate styling for errors vs warnings vs reminders
    const getErrorStyle = (message: string) => {
      if (isReminder(message)) {
        return { color: '#003366' }; // Navy blue for reminders
      }
      if (isWarning(message)) {
        return { color: '#f97316' }; // Orange color for warnings
      }
      return { color: '#ef4444' }; // Red color for errors
    };

    // Helper function to get appropriate border styling for errors vs warnings
    const getBorderStyle = (errorKey: string, message: string) => {
      if (errors[errorKey]) {
        if (isWarning(message)) {
          return 'border-orange-500'; // Orange border for warnings
        }
        return 'border-red-500'; // Red border for errors
      }
      return 'border-gray-300';
    };

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

        <div className="cfa-section">
          <h2 className="cfa-section-header">Championship Finals</h2>
          
          {/* Legend for VOID entries */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-blue-600 mr-2 mt-0.5">💡</div>
              <div className="text-sm text-blue-800">
                <span className="font-medium">Tip:</span> You can enter <span className="font-mono font-semibold text-blue-900">VOID</span> (in all capital letters) in any cat number field to indicate that the award placement is voided for that position.
              </div>
            </div>
          </div>

          <div className="cfa-table overflow-x-auto">
            <table className="border-collapse" style={{ width: 'auto', tableLayout: 'fixed' }}>
              <thead>
                {/* Header Row 1: Ring Numbers */}
                <tr className="cfa-table-header">
                  <th className="text-left py-2 pl-4 font-medium border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}></th>
                  {columns.map((column, index) => (
                    <th key={`ring-${index}`} className="text-center py-2 px-2 font-medium text-sm border-r border-gray-300" style={{ width: '120px', minWidth: '120px' }}>
                      Ring {column.judge.id}
                    </th>
                  ))}
                </tr>

                {/* Header Row 2: Judge Acronyms */}
                <tr className="cfa-table-header">
                  <th className="text-left py-2 pl-4 font-medium border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}></th>
                  {columns.map((column, index) => (
                    <th key={`acronym-${index}`} className="text-center py-2 px-2 font-medium text-sm border-r border-gray-300" style={{ width: '120px', minWidth: '120px' }}>
                      {column.judge.acronym}
                    </th>
                  ))}
                </tr>

                {/* Header Row 3: Ring Types */}
                <tr className="cfa-table-header">
                  <th className="text-left py-2 pl-4 font-medium border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}>Position</th>
                  {columns.map((column, index) => (
                    <th key={`type-${index}`} className="text-center py-2 px-2 font-medium text-sm border-r border-gray-300" style={{ width: '120px', minWidth: '120px' }}>
                      {column.specialty}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Show Awards Section (Rows 4-18) */}
                {Array.from({ length: numAwardRows }, (_, i) => (
                  <tr key={`award-${i}`} className="cfa-table-row">
                    {/*
                      Show Awards label column: always white background (default),
                      but for consistency, we could add a class if needed in the future.
                    */}
                    <td className="py-2 pl-4 font-medium text-sm border-r border-gray-300 bg-white" style={{ width: '140px', minWidth: '140px' }}>
                      {i + 1}{i >= 10 ? '*' : ''}
                    </td>
                    {columns.map((_column, columnIndex) => {
                      const award = getShowAward(columnIndex, i);
                      const errorKey = `${columnIndex}-${i}`;
                      // In Show Awards section, add orange border to cat number input if status is 'CH'
                      const orangeBorderStyle = { border: '2px solid orange' };
                      return (
                        <td key={`award-${i}-${columnIndex}`} className="py-2 px-2 border-r border-gray-300 align-top">
                          <div className="flex flex-col">
                            <div className="flex gap-1 items-center justify-center">
                              <input
                                type="text"
                                className={`w-12 h-7 text-xs text-center border rounded px-1 ${getBorderStyle(errorKey, errors[errorKey] || '')} focus:border-cfa-gold focus:outline-none`}
                                placeholder="Cat #"
                                value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : award.catNumber}
                                onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                onBlur={(e) => {
                                  updateShowAward(columnIndex, i, 'catNumber', e.target.value);
                                  setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                  handleShowAwardBlur(columnIndex, i, 'catNumber', e.target.value);
                                }}
                                style={award.status === 'CH' ? orangeBorderStyle : {}}
                              />
                              <select
                                className="w-14 h-7 text-xs border border-gray-300 rounded focus:border-cfa-gold focus:outline-none"
                                value={award.status}
                                onChange={(e) => updateShowAward(columnIndex, i, 'status', e.target.value)}
                              >
                                <option value="GC">GC</option>
                                <option value="CH">CH</option>
                                <option value="NOV">NOV</option>
                              </select>
                            </div>
                            {errors[errorKey] && (
                              <div className="text-xs mt-1 text-center" style={getErrorStyle(errors[errorKey])}>{getCleanMessage(errors[errorKey])}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Champions Finals Section (Rows 19-23) */}
                {(championshipTotal >= 85 ? 
                  ['Best CH', '2nd CH', '3rd CH', '4th CH', '5th CH'] :
                  ['Best CH', '2nd CH', '3rd CH']
                ).map((label, i) => (
                  <tr key={`ch-final-${i}`} className="cfa-table-row">
                    {/* Finals label column: bright yellow background for Best CH */}
                    <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}>
                      {getOrdinalLabel(i, 'AB')}
                    </td>
                    {columns.map((_column, columnIndex) => {
                      const enabled = isFinalsEnabled('champions', columnIndex);
                      const value = getFinalsValue('champions', columnIndex, i);
                      const errorKey = `champions-${columnIndex}-${i}`;
                      // In Best CH, Best LH CH, Best SH CH sections, add orange border if value is in CH cat numbers from Show Awards
                      const chCatNumbers = getCHCatNumbersFromShowAwards(columnIndex);
                      const isCHFromShowAwards = chCatNumbers.includes(value.trim());
                      const orangeBorderStyle = { border: '2px solid orange' };
                      // Navy blue outline logic: apply if no CH cats in Show Awards but this is a Best Allbreed Champion cat
                      const isNavyBlueOutline = shouldApplyNavyBlueOutline(columnIndex, value);
                      const navyBlueBorderStyle = { border: '2px solid #003366' }; // CFA navy blue
                      // Orange takes priority over navy blue
                      const borderStyle = isCHFromShowAwards ? orangeBorderStyle : (isNavyBlueOutline ? navyBlueBorderStyle : {});
                      return (
                        <td key={`ch-final-${i}-${columnIndex}`} className="py-2 px-2 border-r border-gray-300 align-top">
                          <div className="flex flex-col">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                className={`w-20 h-7 text-xs text-center border rounded px-1 font-medium ${
                                  !enabled ? 'bg-gray-100 cursor-not-allowed' : 
                                  getBorderStyle(errorKey, errors[errorKey] || '')
                                } focus:border-cfa-gold focus:outline-none`}
                                placeholder={enabled ? "Cat #" : ""}
                                value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                disabled={!enabled}
                                onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                onBlur={(e) => {
                                  updateFinals('champions', columnIndex, i, e.target.value);
                                  setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                  handleFinalsBlur('champions', columnIndex, i, e.target.value);
                                }}
                                style={borderStyle}
                              />
                            </div>
                            {errors[errorKey] && (
                              <div className="text-xs mt-1 text-center" style={getErrorStyle(errors[errorKey])}>{getCleanMessage(errors[errorKey])}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Longhair Champions Finals Section (Rows 24-28) */}
                {(championshipTotal >= 85 ?
                  ['Best LH CH', '2nd LH CH', '3rd LH CH', '4th LH CH', '5th LH CH'] :
                  ['Best LH CH', '2nd LH CH', '3rd LH CH']
                ).map((label, i) => (
                  <tr key={`lh-final-${i}`} className="cfa-table-row">
                    {/* Finals label column: pale blue background for Best LH CH */}
                    <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}>
                      {getOrdinalLabel(i, 'LH')}
                    </td>
                    {columns.map((_column, columnIndex) => {
                      const enabled = isFinalsEnabled('lhChampions', columnIndex);
                      const value = getFinalsValue('lhChampions', columnIndex, i);
                      const errorKey = `lhChampions-${columnIndex}-${i}`;
                      // In Best LH CH, Best SH CH sections, add orange border if value is in CH cat numbers from Show Awards
                      const chCatNumbers = getCHCatNumbersFromShowAwards(columnIndex);
                      const isCHFromShowAwards = chCatNumbers.includes(value.trim());
                      const orangeBorderStyle = { border: '2px solid orange' };
                      // Navy blue outline logic: apply if no CH cats in Show Awards but this is a Best Allbreed Champion cat
                      const isNavyBlueOutline = shouldApplyNavyBlueOutline(columnIndex, value);
                      const navyBlueBorderStyle = { border: '2px solid #003366' }; // CFA navy blue
                      // Orange takes priority over navy blue
                      const borderStyle = isCHFromShowAwards ? orangeBorderStyle : (isNavyBlueOutline ? navyBlueBorderStyle : {});
                      return (
                        <td key={`lh-final-${i}-${columnIndex}`} className="py-2 px-2 border-r border-gray-300 align-top">
                          <div className="flex flex-col">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                className={`w-20 h-7 text-xs text-center border rounded px-1 font-medium ${
                                  !enabled ? 'bg-gray-100 cursor-not-allowed' : 
                                  getBorderStyle(errorKey, errors[errorKey] || '')
                                } focus:border-cfa-gold focus:outline-none`}
                                placeholder={enabled ? "Cat #" : ""}
                                value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                disabled={!enabled}
                                onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                onBlur={(e) => {
                                  updateFinals('lhChampions', columnIndex, i, e.target.value);
                                  setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                  handleFinalsBlur('lhChampions', columnIndex, i, e.target.value);
                                }}
                                style={borderStyle}
                              />
                            </div>
                            {errors[errorKey] && (
                              <div className="text-xs mt-1 text-center" style={getErrorStyle(errors[errorKey])}>{getCleanMessage(errors[errorKey])}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Shorthair Champions Finals Section (Rows 29-33) */}
                {(championshipTotal >= 85 ?
                  ['Best SH CH', '2nd SH CH', '3rd SH CH', '4th SH CH', '5th SH CH'] :
                  ['Best SH CH', '2nd SH CH', '3rd SH CH']
                ).map((label, i) => (
                  <tr key={`sh-final-${i}`} className="cfa-table-row">
                    {/* Finals label column: pale green background for Best SH CH */}
                    <td className="py-2 pl-4 font-medium text-sm text-black border-r border-gray-300" style={{ width: '140px', minWidth: '140px' }}>
                      {getOrdinalLabel(i, 'SH')}
                    </td>
                    {columns.map((_column, columnIndex) => {
                      const enabled = isFinalsEnabled('shChampions', columnIndex);
                      const value = getFinalsValue('shChampions', columnIndex, i);
                      const errorKey = `shChampions-${columnIndex}-${i}`;
                      // In Best LH CH, Best SH CH sections, add orange border if value is in CH cat numbers from Show Awards
                      const chCatNumbers = getCHCatNumbersFromShowAwards(columnIndex);
                      const isCHFromShowAwards = chCatNumbers.includes(value.trim());
                      const orangeBorderStyle = { border: '2px solid orange' };
                      // Navy blue outline logic: apply if no CH cats in Show Awards but this is a Best Allbreed Champion cat
                      const isNavyBlueOutline = shouldApplyNavyBlueOutline(columnIndex, value);
                      const navyBlueBorderStyle = { border: '2px solid #003366' }; // CFA navy blue
                      // Orange takes priority over navy blue
                      const borderStyle = isCHFromShowAwards ? orangeBorderStyle : (isNavyBlueOutline ? navyBlueBorderStyle : {});
                      return (
                        <td key={`sh-final-${i}-${columnIndex}`} className="py-2 px-2 border-r border-gray-300 align-top">
                          <div className="flex flex-col">
                            <div className="flex justify-center">
                              <input
                                type="text"
                                className={`w-20 h-7 text-xs text-center border rounded px-1 font-medium ${
                                  !enabled ? 'bg-gray-100 cursor-not-allowed' : 
                                  getBorderStyle(errorKey, errors[errorKey] || '')
                                } focus:border-cfa-gold focus:outline-none`}
                                placeholder={enabled ? "Cat #" : ""}
                                value={localInputState[errorKey] !== undefined ? localInputState[errorKey] : value}
                                disabled={!enabled}
                                onChange={(e) => setLocalInputState(prev => ({ ...prev, [errorKey]: e.target.value }))}
                                onBlur={(e) => {
                                  updateFinals('shChampions', columnIndex, i, e.target.value);
                                  setLocalInputState(prev => { const copy = { ...prev }; delete copy[errorKey]; return copy; });
                                  handleFinalsBlur('shChampions', columnIndex, i, e.target.value);
                                }}
                                style={borderStyle}
                              />
                            </div>
                            {errors[errorKey] && (
                              <div className="text-xs mt-1 text-center" style={getErrorStyle(errors[errorKey])}>{getCleanMessage(errors[errorKey])}</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

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
                onClick={handleSaveToTempCSVClick}
                className="cfa-button"
              >
                Save to Temp CSV
              </button>
              <button
                type="button"
                onClick={handleGenerateFinalCSVClick}
                className="cfa-button"
              >
                Generate Final CSV
              </button>
              <button
                type="button"
                onClick={handleRestoreFromCSVClick}
                className="cfa-button-secondary"
              >
                Restore from CSV
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