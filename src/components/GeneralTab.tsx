import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { validateGeneralForm } from '../validation/generalValidation';
import { handleSaveToCSV, handleReset } from '../utils/formActions';

interface Judge {
  id: number;
  name: string;
  acronym: string;
  ringType: string;
}

interface ShowData {
  showDate: string;
  clubName: string;
  masterClerk: string;
  numberOfJudges: number;
  championshipCounts: {
    gcs: number;
    lhGcs: number;
    shGcs: number;
    lhChs: number;
    shChs: number;
    lhNovs: number;
    shNovs: number;
    novs: number;
    chs: number;
    total: number;
  };
  kittenCounts: {
    lhKittens: number;
    shKittens: number;
    total: number;
  };
  premiershipCounts: {
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
    lhNovs: number;
    shNovs: number;
    novs: number;
    gps: number;
    prs: number;
    total: number;
  };
  householdPetCount: number;
}

interface GeneralTabProps {
  showData: ShowData;
  setShowData: React.Dispatch<React.SetStateAction<ShowData>>;
  judges: Judge[];
  setJudges: React.Dispatch<React.SetStateAction<Judge[]>>;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  onJudgeRingTypeChange?: (id: number, oldType: string, newType: string) => void;
  getShowState: () => Record<string, unknown>;
  onCSVImport: () => Promise<void>;
}

// Inline SVG components for classy arrow-in-circle icons (collapse ↧ / expand ↥)
const ChevronDownCircleIcon = () => (
  <svg
    className="w-6 h-6 text-gray-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="8 10 12 14 16 10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronUpCircleIcon = () => (
  <svg
    className="w-6 h-6 text-gray-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="16 14 12 10 8 14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function GeneralTab({ 
  showData, 
  setShowData, 
  judges, 
  setJudges,
  showSuccess,
  showError,
  showWarning: _showWarning, // unused, prefix with _
  showInfo: _showInfo, // unused, prefix with _
  onJudgeRingTypeChange,
  getShowState,
  onCSVImport
}: GeneralTabProps) {
  // Ref to the component root for event delegation
  const containerRef = useRef<HTMLDivElement>(null);
  // Local state for form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [focusedField, setFocusedField] = useState<string>('');
  
  // Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCSVErrorModalOpen, setIsCSVErrorModalOpen] = useState(false); // NEW: Modal for CSV error
  
  // Refs for focus management
  const numberOfJudgesRef = useRef<HTMLInputElement>(null);
  const clubNameRef = useRef<HTMLInputElement>(null);
  const masterClerkRef = useRef<HTMLInputElement>(null);

  // State for collapsing sections
  const [isShowInfoCollapsed, setIsShowInfoCollapsed] = useState(false);
  const [isShowCountCollapsed, setIsShowCountCollapsed] = useState(false);
  const [isJudgeInfoCollapsed, setIsJudgeInfoCollapsed] = useState(false);

  // Set default date on component mount and focus on number of judges
  useEffect(() => {
    if (!showData.showDate) {
      const today = new Date().toISOString().split('T')[0];
      setShowData(prev => ({ ...prev, showDate: today }));
    }
    
    // Focus on number of judges field after a short delay
    setTimeout(() => {
      numberOfJudgesRef.current?.focus();
    }, 100);
  }, []);

  // Update judges when numberOfJudges changes with proper validation
  useEffect(() => {
    const currentCount = judges.length;
    let targetCount = showData.numberOfJudges;
    
    // Enforce maximum limit of 12 judges
    if (targetCount > 12) {
      targetCount = 12;
      // Only update if the current value is different to prevent infinite loop
      if (showData.numberOfJudges !== 12) {
        setShowData(prev => ({ ...prev, numberOfJudges: 12 }));
        return; // Exit early to prevent further processing
      }
    }
    
    // Allow 0 judges (no minimum enforcement)
    if (targetCount < 0) {
      targetCount = 0;
      // Only update if the current value is different to prevent infinite loop
      if (showData.numberOfJudges !== 0) {
        setShowData(prev => ({ ...prev, numberOfJudges: 0 }));
        return; // Exit early to prevent further processing
      }
    }
    
    if (targetCount > currentCount) {
      // Add new judges
      const newJudges = Array.from({ length: targetCount - currentCount }, (_, i) => ({
        id: currentCount + i + 1,
        name: '',
        acronym: '',
        ringType: 'Allbreed'
      }));
      setJudges([...judges, ...newJudges]);
    } else if (targetCount < currentCount) {
      // Remove excess judges
      setJudges(judges.slice(0, targetCount));
    }
  }, [showData.numberOfJudges, judges.length]);

  const updateJudge = (id: number, field: keyof Judge, value: string) => {
    let oldType = undefined;
    if (field === 'ringType') {
      const judge = judges.find(j => j.id === id);
      if (judge) oldType = judge.ringType;
    }
    const updatedJudges = judges.map(judge =>
      judge.id === id ? { ...judge, [field]: value } : judge
    );
    setJudges(updatedJudges);
    if (field === 'ringType' && oldType && oldType !== value && typeof onJudgeRingTypeChange === 'function') {
      onJudgeRingTypeChange(id, oldType, value);
    }
  };

  // Function to re-index judges after deletion
  const reindexJudges = (judges: Judge[]) => {
    return judges.map((judge, index) => ({
      ...judge,
      id: index + 1
    }));
  };

  const updateShowData = (field: keyof ShowData, value: unknown) => {
    setShowData(prev => ({ ...prev, [field]: value }));
  };

  // Enhanced number of judges input handler with validation
  const handleNumberOfJudgesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    
    // Only prevent negative numbers during input
    if (value > 12) {
      // Don't show error during input, just cap the value
      updateShowData('numberOfJudges', 12);
      return;
    }
    
    if (value < 0) {
      // Don't show error during input, just set to 0
      updateShowData('numberOfJudges', 0);
      return;
    }
    
    // Clear any existing errors during input
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.numberOfJudges;
      return newErrors;
    });
    
    updateShowData('numberOfJudges', value);
  };

  /**
   * Automatically select (highlight) the full value inside ANY input element when it gains focus.
   * We attach a single delegated listener on the component root for efficiency and consistency.
   */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT') {
        const inputEl = target as HTMLInputElement;
        // Delay to ensure cursor is placed before selection (mobile Safari quirk)
        setTimeout(() => {
          if (document.activeElement === inputEl) {
            inputEl.select();
          }
        }, 0);
      }
    };

    root.addEventListener('focusin', handleFocusIn);
    return () => root.removeEventListener('focusin', handleFocusIn);
  }, []);

  // Focus handler for number inputs - clear the field if it's 0
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Always select the entire value for quick replacement (numeric fields)
    e.target.select();
  };

  // Blur handler for number inputs - revert to 0 if empty or invalid
  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>, field: string, minValue: number = 0) => {
    const value = e.target.value.trim();
    if (value === '' || parseInt(value) < minValue) {
      // Revert to 0 for empty or invalid values
      if (field === 'numberOfJudges') {
        setShowData(prev => ({ ...prev, numberOfJudges: 0 })); // Revert to 0
      } else if (field.startsWith('championship')) {
        const countField = field.replace('championship', '') as keyof ShowData['championshipCounts'];
        updateChampionshipCount(countField, 0);
      } else if (field === 'kittenCounts') {
        updateShowData('kittenCounts', { lhKittens: 0, shKittens: 0, total: 0 });
      } else if (field.startsWith('premiership')) {
        const countField = field.replace('premiership', '') as keyof ShowData['premiershipCounts'];
        updatePremiershipCount(countField, 0);
      } else if (field === 'householdPetCount') {
        updateShowData('householdPetCount', 0);
      }
    }
  };

  // Enhanced input handlers with validation
  const handleClubNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateShowData('clubName', value);
    
    // Clear error if field is now valid
    if (value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.clubName;
        return newErrors;
      });
    }
  };

  const handleMasterClerkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateShowData('masterClerk', value);
    
    // Clear error if field is now valid
    if (value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.masterClerk;
        return newErrors;
      });
    }
  };

  // Focus management handlers
  const handleFieldFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };

  const handleFieldBlur = () => {
    // Clear focused field immediately
    setFocusedField('');
  };

  const updateChampionshipCount = (field: keyof ShowData['championshipCounts'], value: number) => {
    setShowData(prev => ({
      ...prev,
      championshipCounts: {
        ...prev.championshipCounts,
        [field]: value
      }
    }));
  };

  const updatePremiershipCount = (field: keyof ShowData['premiershipCounts'], value: number) => {
    setShowData(prev => ({
      ...prev,
      premiershipCounts: {
        ...prev.premiershipCounts,
        [field]: value
      }
    }));
  };

  const updateKittenCount = (field: keyof ShowData['kittenCounts'], value: number) => {
    setShowData(prev => ({
      ...prev,
      kittenCounts: {
        ...prev.kittenCounts,
        [field]: value,
        total: field === 'lhKittens' ? value + prev.kittenCounts.shKittens : prev.kittenCounts.lhKittens + value
      }
    }));
  };

  const handleSaveToCSVClick = () => {
    const errors = validateGeneralForm(showData, judges);
    setErrors(errors);
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
    handleReset(setIsResetModalOpen);
  };

  const confirmReset = () => {
    setShowData({
      showDate: new Date().toISOString().split('T')[0], // Set to today's date
      clubName: '',
      masterClerk: '',
      numberOfJudges: 0,
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, gps: 0, prs: 0, total: 0 },
      householdPetCount: 0
    });
    setJudges([]);
    setErrors({});
    setFocusedField('');
    
    // Focus back on number of judges after reset
    setTimeout(() => {
      numberOfJudgesRef.current?.focus();
    }, 100);

    showSuccess(
      'Data Reset',
      'All form data has been successfully reset to default values.',
      4000
    );
  };

  // Test data generation function
  const handleFillTestData = () => {
    // Helper function to generate acronym from judge name (first letter of each word)
    const generateAcronym = (name: string): string => {
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');
    };

    // Helper function to generate random number between 1-100
    const getRandomCount = (): number => {
      return Math.floor(Math.random() * 100) + 1;
    };

    // Helper function to generate random judge names
    const generateRandomJudgeName = (): string => {
      const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 'William', 'Jennifer', 'Richard', 'Linda', 'Thomas', 'Patricia', 'Christopher', 'Barbara', 'Daniel', 'Elizabeth'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
      
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${firstName} ${lastName}`;
    };

    // Determine number of judges
    const numJudges = showData.numberOfJudges > 0 ? showData.numberOfJudges : 6;

    // Generate random show counts ensuring total ≤ 450
    let totalCats = 0;
    let attempts = 0;
    const maxAttempts = 100;

    let championshipTotal, kittenTotal, premiershipTotal, householdPetCount;
    let chNovs, prNovs; // Declare outside loop for scope

    do {
      // Generate random counts between 1-100
      const lhGcs = getRandomCount();
      const shGcs = getRandomCount();
      const lhChs = getRandomCount();
      const shChs = getRandomCount();
      chNovs = getRandomCount(); // assign inside loop
      const lhKittens = getRandomCount();
      const shKittens = getRandomCount();
      const lhGps = getRandomCount();
      const shGps = getRandomCount();
      const lhPrs = getRandomCount();
      const shPrs = getRandomCount();
      prNovs = getRandomCount(); // assign inside loop
      const hhp = getRandomCount();

      // Calculate totals
      championshipTotal = lhGcs + shGcs + lhChs + shChs + chNovs;
      kittenTotal = lhKittens + shKittens;
      premiershipTotal = lhGps + shGps + lhPrs + shPrs + prNovs;
      householdPetCount = hhp;

      totalCats = championshipTotal + kittenTotal + premiershipTotal + householdPetCount;
      attempts++;
    } while (totalCats > 450 && attempts < maxAttempts);

    // If we couldn't get under 450, scale down proportionally
    if (totalCats > 450) {
      const scaleFactor = 450 / totalCats;
      championshipTotal = Math.floor(championshipTotal * scaleFactor);
      kittenTotal = Math.floor(kittenTotal * scaleFactor);
      premiershipTotal = Math.floor(premiershipTotal * scaleFactor);
      householdPetCount = Math.floor(householdPetCount * scaleFactor);
    }

    // Generate test data for General tab
    const testShowData: ShowData = {
      showDate: '2025-01-15',
      clubName: 'Test Cat Fanciers Club',
      masterClerk: 'Test Master Clerk',
      numberOfJudges: numJudges,
      championshipCounts: {
        gcs: Math.floor(championshipTotal * 0.6), // 60% of total
        lhGcs: Math.floor(championshipTotal * 0.35), // 35% of total
        shGcs: Math.floor(championshipTotal * 0.25), // 25% of total
        lhChs: Math.floor(championshipTotal * 0.15), // 15% of total
        shChs: Math.floor(championshipTotal * 0.10), // 10% of total
        lhNovs: chNovs,
        shNovs: chNovs, // Assuming shNovs is the same as chNovs for simplicity in test data
        novs: chNovs,
        chs: Math.floor(championshipTotal * 0.25), // 25% of total
        total: championshipTotal
      },
      kittenCounts: {
        lhKittens: Math.floor(kittenTotal * 0.6), // 60% of total
        shKittens: Math.floor(kittenTotal * 0.4), // 40% of total
        total: kittenTotal
      },
      premiershipCounts: {
        lhGps: Math.floor(premiershipTotal * 0.4), // 40% of total
        shGps: Math.floor(premiershipTotal * 0.25), // 25% of total
        lhPrs: Math.floor(premiershipTotal * 0.25), // 25% of total
        shPrs: Math.floor(premiershipTotal * 0.15), // 15% of total
        lhNovs: prNovs,
        shNovs: prNovs, // Assuming shNovs is the same as prNovs for simplicity in test data
        novs: prNovs,
        gps: Math.floor(premiershipTotal * 0.4), // 40% of total
        prs: Math.floor(premiershipTotal * 0.4), // 40% of total
        total: premiershipTotal
      },
      householdPetCount: householdPetCount
    };

    // Generate random judges with "Allbreed" ring type and acronyms from names
    const testJudges: Judge[] = [];
    for (let i = 1; i <= numJudges; i++) {
      const judgeName = generateRandomJudgeName();
      const acronym = generateAcronym(judgeName);
      
      testJudges.push({
        id: i,
        name: judgeName,
        acronym: acronym,
        ringType: 'Allbreed'
      });
    }

    setShowData(testShowData);
    setJudges(testJudges);
    showSuccess('Test Data Filled', 'General tab has been filled with randomized test data.');
  };

  return (
    <div ref={containerRef} className="p-8">
      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset All Data"
        message="Are you sure you want to reset all form data? This action cannot be undone and will clear all entered information including show details, judge information, and counts."
        type="warning"
        confirmText="Reset Data"
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

      {/* Required Field Legend - Form Level */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-500 font-bold">*</span>
        <span className="text-sm text-gray-600">Required field</span>
      </div>

      <div className="space-y-8">
        {/* Show Information */}
        <div className="cfa-section">
          <h2 className="cfa-section-header flex items-center justify-between">
            Show Information
            <button
              type="button"
              onClick={() => setIsShowInfoCollapsed(prev => !prev)}
              className="transition-transform duration-200 focus:outline-none"
              aria-label={isShowInfoCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isShowInfoCollapsed ? <ChevronDownCircleIcon /> : <ChevronUpCircleIcon />}
            </button>
          </h2>
          {!isShowInfoCollapsed && (
            <table className="mb-4 w-full border-separate" style={{ borderSpacing: 0 }}>
              <tbody>
                <tr>
                  <td className="w-1/4 pr-2 align-top"><label className="block font-semibold text-gray-700 mb-1">Show Date: <span className="text-red-500">*</span></label></td>
                  <td className="w-1/4 pr-2 align-top"><input type="date" value={showData.showDate} onChange={e => updateShowData('showDate', e.target.value)} className={`cfa-input w-32 ${errors.showDate ? 'cfa-input-error' : ''}`}/>{errors.showDate && <div className="text-red-500 text-xs mt-1">{errors.showDate}</div>}</td>
                  <td className="w-1/4 pr-2 align-top"><label className="block font-semibold text-gray-700 mb-1"># of Judges: <span className="text-red-500">*</span></label></td>
                  <td className="w-1/4 align-top">
                    <div className="space-y-1">
                      <input 
                        ref={numberOfJudgesRef}
                        type="number" 
                        min="0" 
                        max="12" 
                        value={showData.numberOfJudges} 
                        onChange={handleNumberOfJudgesChange}
                        onFocus={(e) => {
                          handleNumberFocus(e);
                          handleFieldFocus('numberOfJudges');
                        }}
                        onBlur={(e) => {
                          handleNumberBlur(e, 'numberOfJudges', 0);
                          handleFieldBlur();
                        }}
                        className={`cfa-input w-20 ${errors.numberOfJudges ? 'cfa-input-error' : ''}`}
                      />
                      <div className="h-4">
                        {errors.numberOfJudges && <div className="text-red-500 text-xs">{errors.numberOfJudges}</div>}
                        {focusedField === 'numberOfJudges' && !errors.numberOfJudges && <div className="text-gray-500 text-xs">Enter a number between 1 and 12</div>}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="w-1/4 pr-2 align-top"><label className="block font-semibold text-gray-700 mb-1">Club Name: <span className="text-red-500">*</span></label></td>
                  <td className="w-1/4 pr-2 align-top">
                    <div className="space-y-1">
                      <input 
                        ref={clubNameRef}
                        type="text" 
                        value={showData.clubName} 
                        onChange={handleClubNameChange}
                        onFocus={() => handleFieldFocus('clubName')}
                        onBlur={handleFieldBlur}
                        className={`cfa-input w-64 ${errors.clubName ? 'cfa-input-error' : ''}`}
                        placeholder="Enter club name"
                      />
                      <div className="h-4">
                        {errors.clubName && <div className="text-red-500 text-xs">{errors.clubName}</div>}
                        {focusedField === 'clubName' && !errors.clubName && <div className="text-gray-500 text-xs">Enter the name of the cat club</div>}
                      </div>
                    </div>
                  </td>
                  <td className="w-1/4 pr-2 align-top"><label className="block font-semibold text-gray-700 mb-1">Master Clerk Name: <span className="text-red-500">*</span></label></td>
                  <td className="w-1/4 align-top">
                    <div className="space-y-1">
                      <input 
                        ref={masterClerkRef}
                        type="text" 
                        value={showData.masterClerk} 
                        onChange={handleMasterClerkChange}
                        onFocus={() => handleFieldFocus('masterClerk')}
                        onBlur={handleFieldBlur}
                        className={`cfa-input w-64 ${errors.masterClerk ? 'cfa-input-error' : ''}`}
                        placeholder="Enter master clerk name"
                      />
                      <div className="h-4">
                        {errors.masterClerk && <div className="text-red-500 text-xs">{errors.masterClerk}</div>}
                        {focusedField === 'masterClerk' && !errors.masterClerk && <div className="text-gray-500 text-xs">Enter the master clerk's full name</div>}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Show Count */}
        <div className="cfa-section">
          <h2 className="cfa-section-header flex items-center justify-between">
            Show Count
            <button
              type="button"
              onClick={() => setIsShowCountCollapsed(prev => !prev)}
              className="transition-transform duration-200 focus:outline-none"
              aria-label={isShowCountCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isShowCountCollapsed ? <ChevronDownCircleIcon /> : <ChevronUpCircleIcon />}
            </button>
          </h2>
          {!isShowCountCollapsed && (
            <div className="cfa-table">
              <table className="w-full">
                <tbody>
                  {/* Championship Count */}
                  <tr className="cfa-table-header">
                    <td colSpan={12} className="py-3 pl-4">Championship Count</td>
                  </tr>
                  {/* 1st row – Longhair counts */}
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of LH GCs:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.championshipCounts.lhGcs} onChange={e => updateChampionshipCount('lhGcs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshiplhGcs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of LH CHs:</td>
                    <td><input type="number" min="0" value={showData.championshipCounts.lhChs} onChange={e => updateChampionshipCount('lhChs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshiplhChs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of LH NOVs:</td>
                    <td><input type="number" min="0" value={showData.championshipCounts.lhNovs} onChange={e => updateChampionshipCount('lhNovs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshiplhNovs')} className="cfa-input w-20 text-sm"/></td>
                    <td colSpan={4}></td>
                  </tr>
                  {/* 2nd row – Shorthair counts */}
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of SH GCs:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.championshipCounts.shGcs} onChange={e => updateChampionshipCount('shGcs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipshGcs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of SH CHs:</td>
                    <td><input type="number" min="0" value={showData.championshipCounts.shChs} onChange={e => updateChampionshipCount('shChs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipshChs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of SH NOVs:</td>
                    <td><input type="number" min="0" value={showData.championshipCounts.shNovs} onChange={e => updateChampionshipCount('shNovs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipshNovs')} className="cfa-input w-20 text-sm"/></td>
                    <td colSpan={4}></td>
                  </tr>
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of GCs:</td>
                    <td className="py-3"><input type="number" value={showData.championshipCounts.gcs} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of CHs:</td>
                    <td><input type="number" value={showData.championshipCounts.chs} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td className="text-sm font-medium">Total Count:</td>
                    <td><input type="number" value={showData.championshipCounts.total} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td colSpan={6}></td>
                  </tr>
                  {/* Kitten Count */}
                  <tr className="cfa-table-header">
                    <td colSpan={12} className="py-3 pl-4">Kitten Count</td>
                  </tr>
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of LH Kittens:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.kittenCounts.lhKittens} onChange={e => updateKittenCount('lhKittens', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'kittenCountslhKittens')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of SH Kittens:</td>
                    <td><input type="number" min="0" value={showData.kittenCounts.shKittens} onChange={e => updateKittenCount('shKittens', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'kittenCountsshKittens')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium">Total Kittens:</td>
                    <td><input type="number" value={showData.kittenCounts.total} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td colSpan={6}></td>
                  </tr>
                  {/* Premiership Count */}
                  <tr className="cfa-table-header">
                    <td colSpan={12} className="py-3 pl-4">Premiership Count</td>
                  </tr>
                  {/* Editable fields row */}
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of LH GPs:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.premiershipCounts.lhGps} onChange={e => updatePremiershipCount('lhGps', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershiplhGps')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of LH PRs:</td>
                    <td><input type="number" min="0" value={showData.premiershipCounts.lhPrs} onChange={e => updatePremiershipCount('lhPrs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershiplhPrs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of LH NOVs:</td>
                    <td><input type="number" min="0" value={showData.premiershipCounts.lhNovs} onChange={e => updatePremiershipCount('lhNovs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershiplhNovs')} className="cfa-input w-20 text-sm"/></td>
                  </tr>
                  {/* Second editable row for Premiership - SH NOVs */}
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of SH GPs:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.premiershipCounts.shGps} onChange={e => updatePremiershipCount('shGps', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipshGps')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of SH PRs:</td>
                    <td><input type="number" min="0" value={showData.premiershipCounts.shPrs} onChange={e => updatePremiershipCount('shPrs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipshPrs')} className="cfa-input w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of SH NOVs:</td>
                    <td><input type="number" min="0" value={showData.premiershipCounts.shNovs} onChange={e => updatePremiershipCount('shNovs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipshNovs')} className="cfa-input w-20 text-sm"/></td>
                    <td colSpan={6}></td>
                  </tr>
                  {/* Calculated fields row */}
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of GPs:</td>
                    <td className="py-3"><input type="number" value={showData.premiershipCounts.gps} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td className="text-sm font-medium"># of PRs:</td>
                    <td><input type="number" value={showData.premiershipCounts.prs} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td className="text-sm font-medium">Total Count:</td>
                    <td><input type="number" value={showData.premiershipCounts.total} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                    <td colSpan={8}></td>
                  </tr>
                  {/* Household Pet Count */}
                  <tr className="cfa-table-header">
                    <td colSpan={12} className="py-3 pl-4">Household Pet Count</td>
                  </tr>
                  <tr className="cfa-table-row">
                    <td className="text-sm font-medium pl-4 py-3"># of Household Pets:</td>
                    <td className="py-3"><input type="number" min="0" value={showData.householdPetCount} onChange={e => updateShowData('householdPetCount', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'householdPetCount')} className="cfa-input w-20 text-sm"/></td>
                    <td colSpan={10}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Judge Information */}
        <div className="cfa-section">
          <h2 className="cfa-section-header flex items-center justify-between">
            Judge Information
            <button
              type="button"
              onClick={() => setIsJudgeInfoCollapsed(prev => !prev)}
              className="transition-transform duration-200 focus:outline-none"
              aria-label={isJudgeInfoCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isJudgeInfoCollapsed ? <ChevronDownCircleIcon /> : <ChevronUpCircleIcon />}
            </button>
          </h2>
          {!isJudgeInfoCollapsed && (
            <div className="cfa-table">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="cfa-table-header">
                    <th className="text-left py-2 pl-4 w-20">Ring #</th>
                    <th className="text-left py-2 w-48">Judge Name <span className="text-red-500">*</span></th>
                    <th className="text-left py-2 w-40">Acronym <span className="text-red-500">*</span></th>
                    <th className="text-left py-2 w-48">Ring Type <span className="text-red-500">*</span></th>
                    <th className="text-left py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((judge, index) => (
                    <tr key={judge.id} className="cfa-table-row">
                      <td className="py-2 pl-4 align-top w-20">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center w-16 h-8 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700">
                            {index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 align-top w-48">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={judge.name}
                            onChange={(e) => updateJudge(judge.id, 'name', e.target.value)}
                            onFocus={() => handleFieldFocus(`judge${index}Name`)}
                            onBlur={handleFieldBlur}
                            className={`cfa-input w-40 text-sm ${errors[`judge${index}Name`] ? 'cfa-input-error' : ''}`}
                            placeholder="Enter judge name"
                          />
                          <div className="h-3">
                            {errors[`judge${index}Name`] && <div className="text-red-500 text-xs">{errors[`judge${index}Name`]}</div>}
                            {focusedField === `judge${index}Name` && !errors[`judge${index}Name`] && <div className="text-gray-500 text-xs">Enter the judge's full name</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 align-top w-40">
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={judge.acronym}
                            onChange={(e) => updateJudge(judge.id, 'acronym', e.target.value)}
                            onFocus={() => handleFieldFocus(`judge${index}Acronym`)}
                            onBlur={handleFieldBlur}
                            className={`cfa-input w-32 text-sm ${errors[`judge${index}Acronym`] ? 'cfa-input-error' : ''}`}
                            placeholder="Acronym"
                            maxLength={6}
                          />
                          <div className="h-3">
                            {errors[`judge${index}Acronym`] && <div className="text-red-500 text-xs">{errors[`judge${index}Acronym`]}</div>}
                            {focusedField === `judge${index}Acronym` && !errors[`judge${index}Acronym`] && <div className="text-gray-500 text-xs">Enter judge's acronym (max 6 characters)</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 align-top w-48">
                        <div className="space-y-1">
                          <select
                            value={judge.ringType}
                            onChange={(e) => updateJudge(judge.id, 'ringType', e.target.value)}
                            onFocus={() => handleFieldFocus(`judge${index}RingType`)}
                            onBlur={handleFieldBlur}
                            className="cfa-input w-40 text-sm"
                          >
                            <option value="Longhair">Longhair</option>
                            <option value="Shorthair">Shorthair</option>
                            <option value="Allbreed">Allbreed</option>
                            <option value="Double Specialty">Double Specialty</option>
                          </select>
                          <div className="h-3">
                            {focusedField === `judge${index}RingType` && !judge.ringType && <div className="text-gray-500 text-xs">Select the judge's ring type</div>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 text-center align-top w-12">
                        <div className="pt-0">
                          <button
                            onClick={() => {
                              const newJudges = judges.filter(j => j.id !== judge.id);
                              const reindexedJudges = reindexJudges(newJudges);
                              setJudges(reindexedJudges);
                              setShowData(prev => ({ ...prev, numberOfJudges: reindexedJudges.length }));
                            }}
                            className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Remove judge"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {errors.judgeNames && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
                  {errors.judgeNames}
                </div>
              )}
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
            <button
              type="button"
              onClick={handleFillTestData}
              className="cfa-button-secondary"
              style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', color: 'white' }}
            >
              Fill Test Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 