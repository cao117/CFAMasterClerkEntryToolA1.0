import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import { handleSaveToExcel } from '../utils/excelExport';
import { 
  validateBreedSheetsTab, 
  validateBreedSheetsField,
  validateCatNumber,
  isVoidInput
} from '../validation/breedSheetsValidation';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface BreedSheetsTabProps {
  judges: Judge[];
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo?: (title: string, message?: string, duration?: number) => void;
  onResetAllData?: () => void;
  /**
   * Breed sheets tab data state, lifted to App.tsx for persistence across tab switches
   */
  breedSheetsTabData: BreedSheetsTabData;
  /**
   * Setter for breed sheets tab data
   */
  setBreedSheetsTabData: React.Dispatch<React.SetStateAction<BreedSheetsTabData>>;
  /**
   * Handler to reset only the Breed Sheets tab data
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
   * Global settings containing breed lists and max_cats for validation
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
  /**
   * Show counts for determining class visibility
   */
  showCounts: {
    championshipCounts: {
      lhGcs: number;
      shGcs: number;
      lhChs: number;
      shChs: number;
      lhNovs: number;
      shNovs: number;
    };
    premiershipCounts: {
      lhGps: number;
      shGps: number;
      lhPrs: number;
      shPrs: number;
      lhNovs: number;
      shNovs: number;
    };
    kittenCounts: {
      lhKittens: number;
      shKittens: number;
    };
  };
}

// Breed Sheets Tab Data structure
export type BreedSheetsTabData = {
  selectedJudgeId: number | null;
  selectedGroup: 'Championship' | 'Premiership' | 'Kitten';
  selectedHairLength: 'Longhair' | 'Shorthair';
  breedEntries: { 
    [judgeId: string]: { 
      [groupHairLengthKey: string]: { 
        [breedKey: string]: { 
          bob: string; 
          secondBest: string; 
          bestCH?: string; 
          bestPR?: string 
        } 
      } 
    } 
  };
  errors: { [key: string]: string };
  pingTriggered: boolean;
};

// Breed lists are now provided via globalSettings prop

/**
 * BreedSheetsTab component for CFA Master Clerk Entry Tool
 *
 * This component renders the Breed Sheets tab with a left panel judge selector
 * and right panel breed sheet grid organized by class and hair length.
 *
 * @component
 * @param {BreedSheetsTabProps} props - The props for the BreedSheetsTab
 */
const BreedSheetsTab: React.FC<BreedSheetsTabProps> = (props) => {
  const { 
    judges, 
    showSuccess, 
    showError, 
    onResetAllData, 
    breedSheetsTabData, 
    setBreedSheetsTabData, 
    getShowState, 
    isActive, 
    onCSVImport,
    globalSettings,
    showCounts 
  } = props;

  // State for modals
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isTabResetModalOpen, setIsTabResetModalOpen] = useState(false);
  const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false);

  // State for breed search
  const [breedSearchTerm, setBreedSearchTerm] = useState('');

  // Local input state for blur-based validation
  const [localInputState, setLocalInputState] = useState<{ [key: string]: string }>({});

  // Refs for scrolling
  const rightPanelRef = useRef<HTMLDivElement>(null);

  /**
   * Gets available groups based on show counts (including NOV for breed sheets)
   */
  const getAvailableGroups = (): Array<'Championship' | 'Premiership' | 'Kitten'> => {
    const groups: Array<'Championship' | 'Premiership' | 'Kitten'> = [];
    
    // Championship - include NOV cats for breed sheets (they can get BoB/2BoB)
    const chLHCount = showCounts.championshipCounts.lhGcs + showCounts.championshipCounts.lhChs + showCounts.championshipCounts.lhNovs;
    const chSHCount = showCounts.championshipCounts.shGcs + showCounts.championshipCounts.shChs + showCounts.championshipCounts.shNovs;
    if (chLHCount > 0 || chSHCount > 0) groups.push('Championship');
    
    // Premiership - include NOV cats for breed sheets (they can get BoB/2BoB)
    const prLHCount = showCounts.premiershipCounts.lhGps + showCounts.premiershipCounts.lhPrs + showCounts.premiershipCounts.lhNovs;
    const prSHCount = showCounts.premiershipCounts.shGps + showCounts.premiershipCounts.shPrs + showCounts.premiershipCounts.shNovs;
    if (prLHCount > 0 || prSHCount > 0) groups.push('Premiership');
    
    // Kitten
    const kitLHCount = showCounts.kittenCounts.lhKittens;
    const kitSHCount = showCounts.kittenCounts.shKittens;
    if (kitLHCount > 0 || kitSHCount > 0) groups.push('Kitten');
    
    return groups;
  };

  /**
   * Filters breeds based on search term
   */
  const getFilteredBreeds = (breeds: string[]): string[] => {
    if (!breedSearchTerm.trim()) return breeds;
    return breeds.filter(breed => 
      breed.toLowerCase().includes(breedSearchTerm.toLowerCase())
    );
  };

  /**
   * Gets available hair lengths for selected group and judge (including NOV for breed sheets)
   */
  const getAvailableHairLengths = (): Array<'Longhair' | 'Shorthair'> => {
    const selectedJudge = getSelectedJudge();
    if (!selectedJudge) return [];
    
    const currentGroup = breedSheetsTabData.selectedGroup;
    const hairLengths: Array<'Longhair' | 'Shorthair'> = [];
    
    switch (currentGroup) {
      case 'Championship':
        // Include NOV cats for breed sheets (they can get BoB/2BoB)
        const chLHCount = showCounts.championshipCounts.lhGcs + showCounts.championshipCounts.lhChs + showCounts.championshipCounts.lhNovs;
        const chSHCount = showCounts.championshipCounts.shGcs + showCounts.championshipCounts.shChs + showCounts.championshipCounts.shNovs;
        if (chLHCount > 0 && (selectedJudge.ringType === 'Longhair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed' || selectedJudge.ringType === 'OCP Ring')) {
          hairLengths.push('Longhair');
        }
        if (chSHCount > 0 && (selectedJudge.ringType === 'Shorthair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed' || selectedJudge.ringType === 'OCP Ring')) {
          hairLengths.push('Shorthair');
        }
        break;
      case 'Premiership':
        // Include NOV cats for breed sheets (they can get BoB/2BoB)
        const prLHCount = showCounts.premiershipCounts.lhGps + showCounts.premiershipCounts.lhPrs + showCounts.premiershipCounts.lhNovs;
        const prSHCount = showCounts.premiershipCounts.shGps + showCounts.premiershipCounts.shPrs + showCounts.premiershipCounts.shNovs;
        if (prLHCount > 0 && (selectedJudge.ringType === 'Longhair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed' || selectedJudge.ringType === 'OCP Ring')) {
          hairLengths.push('Longhair');
        }
        if (prSHCount > 0 && (selectedJudge.ringType === 'Shorthair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed' || selectedJudge.ringType === 'OCP Ring')) {
          hairLengths.push('Shorthair');
        }
        break;
      case 'Kitten':
        const kitLHCount = showCounts.kittenCounts.lhKittens;
        const kitSHCount = showCounts.kittenCounts.shKittens;
        if (kitLHCount > 0 && (selectedJudge.ringType === 'Longhair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed')) {
          hairLengths.push('Longhair');
        }
        if (kitSHCount > 0 && (selectedJudge.ringType === 'Shorthair' || selectedJudge.ringType === 'Double Specialty' || selectedJudge.ringType === 'Super Specialty' || selectedJudge.ringType === 'Allbreed')) {
          hairLengths.push('Shorthair');
        }
        break;
    }
    
    return hairLengths;
  };

  /**
   * Gets breeds to show based on judge ring type
   */
  const getBreedsForJudge = (judge: Judge): { lhBreeds: string[], shBreeds: string[] } => {
    switch (judge.ringType) {
      case 'Longhair':
        return { lhBreeds: globalSettings.long_hair_breeds, shBreeds: [] };
      case 'Shorthair':
        return { lhBreeds: [], shBreeds: globalSettings.short_hair_breeds };
      case 'Double Specialty':
      case 'Super Specialty':
      case 'Allbreed':
      case 'OCP Ring':
        return { lhBreeds: globalSettings.long_hair_breeds, shBreeds: globalSettings.short_hair_breeds };
      default:
        return { lhBreeds: [], shBreeds: [] };
    }
  };

  /**
   * Determines if a class should be shown based on show counts
   */
  const shouldShowClass = (className: 'Championship' | 'Premiership' | 'Kitten'): { showLH: boolean, showSH: boolean } => {
    switch (className) {
      case 'Championship':
        const chLHCount = showCounts.championshipCounts.lhGcs + showCounts.championshipCounts.lhChs;
        const chSHCount = showCounts.championshipCounts.shGcs + showCounts.championshipCounts.shChs;
        return { showLH: chLHCount > 0, showSH: chSHCount > 0 };
      case 'Premiership':
        const prLHCount = showCounts.premiershipCounts.lhGps + showCounts.premiershipCounts.lhPrs;
        const prSHCount = showCounts.premiershipCounts.shGps + showCounts.premiershipCounts.shPrs;
        return { showLH: prLHCount > 0, showSH: prSHCount > 0 };
      case 'Kitten':
        return { showLH: showCounts.kittenCounts.lhKittens > 0, showSH: showCounts.kittenCounts.shKittens > 0 };
      default:
        return { showLH: false, showSH: false };
    }
  };

  /**
   * Gets the selected judge or returns null
   */
  const getSelectedJudge = (): Judge | null => {
    if (!breedSheetsTabData.selectedJudgeId) return null;
    return judges.find(j => j.id === breedSheetsTabData.selectedJudgeId) || null;
  };

  /**
   * Handles judge selection
   */
  const handleJudgeSelect = (judgeId: number) => {
    setBreedSheetsTabData(prev => ({
      ...prev,
      selectedJudgeId: judgeId
    }));
  };

  /**
   * Handles group selection
   */
  const handleGroupSelect = (group: 'Championship' | 'Premiership' | 'Kitten') => {
    setBreedSheetsTabData(prev => ({
      ...prev,
      selectedGroup: group,
      pingTriggered: true
    }));
    
    // Reset ping after animation completes
    setTimeout(() => {
      setBreedSheetsTabData(prev => ({
        ...prev,
        pingTriggered: false
      }));
    }, 800); // Match animation duration
  };

  /**
   * Handles hair length selection
   */
  const handleHairLengthSelect = (hairLength: 'Longhair' | 'Shorthair') => {
    setBreedSheetsTabData(prev => ({
      ...prev,
      selectedHairLength: hairLength
    }));
  };

  /**
   * Creates a key for group-hair length combination
   */
  const createGroupHairLengthKey = (group: 'Championship' | 'Premiership' | 'Kitten', hairLength: 'Longhair' | 'Shorthair'): string => {
    return `${group}-${hairLength}`;
  };

  /**
   * Updates a breed entry value for specific group-hair length combination
   */
  const updateBreedEntry = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR', value: string) => {
    setBreedSheetsTabData(prev => {
      const judgeIdStr = judgeId.toString();
      const groupHairLengthKey = createGroupHairLengthKey(prev.selectedGroup, prev.selectedHairLength);
      
      const currentJudgeEntries = prev.breedEntries[judgeIdStr] || {};
      const currentGroupHairLengthEntries = currentJudgeEntries[groupHairLengthKey] || {};
      const currentBreedEntry = currentGroupHairLengthEntries[breedKey] || { bob: '', secondBest: '', bestCH: '', bestPR: '' };
      
      return {
        ...prev,
        breedEntries: {
          ...prev.breedEntries,
          [judgeIdStr]: {
            ...currentJudgeEntries,
            [groupHairLengthKey]: {
              ...currentGroupHairLengthEntries,
              [breedKey]: {
                ...currentBreedEntry,
                [field]: value
              }
            }
          }
        }
      };
    });
  };

  /**
   * Gets a breed entry value for specific group-hair length combination
   */
  const getBreedEntryValue = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR'): string => {
    const judgeIdStr = judgeId.toString();
    const groupHairLengthKey = createGroupHairLengthKey(breedSheetsTabData.selectedGroup, breedSheetsTabData.selectedHairLength);
    return breedSheetsTabData.breedEntries[judgeIdStr]?.[groupHairLengthKey]?.[breedKey]?.[field] || '';
  };

  /**
   * Helper to create input key for local state
   */
  const getInputKey = (breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR'): string => {
    return `${breedKey}-${field}`;
  };

  /**
   * Handles input change (only updates local state)
   */
  const handleInputChange = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR', value: string) => {
    const key = getInputKey(breedKey, field);
    
    // Auto-complete 'v' or 'V' to 'VOID'
    if (value === 'v' || value === 'V') {
      setLocalInputState(prev => ({ ...prev, [key]: 'VOID' }));
    } else {
      // Only allow numeric input or VOID
      if (value && value !== 'VOID' && !/^\d+$/.test(value)) return;
      setLocalInputState(prev => ({ ...prev, [key]: value }));
    }
  };

  /**
   * Handles input blur (validation and model update)
   */
  const handleInputBlur = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR') => {
    const key = getInputKey(breedKey, field);
    const localValue = localInputState[key];
    
    // Always update model with localValue if defined
    if (localValue !== undefined) {
      // Update model and run validation immediately with the new value
      setBreedSheetsTabData(prev => {
        const judgeIdStr = judgeId.toString();
        const groupHairLengthKey = createGroupHairLengthKey(prev.selectedGroup, prev.selectedHairLength);
        
        const currentJudgeEntries = prev.breedEntries[judgeIdStr] || {};
        const currentGroupHairLengthEntries = currentJudgeEntries[groupHairLengthKey] || {};
        const currentBreedEntry = currentGroupHairLengthEntries[breedKey] || { bob: '', secondBest: '', bestCH: '', bestPR: '' };
        
        // Create updated entries with the new value
        const updatedEntries = {
          ...prev.breedEntries,
          [judgeIdStr]: {
            ...currentJudgeEntries,
            [groupHairLengthKey]: {
              ...currentGroupHairLengthEntries,
              [breedKey]: {
                ...currentBreedEntry,
                [field]: localValue
              }
            }
          }
        };

        // Run validation immediately with updated data
        const validationInput = {
          judgeId: prev.selectedJudgeId!,
          groupHairLengthKey,
          breedEntries: updatedEntries[judgeIdStr][groupHairLengthKey],
          selectedGroup: prev.selectedGroup,
          selectedHairLength: prev.selectedHairLength
        };

        const errorKey = `${breedKey}-${field}`;
        
        // 1. Validate current field for format, sequential, and BoB/2BoB same cat errors
        const fieldError = validateBreedSheetsField(validationInput, breedKey, field, localValue, globalSettings.max_cats);
        
        // 2. For duplicate validation, we need to re-validate all fields
        const allErrors = validateBreedSheetsTab(validationInput, globalSettings.max_cats);
        
        // 3. Merge: Use field-specific error for current field if it's not a duplicate error
        const finalErrors = { ...allErrors };
        if (fieldError && !fieldError.toLowerCase().includes('duplicate')) {
          finalErrors[errorKey] = fieldError;
        }

        return {
          ...prev,
          breedEntries: updatedEntries,
          errors: finalErrors
        };
      });
    }
    
    // Clear local input state for this field
    setLocalInputState(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
  };

  /**
   * Handles input focus (selects text and sets local state)
   */
  const handleInputFocus = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR', value: string, e: React.FocusEvent<HTMLInputElement>) => {
    const key = getInputKey(breedKey, field);
    setLocalInputState(prev => ({ ...prev, [key]: value }));
    e.target.select();
  };

  /**
   * Gets current input value (prefers local state)
   */
  const getCurrentInputValue = (judgeId: number, breedKey: string, field: 'bob' | 'secondBest' | 'bestCH' | 'bestPR'): string => {
    const key = getInputKey(breedKey, field);
    return localInputState[key] !== undefined ? localInputState[key] : getBreedEntryValue(judgeId, breedKey, field);
  };

  /**
   * Gets border style for inputs based on errors
   */
  const getBorderStyle = (errorKey: string): string => {
    if (breedSheetsTabData.errors[errorKey]) {
      return 'border-red-400 bg-red-50';
    }
    return 'border-cyan-200/50';
  };

  /**
   * Gets clean error message
   */
  const getCleanMessage = (message: string): string => {
    // Remove any prefixes for display
    return message.replace(/^\[.*?\]\s*/, '');
  };

  /**
   * Runs validation when switching views
   */
  const runValidation = () => {
    if (!breedSheetsTabData.selectedJudgeId) return;

    const judgeIdStr = breedSheetsTabData.selectedJudgeId.toString();
    const groupHairLengthKey = createGroupHairLengthKey(breedSheetsTabData.selectedGroup, breedSheetsTabData.selectedHairLength);
    const currentEntries = breedSheetsTabData.breedEntries[judgeIdStr]?.[groupHairLengthKey] || {};

    const validationInput = {
      judgeId: breedSheetsTabData.selectedJudgeId,
      groupHairLengthKey,
      breedEntries: currentEntries,
      selectedGroup: breedSheetsTabData.selectedGroup,
      selectedHairLength: breedSheetsTabData.selectedHairLength
    };

    const errors = validateBreedSheetsTab(validationInput, globalSettings.max_cats);
    setBreedSheetsTabData(prev => ({
      ...prev,
      errors
    }));
  };

  // Action button handlers
  const handleSaveToCSVClick = () => {
    // Run comprehensive validation for all judges and all data before export
    let allErrors: { [key: string]: string } = {};
    let hasAnyErrors = false;

    // Validate all judges and all group-hair length combinations
    for (const judge of judges) {
      const judgeIdStr = judge.id.toString();
      const judgeEntries = breedSheetsTabData.breedEntries[judgeIdStr];
      
      if (judgeEntries) {
        // Check all group-hair length combinations
        Object.keys(judgeEntries).forEach(groupHairLengthKey => {
          const entries = judgeEntries[groupHairLengthKey];
          
          // Parse group and hair length from key
          const [group, hairLength] = groupHairLengthKey.split('-') as ['Championship' | 'Premiership' | 'Kitten', 'Longhair' | 'Shorthair'];
          
          const validationInput = {
            judgeId: judge.id,
            groupHairLengthKey,
            breedEntries: entries,
            selectedGroup: group,
            selectedHairLength: hairLength
          };

          const errors = validateBreedSheetsTab(validationInput, globalSettings.max_cats);
          if (Object.keys(errors).length > 0) {
            hasAnyErrors = true;
            // Prefix errors with judge info for clarity
            Object.keys(errors).forEach(key => {
              allErrors[`Judge${judge.id}-${key}`] = `Judge ${judge.id} (${judge.acronym}): ${errors[key]}`;
            });
          }
        });
      }
    }

    if (hasAnyErrors) {
      // Update current tab errors to show all validation errors
      setBreedSheetsTabData(prev => ({
        ...prev,
        errors: allErrors
      }));
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
    
    // Reset only Breed Sheets tab data
    setBreedSheetsTabData(() => ({
      selectedJudgeId: null,
      selectedGroup: 'Championship',
      selectedHairLength: 'Longhair',
      breedEntries: {},
      errors: {},
      pingTriggered: false
    }));
    
    // Show success message
    showSuccess('Breed Sheets Tab Reset', 'Breed sheets data has been reset successfully.');
  };

  const confirmReset = () => {
    setIsResetModalOpen(false);
    
    // Call the parent's reset function to reset all data and return to General tab
    if (onResetAllData) {
      onResetAllData();
    }
  };

  // Auto-select first judge and default group/hair length if none selected and judges are available
  useEffect(() => {
    if (judges.length > 0 && !breedSheetsTabData.selectedJudgeId) {
      const availableGroups = getAvailableGroups();
      const defaultGroup = availableGroups.length > 0 ? availableGroups[0] : 'Championship';
      
      setBreedSheetsTabData(prev => ({
        ...prev,
        selectedJudgeId: judges[0].id,
        selectedGroup: defaultGroup,
        selectedHairLength: 'Longhair'
      }));
    }
  }, [judges, breedSheetsTabData.selectedJudgeId, setBreedSheetsTabData]);

  // Auto-select available hair length when group changes
  useEffect(() => {
    const availableHairLengths = getAvailableHairLengths();
    if (availableHairLengths.length > 0 && !availableHairLengths.includes(breedSheetsTabData.selectedHairLength)) {
      setBreedSheetsTabData(prev => ({
        ...prev,
        selectedHairLength: availableHairLengths[0]
      }));
    }
  }, [breedSheetsTabData.selectedGroup, breedSheetsTabData.selectedJudgeId]);

  // Run validation when switching judge, group, or hair length
  useEffect(() => {
    runValidation();
  }, [breedSheetsTabData.selectedJudgeId, breedSheetsTabData.selectedGroup, breedSheetsTabData.selectedHairLength, globalSettings.max_cats]);

  // Loading guard
  if (!judges.length) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <span className="text-violet-600 text-lg font-semibold animate-pulse">Loading breed sheets data...</span>
      </div>
    );
  }

  const selectedJudge = getSelectedJudge();

  return (
    <div className="p-8 space-y-8">
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset All Data"
        message="Are you sure you want to reset all application data? This action cannot be undone and will clear all entered information including show details, judge information, breed sheets data, and return you to the General tab."
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
        title="Reset Breed Sheets Tab"
        message="Are you sure you want to reset the Breed Sheets tab data? This action cannot be undone and will clear all breed sheet entries, but will keep your show details and judge information intact."
        type="warning"
        confirmText="Reset Breed Sheets Tab"
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

      {/* Breed Sheets - Premium Design */}
      <div className="group relative">
        {/* Header */}
        <div className="bg-white flex items-center justify-between px-6 pt-4 pb-3 gap-4 transition-all duration-200 border-b border-cyan-200 shadow-sm">
          <div className="flex items-center min-w-0">
            <span className="p-1.5 bg-gradient-to-br from-cyan-500 to-teal-400 rounded-xl shadow flex-shrink-0">
              {/* Breed/List Icon */}
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span>
            <span className="text-xl font-bold text-cyan-700 ml-3">Breed Sheets</span>
          </div>
          
          {/* Right: Selected Judge Info */}
          {selectedJudge && (
            <div className="flex items-center gap-2 text-sm text-cyan-600 font-medium">
              <span className="font-bold">Judge {selectedJudge.id}</span>
              <span className="text-cyan-400">•</span>
              <span className="font-semibold">{selectedJudge.name}</span>
              <span className="text-cyan-400">•</span>
              <span className="text-xs font-medium text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">
                {selectedJudge.ringType === 'Allbreed' ? 'AB' : selectedJudge.ringType === 'Double Specialty' ? 'DSP' : selectedJudge.ringType === 'Super Specialty' ? 'SSP' : selectedJudge.ringType === 'Longhair' ? 'LH' : 'SH'}
              </span>
            </div>
          )}
        </div>

        {/* Main Content - Split Layout */}
        <div className="bg-white border-x border-cyan-200 shadow-lg">
          <div className="flex" style={{ minHeight: '600px' }}>
                        {/* Left Panel - Judge Selector */}
            <div className="w-64 bg-gradient-to-b from-white to-gray-50/30 border-r border-gray-100">
                {/* Modern Header */}
                <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-400 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                      <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Judges
                    </h3>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Judge List */}
                  <div className="space-y-2">
                    {judges.map((judge) => (
                      <button
                        key={judge.id}
                        onClick={() => handleJudgeSelect(judge.id)}
                        className={`group relative w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
                          breedSheetsTabData.selectedJudgeId === judge.id
                            ? 'bg-gradient-to-r from-cyan-50 to-cyan-100/50 border border-cyan-200 shadow-sm scale-[1.02]'
                            : 'bg-white/60 hover:bg-white/80 border border-transparent hover:border-cyan-100 hover:shadow-sm'
                        }`}
                      >
                        {/* Selection Indicator */}
                        {breedSheetsTabData.selectedJudgeId === judge.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-cyan-500 rounded-r-full"></div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium transition-colors duration-200 ${
                            breedSheetsTabData.selectedJudgeId === judge.id
                              ? 'text-cyan-800'
                              : 'text-gray-700 group-hover:text-gray-900'
                          }`}>
                            Judge {judge.id.toString().padStart(2, '0')} • {judge.name.split(' ').map(n => n[0]).join('.')} • {judge.ringType === 'Allbreed' ? 'AB' : judge.ringType === 'Double Specialty' ? 'DSP' : judge.ringType === 'Super Specialty' ? 'SSP' : judge.ringType === 'Longhair' ? 'LH' : 'SH'}
                          </span>
                          
                          {/* Check Icon - Only for Selected */}
                          {breedSheetsTabData.selectedJudgeId === judge.id && (
                            <div className="opacity-100 transition-opacity duration-200">
                              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
            </div>

            {/* Right Panel - Breed Sheet Grid */}
            <div className="flex-1 overflow-auto" ref={rightPanelRef}>
              {selectedJudge ? (
                <div className="p-4">


                  {/* Parent-Child Relationship Control Panel */}
                  <div className="mb-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-cyan-200/50 shadow-sm p-3">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left Side - Controls */}
                        <div className="flex items-center gap-4">
                          {/* Parent Control - Group Selection */}
                          <div className="flex items-center gap-2">
                            <div className="flex gap-3">
                              {getAvailableGroups().map((group) => (
                                <button
                                  key={group}
                                  onClick={() => handleGroupSelect(group)}
                                  className={`relative px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                                                                      breedSheetsTabData.selectedGroup === group
                                    ? 'bg-white text-gray-700 border-2 border-cyan-300 shadow-lg shadow-cyan-100 scale-105'
                                    : 'bg-white text-gray-700 hover:bg-cyan-50 border border-cyan-200 hover:scale-102'
                                  }`}
                                >
                                  {group}
                                  {breedSheetsTabData.selectedGroup === group && (
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Elegant Dashed Line with Jumping Dots */}
                          <div className="flex items-center justify-center relative w-20 h-4">
                            {/* Elegant Dashed Line with Dots */}
                            <div className="flex items-center gap-1">
                              {/* Left Dash */}
                              <div className="w-3 h-0.5 bg-gradient-to-r from-cyan-300 to-cyan-400 rounded-full animate-dash-pulse"></div>
                              
                              {/* Left Dot */}
                              <div className={`w-0.5 h-0.5 bg-cyan-300 rounded-full transition-all duration-300 ${
                                breedSheetsTabData.pingTriggered ? 'animate-dot-jump' : 'animate-dash-pulse'
                              }`} style={{ animationDelay: breedSheetsTabData.pingTriggered ? '0s' : '0.5s' }}></div>
                              
                              {/* Center Dash */}
                              <div className="w-3 h-0.5 bg-gradient-to-r from-cyan-300 to-cyan-400 rounded-full animate-dash-pulse" style={{ animationDelay: '1s' }}></div>
                              
                              {/* Center Dot */}
                              <div className={`w-0.5 h-0.5 bg-gradient-to-r from-cyan-300 to-cyan-400 rounded-full transition-all duration-300 ${
                                breedSheetsTabData.pingTriggered ? 'animate-dot-jump' : 'animate-dash-pulse'
                              }`} style={{ animationDelay: breedSheetsTabData.pingTriggered ? '0.2s' : '1.5s' }}></div>
                              
                              {/* Right Dash */}
                              <div className="w-3 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full animate-dash-pulse" style={{ animationDelay: '2s' }}></div>
                              
                              {/* Right Dot */}
                              <div className={`w-0.5 h-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${
                                breedSheetsTabData.pingTriggered ? 'animate-dot-jump' : 'animate-dash-pulse'
                              }`} style={{ animationDelay: breedSheetsTabData.pingTriggered ? '0.4s' : '2.5s' }}></div>
                            </div>
                          </div>
                          
                          {/* Child Control - Hair Length Selection */}
                          <div className="flex items-center gap-2">
                            <div className="flex gap-3">
                              {getAvailableHairLengths().map((hairLength) => (
                                <button
                                  key={hairLength}
                                  onClick={() => handleHairLengthSelect(hairLength)}
                                  className={`relative px-3 py-1.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                                    breedSheetsTabData.selectedHairLength === hairLength
                                      ? 'bg-white text-gray-700 border-2 border-cyan-300 shadow-lg shadow-cyan-100 scale-105'
                                      : 'bg-white text-gray-700 hover:bg-cyan-50 border border-cyan-200 hover:scale-102'
                                  }`}
                                >
                                  {hairLength}
                                  {breedSheetsTabData.selectedHairLength === hairLength && (
                                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Search Input */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search breeds..."
                              value={breedSearchTerm}
                              onChange={(e) => setBreedSearchTerm(e.target.value)}
                              className="w-48 px-4 py-2 pl-10 text-sm border border-cyan-200 rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all duration-200 placeholder-gray-400"
                            />
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            {breedSearchTerm && (
                              <button
                                onClick={() => setBreedSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Breed Sheet Content */}
                  <div className="bg-white border border-cyan-200 rounded-lg shadow-sm">
                    <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-2 rounded-t-lg">
                      <h4 className="text-lg font-bold">
                        {breedSheetsTabData.selectedGroup} - {breedSheetsTabData.selectedHairLength} Breeds
                      </h4>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        {(() => {
                          const breeds = getBreedsForJudge(selectedJudge);
                          const breedList = breedSheetsTabData.selectedHairLength === 'Longhair' ? breeds.lhBreeds : breeds.shBreeds;
                          const filteredBreedList = getFilteredBreeds(breedList);
                          const breedPrefix = breedSheetsTabData.selectedHairLength === 'Longhair' ? 'lh' : 'sh';
                          
                          return filteredBreedList.map((breed) => (
                            <div key={`${breedPrefix}-${breed}`} className="grid grid-cols-[140px_1fr] gap-2 py-1 px-4 border-b border-cyan-100/40 hover:bg-cyan-50/20 transition-all duration-200 items-start">
                              <div className="flex items-start min-h-[28px] max-w-[140px]">
                                <div className="font-semibold text-cyan-900 text-xs tracking-wide uppercase leading-tight break-words bg-cyan-50/60 px-2 py-1 rounded-md border border-cyan-200/40">
                                  {breed}
                                </div>
                              </div>
                              <div className="flex gap-1 justify-end">
                                  <div className="flex flex-col items-center w-[80px]">
                                    <label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest text-center bg-cyan-100/40 px-1 py-0.5 rounded-sm">BoB</label>
                                    <input
                                      type="text"
                                      className={`w-12 h-7 text-xs text-center font-semibold rounded-md border-2 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all duration-200 ${getBorderStyle(`${breedPrefix}-${breed}-bob`)} ${isVoidInput(getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob')) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="#"
                                      value={getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob')}
                                      onChange={(e) => handleInputChange(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob', e.target.value)}
                                      onBlur={() => handleInputBlur(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob')}
                                      onFocus={(e) => handleInputFocus(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob', getBreedEntryValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bob'), e)}
                                    />
                                    {breedSheetsTabData.errors[`${breedPrefix}-${breed}-bob`] && (
                                      <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-2 py-1 shadow text-xs text-red-700 font-semibold flex items-start gap-1 whitespace-normal break-words w-[80px] min-h-[100px]">
                                        <svg className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span className="text-xs leading-tight">{getCleanMessage(breedSheetsTabData.errors[`${breedPrefix}-${breed}-bob`])}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-center w-[80px]">
                                    <label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest text-center bg-cyan-100/40 px-1 py-0.5 rounded-sm">2BoB</label>
                                    <input
                                      type="text"
                                      className={`w-12 h-7 text-xs text-center font-semibold rounded-md border-2 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all duration-200 ${getBorderStyle(`${breedPrefix}-${breed}-secondBest`)} ${isVoidInput(getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest')) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="#"
                                      value={getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest')}
                                      onChange={(e) => handleInputChange(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest', e.target.value)}
                                      onBlur={() => handleInputBlur(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest')}
                                      onFocus={(e) => handleInputFocus(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest', getBreedEntryValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'secondBest'), e)}
                                    />
                                    {breedSheetsTabData.errors[`${breedPrefix}-${breed}-secondBest`] && (
                                      <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-2 py-1 shadow text-xs text-red-700 font-semibold flex items-start gap-1 whitespace-normal break-words w-[80px] min-h-[100px]">
                                        <svg className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span className="text-xs leading-tight">{getCleanMessage(breedSheetsTabData.errors[`${breedPrefix}-${breed}-secondBest`])}</span>
                                      </div>
                                    )}
                                  </div>
                                {breedSheetsTabData.selectedGroup === 'Championship' && (
                                  <div className="flex flex-col items-center w-[80px]">
                                    <label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest text-center bg-cyan-100/40 px-1 py-0.5 rounded-sm">CH</label>
                                    <input
                                      type="text"
                                      className={`w-12 h-7 text-xs text-center font-semibold rounded-md border-2 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all duration-200 ${getBorderStyle(`${breedPrefix}-${breed}-bestCH`)} ${isVoidInput(getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH')) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="#"
                                      value={getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH')}
                                      onChange={(e) => handleInputChange(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH', e.target.value)}
                                      onBlur={() => handleInputBlur(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH')}
                                      onFocus={(e) => handleInputFocus(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH', getBreedEntryValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestCH'), e)}
                                    />
                                    {breedSheetsTabData.errors[`${breedPrefix}-${breed}-bestCH`] && (
                                      <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-2 py-1 shadow text-xs text-red-700 font-semibold flex items-start gap-1 whitespace-normal break-words w-[80px] min-h-[100px]">
                                        <svg className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span className="text-xs leading-tight">{getCleanMessage(breedSheetsTabData.errors[`${breedPrefix}-${breed}-bestCH`])}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {breedSheetsTabData.selectedGroup === 'Premiership' && (
                                  <div className="flex flex-col items-center w-[80px]">
                                    <label className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest text-center bg-cyan-100/40 px-1 py-0.5 rounded-sm">PR</label>
                                    <input
                                      type="text"
                                      className={`w-12 h-7 text-xs text-center font-semibold rounded-md border-2 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all duration-200 ${getBorderStyle(`${breedPrefix}-${breed}-bestPR`)} ${isVoidInput(getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR')) ? 'opacity-50 grayscale line-through' : ''}`}
                                      placeholder="#"
                                      value={getCurrentInputValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR')}
                                      onChange={(e) => handleInputChange(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR', e.target.value)}
                                      onBlur={() => handleInputBlur(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR')}
                                      onFocus={(e) => handleInputFocus(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR', getBreedEntryValue(selectedJudge.id, `${breedPrefix}-${breed}`, 'bestPR'), e)}
                                    />
                                    {breedSheetsTabData.errors[`${breedPrefix}-${breed}-bestPR`] && (
                                      <div className="mt-1 rounded-lg bg-red-50 border border-red-300 px-2 py-1 shadow text-xs text-red-700 font-semibold flex items-start gap-1 whitespace-normal break-words w-[80px] min-h-[100px]">
                                        <svg className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                                        </svg>
                                        <span className="text-xs leading-tight">{getCleanMessage(breedSheetsTabData.errors[`${breedPrefix}-${breed}-bestPR`])}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                    
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-cyan-600">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-lg font-medium">Select a judge to view breed sheets</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Action Buttons - Centered, matches other tabs */}
      <ActionButtons
        onSaveToExcel={handleSaveToCSVClick}
        onLoadFromExcel={handleRestoreFromCSVClick}
        onReset={handleResetClick}
      />
    </div>
  );
};

export default BreedSheetsTab; 