import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import ActionButtons from './ActionButtons';
import { validateGeneralForm } from '../validation/generalValidation';
import { handleSaveToCSV, handleReset } from '../utils/formActions';
import CustomSelect from './CustomSelect';

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

// Replace ChevronDownCircleIcon and ChevronUpCircleIcon with integrated corner icon
const CornerCollapseIcon = ({ expanded, onClick, label, gradient }: { expanded: boolean; onClick: () => void; label: string; gradient: string }) => (
  <button
    type="button"
    aria-label={label}
    onClick={onClick}
    className="absolute z-20 top-0 right-0 w-10 h-10 flex items-center justify-center focus:outline-none"
    style={{ background: 'transparent', border: 'none', padding: 0 }}
  >
    <span
      className="rounded-tr-lg"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: gradient,
        position: 'relative',
      }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
    fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-colors duration-150"
        style={{
          background: 'white',
          borderRadius: '50%',
          boxShadow: expanded ? '0 0 0 2px #5b9fff55' : '0 1px 3px 0 rgba(30,42,80,0.08)',
        }}
      >
        <circle cx="14" cy="14" r="13" stroke="#5b9fff" strokeWidth="2" fill="white" />
        <rect x="8" y="13" width="12" height="2" rx="1" fill="#5b9fff" />
        {!expanded && <rect x="13" y="8" width="2" height="12" rx="1" fill="#5b9fff" />}
  </svg>
    </span>
  </button>
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

  // Helper: Ensure all number inputs are always controlled (never undefined/NaN)
  function safeNumberInput(val: any): number | string {
    return typeof val === 'number' && !isNaN(val) ? val : '';
  }

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

      {/* Premium Required Field Legend */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-full px-3 py-1.5">
          <span className="text-red-500 font-bold text-lg">●</span>
          <span className="text-sm font-medium text-gray-700">Required field</span>
        </div>
      </div>



      {/* --- Redesigned Show Information Section --- */}
      <div className="space-y-6">
        <div className="group relative">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl pointer-events-none"></div>
          <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 transform hover:scale-[1.005] group-hover:border-blue-200">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <h2 className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Show Information</span>
                </div>
              </div>
              <CornerCollapseIcon expanded={!isShowInfoCollapsed} onClick={() => setIsShowInfoCollapsed(v => !v)} label={isShowInfoCollapsed ? 'Expand section' : 'Collapse section'} gradient="linear-gradient(135deg, #3b82f6 60%, #6366f1 100%)" />
          </h2>
            
          {!isShowInfoCollapsed && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 shadow-sm">
                <header className="flex items-center mb-3">
                  <div className="w-1 h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full mr-3"></div>
                  <div>
                    <h3 className="text-base font-semibold text-blue-900 tracking-wide" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Show Details</h3>
                  </div>
                </header>
                
                <div className="space-y-3">
                  {/* Row 1: Show Date & # of Judges */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 min-w-[120px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                        Show Date:
                        <span className="ml-1 text-red-500 text-base">●</span>
                      </label>
                      <input 
                        type="date"
                        value={showData.showDate}
                        onChange={e => updateShowData('showDate', e.target.value)}
                        onFocus={e => e.target.select()}
                        className="text-sm font-medium bg-white border border-blue-200 rounded-md py-1 px-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif', width: '150px' }}
                      />
                      {errors.showDate && (
                        <div className="text-red-500 text-xs font-medium" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{errors.showDate}</div>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 min-w-[120px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                        # of Judges:
                        <span className="ml-1 text-red-500 text-base">●</span>
                      </label>
                      <input 
                        ref={numberOfJudgesRef}
                        type="number" 
                        min="0" 
                        max="12" 
                        value={safeNumberInput(showData.numberOfJudges)} 
                        onChange={handleNumberOfJudgesChange}
                        onFocus={e => { e.target.select(); handleNumberFocus(e); handleFieldFocus('numberOfJudges'); }}
                        onBlur={e => { handleNumberBlur(e, 'numberOfJudges', 0); handleFieldBlur(); }}
                        className="text-center text-sm font-medium bg-white border border-blue-200 rounded-md py-1 px-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif', width: '80px' }}
                      />
                      {errors.numberOfJudges && (
                        <div className="text-red-500 text-xs font-medium" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{errors.numberOfJudges}</div>
                      )}
                      </div>
                    </div>
                  
                  {/* Row 2: Club Name & Master Clerk Name */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 min-w-[120px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                        Club Name:
                        <span className="ml-1 text-red-500 text-base">●</span>
                      </label>
                      <input 
                        ref={clubNameRef}
                        type="text" 
                        value={showData.clubName} 
                        onChange={handleClubNameChange}
                        onFocus={e => { e.target.select(); handleFieldFocus('clubName'); }}
                        onBlur={handleFieldBlur}
                        className="text-sm font-medium bg-white border border-blue-200 rounded-md py-1 px-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm" 
                        placeholder="Enter club name"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif', width: '260px' }}
                      />
                      {errors.clubName && (
                        <div className="text-red-500 text-xs font-medium" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{errors.clubName}</div>
                      )}
                      </div>
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 min-w-[120px]" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                        Master Clerk:
                        <span className="ml-1 text-red-500 text-base">●</span>
                      </label>
                      <input 
                        ref={masterClerkRef}
                        type="text" 
                        value={showData.masterClerk} 
                        onChange={handleMasterClerkChange}
                        onFocus={e => { e.target.select(); handleFieldFocus('masterClerk'); }}
                        onBlur={handleFieldBlur}
                        className="text-sm font-medium bg-white border border-blue-200 rounded-md py-1 px-2 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-sm" 
                        placeholder="Enter master clerk name"
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif', width: '260px' }}
                      />
                      {errors.masterClerk && (
                        <div className="text-red-500 text-xs font-medium" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{errors.masterClerk}</div>
                      )}
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show Count - Modern Green Design */}
        {/*
         * @section Show Count (Modern Green Redesign)
         * @description
         *   - Sleek, modern design while keeping the green theme
         *   - Fixed alignment issues with proper grid consistency
         *   - Modern typography and spacing for trendy appearance
         *   - Enhanced visual hierarchy with better organization
         *   - No changes to logic, validation, or input handling
         *   - All number inputs retain auto-highlight on focus
         */}
        <div className="group relative">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl pointer-events-none"></div>
          <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 transition-all duration-300 transform hover:scale-[1.005] group-hover:border-emerald-200">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <h2 className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Show Count</span>
                </div>
              </div>
              <CornerCollapseIcon expanded={!isShowCountCollapsed} onClick={() => setIsShowCountCollapsed(v => !v)} label={isShowCountCollapsed ? 'Expand section' : 'Collapse section'} gradient="linear-gradient(135deg, #10b981 60%, #059669 100%)" />
          </h2>
            
          {!isShowCountCollapsed && (
              <div className="space-y-4">
                {/* Championship Count Section */}
                <section className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
                  <header className="flex items-center mb-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full mr-3"></div>
                    <div>
                      <h3 className="text-base font-semibold text-emerald-900 tracking-wide" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Championship Count</h3>
            </div>
                  </header>
                  
                  <div className="space-y-3">
                    {/* Longhair Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH GCs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.lhGcs)} 
                          onChange={e => updateChampionshipCount('lhGcs', parseInt(e.target.value) || 0)} 
                          onFocus={e => e.target.select()}
                          onBlur={e => handleNumberBlur(e, 'championshiplhGcs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH CHs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.lhChs)} 
                          onChange={e => updateChampionshipCount('lhChs', parseInt(e.target.value) || 0)} 
                          onFocus={e => e.target.select()}
                          onBlur={e => handleNumberBlur(e, 'championshiplhChs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH NOVs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.lhNovs)} 
                          onChange={e => updateChampionshipCount('lhNovs', parseInt(e.target.value) || 0)} 
                          onFocus={e => e.target.select()}
                          onBlur={e => handleNumberBlur(e, 'championshiplhNovs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
        </div>

                    {/* Shorthair Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH GCs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.shGcs)} 
                          onChange={e => updateChampionshipCount('shGcs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'championshipshGcs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                          </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH CHs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.shChs)} 
                          onChange={e => updateChampionshipCount('shChs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'championshipshChs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                        </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH NOVs:</label>
                          <input
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.championshipCounts.shNovs)} 
                          onChange={e => updateChampionshipCount('shNovs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'championshipshNovs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                          </div>
                        </div>
                    
                    {/* Totals Row - Fixed Alignment */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-emerald-100">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-emerald-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of GCs:</label>
                          <input
                          type="number" 
                          value={safeNumberInput(showData.championshipCounts.gcs)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-md py-1 px-2 text-emerald-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                          </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-emerald-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of CHs:</label>
                        <input 
                          type="number" 
                          value={safeNumberInput(showData.championshipCounts.chs)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-md py-1 px-2 text-emerald-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                        </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-emerald-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Total Count:</label>
                        <input 
                          type="number" 
                          value={safeNumberInput(showData.championshipCounts.total)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-emerald-50 border border-emerald-200 rounded-md py-1 px-2 text-emerald-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                          </div>
                        </div>
                  </div>
                </section>

                {/* Kitten Count Section */}
                <section className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4 shadow-sm">
                  <header className="flex items-center mb-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-green-400 to-emerald-500 rounded-full mr-3"></div>
                    <div>
                      <h3 className="text-base font-semibold text-green-900 tracking-wide" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Kitten Count</h3>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH Kittens:</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={safeNumberInput(showData.kittenCounts.lhKittens)} 
                        onChange={e => updateKittenCount('lhKittens', parseInt(e.target.value) || 0)} 
                        onFocus={handleNumberFocus}
                        onBlur={e => handleNumberBlur(e, 'kittenCountslhKittens')} 
                        className="w-20 text-center text-sm font-medium bg-white border border-green-200 rounded-md py-1 px-2 focus:border-green-400 focus:ring-1 focus:ring-green-100 focus:outline-none transition-all duration-200 shadow-sm" 
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      />
                    </div>
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH Kittens:</label>
                      <input 
                        type="number" 
                        min="0" 
                        value={safeNumberInput(showData.kittenCounts.shKittens)} 
                        onChange={e => updateKittenCount('shKittens', parseInt(e.target.value) || 0)} 
                        onFocus={handleNumberFocus}
                        onBlur={e => handleNumberBlur(e, 'kittenCountsshKittens')} 
                        className="w-20 text-center text-sm font-medium bg-white border border-green-200 rounded-md py-1 px-2 focus:border-green-400 focus:ring-1 focus:ring-green-100 focus:outline-none transition-all duration-200 shadow-sm" 
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      />
                    </div>
                    <div className="flex items-center space-x-3 h-8">
                      <label className="text-sm font-semibold text-green-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Total Kittens:</label>
                      <input 
                        type="number" 
                        value={safeNumberInput(showData.kittenCounts.total)} 
                        readOnly 
                        className="w-20 text-center text-sm font-semibold bg-green-50 border border-green-200 rounded-md py-1 px-2 text-green-800" 
                        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                      />
                    </div>
                  </div>
                </section>

                {/* Premiership Count Section */}
                <section className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100 p-4 shadow-sm">
                  <header className="flex items-center mb-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-teal-400 to-blue-500 rounded-full mr-3"></div>
                    <div>
                      <h3 className="text-base font-semibold text-teal-900 tracking-wide" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Premiership Count</h3>
                    </div>
                  </header>
                  
                  <div className="space-y-3">
                    {/* Longhair Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH GPs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.lhGps)} 
                          onChange={e => updatePremiershipCount('lhGps', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershiplhGps')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH PRs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.lhPrs)} 
                          onChange={e => updatePremiershipCount('lhPrs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershiplhPrs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of LH NOVs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.lhNovs)} 
                          onChange={e => updatePremiershipCount('lhNovs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershiplhNovs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                    </div>
                    
                    {/* Shorthair Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH GPs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.shGps)} 
                          onChange={e => updatePremiershipCount('shGps', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershipshGps')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH PRs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.shPrs)} 
                          onChange={e => updatePremiershipCount('shPrs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershipshPrs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-gray-700 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of SH NOVs:</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={safeNumberInput(showData.premiershipCounts.shNovs)} 
                          onChange={e => updatePremiershipCount('shNovs', parseInt(e.target.value) || 0)} 
                          onFocus={handleNumberFocus}
                          onBlur={e => handleNumberBlur(e, 'premiershipshNovs')} 
                          className="w-20 text-center text-sm font-medium bg-white border border-teal-200 rounded-md py-1 px-2 focus:border-teal-400 focus:ring-1 focus:ring-teal-100 focus:outline-none transition-all duration-200 shadow-sm" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                    </div>
                    
                    {/* Totals Row - Fixed Alignment */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-teal-100">
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-teal-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of GPs:</label>
                        <input 
                          type="number" 
                          value={safeNumberInput(showData.premiershipCounts.gps)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-teal-50 border border-teal-200 rounded-md py-1 px-2 text-teal-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-teal-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of PRs:</label>
                        <input 
                          type="number" 
                          value={safeNumberInput(showData.premiershipCounts.prs)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-teal-50 border border-teal-200 rounded-md py-1 px-2 text-teal-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                      <div className="flex items-center space-x-3 h-8">
                        <label className="text-sm font-semibold text-teal-800 w-32" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Total Count:</label>
                        <input 
                          type="number" 
                          value={safeNumberInput(showData.premiershipCounts.total)} 
                          readOnly 
                          className="w-20 text-center text-sm font-semibold bg-teal-50 border border-teal-200 rounded-md py-1 px-2 text-teal-800" 
                          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Household Pet Count Section */}
                <section className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100 p-4 shadow-sm">
                  <header className="flex items-center mb-3">
                    <div className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-green-500 rounded-full mr-3"></div>
                    <div>
                      <h3 className="text-base font-semibold text-emerald-900 tracking-wide" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Household Pet Count</h3>
                    </div>
                  </header>
                  
                  <div className="flex items-center space-x-3 h-8">
                    <label className="text-sm font-semibold text-gray-700 w-40" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}># of Household Pets:</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={safeNumberInput(showData.householdPetCount)} 
                      onChange={e => updateShowData('householdPetCount', parseInt(e.target.value) || 0)} 
                      onFocus={handleNumberFocus}
                      onBlur={e => handleNumberBlur(e, 'householdPetCount')} 
                      className="w-20 text-center text-sm font-medium bg-white border border-emerald-200 rounded-md py-1 px-2 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 focus:outline-none transition-all duration-200 shadow-sm" 
                      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
                    />
                  </div>
                </section>
            </div>
          )}
          </div>
        </div>

        {/* Judge Information - Modern Design */}
        <div className="group relative">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl pointer-events-none"></div>
          <div className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-300 transform hover:scale-[1.005] group-hover:border-amber-200">
            {/* Decorative accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <h2 className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                <div>
                  <span className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>Judge Information</span>
                </div>
              </div>
              <CornerCollapseIcon expanded={!isJudgeInfoCollapsed} onClick={() => setIsJudgeInfoCollapsed(v => !v)} label={isJudgeInfoCollapsed ? 'Expand section' : 'Collapse section'} gradient="linear-gradient(135deg, #f59e0b 60%, #d97706 100%)" />
          </h2>
            
          {!isJudgeInfoCollapsed && (
              <div>
                {/* Show explanation when no judges - Updated to match working top section */}
                {judges.length === 0 && (
                  <div 
                    className="flex flex-col items-center justify-center p-4 mb-6 bg-gradient-to-br from-amber-50 via-white to-yellow-50 rounded-2xl shadow-lg border border-amber-100 max-w-xl mx-auto"
                  >
                    {/* Expand the cat animation container - Same as top section */}
                    <div 
                      className="relative mb-4 flex items-end justify-center" 
                      style={{ 
                        overflow: 'visible',
                        height: '160px',  // Increased from 130px
                        width: '200px',   // Give it explicit width
                      }}
                    >
                      
                      {/* Cat Shadow - Keep current positioning */}
                      <img
                        src="/assets/cat_shadow.svg"
                        alt="Cat shadow"
                        className="animate-shadow-expand"
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 'calc(50% - 40px)',
                          width: '80px',
                          height: '24px',
                          zIndex: 10,
                          display: 'block',
                        }}
                      />
                      
                      {/* Cat Image - Keep current positioning */}
                      <img 
                        src="/assets/cat_top.png" 
                        alt="Jumping cat" 
                        className="animate-cat-jump"
                        style={{
                          position: 'absolute',
                          bottom: '10px', // Start 10px higher than current position
                          left: 'calc(50% - 90px)', // Adjusted for larger size
                          width: '180px', // Increased by 1/6 (154 * 1.167)
                          height: '114px', // Increased by 1/6 (98 * 1.167)
                          zIndex: 20,
                          display: 'block',
                        }}
                      />
                      
                      {/* Yellow Question Mark - Follows cat's head exactly */}
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '120px', // Position above cat's head
                          left: 'calc(50% - 15px)', // Center above cat
                          width: '30px',
                          height: '30px',
                          zIndex: 30,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'rotate(15deg) translateY(-20px)', // Slightly tilted and move up with cat
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#b45309', // Same color as "No Judges Assigned" text (amber-700)
                          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                          animation: 'cat-jump 2.2s infinite ease-in-out, question-blink 2.5s infinite ease-in-out', // Jump animation + slower blink animation
                          animationDelay: '0.05s, 0s', // Reduced jump delay to sync better with cat
                        }}
                      >
                        ?
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold font-serif text-amber-700 mb-2 text-center">No Judges Assigned</h3>
                    <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full mb-4 mx-auto"></div>
                    <ul className="space-y-3 text-base text-slate-700 font-medium w-full max-w-xs mx-auto">
                      <li className="flex items-start space-x-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-lg shadow-sm">1</span>
                        <span>Set the <span className="font-semibold text-amber-600"># of Judges</span> field above to a number between <span className="font-semibold">1-12</span></span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-lg shadow-sm">2</span>
                        <span>Fill in the <span className="font-semibold text-amber-600">judge name</span>, <span className="font-semibold text-amber-600">acronym</span>, and <span className="font-semibold text-amber-600">ring type</span> for each judge</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-lg shadow-sm">3</span>
                        <span>All fields marked with <span className="text-red-500 text-base align-middle">●</span> are required</span>
                      </li>
                    </ul>
                  </div>
                )}
                
                {/* Judge table */}
                {judges.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full rounded-2xl bg-white/95 shadow border border-gray-200">
                <thead>
                        <tr>
                          <th className="uppercase text-xs font-bold tracking-wider text-slate-700 bg-white border-b border-zinc-200 py-2 px-3 text-left font-serif w-20">Ring #</th>
                          <th className="uppercase text-xs font-bold tracking-wider text-slate-700 bg-white border-b border-zinc-200 py-2 px-3 text-left font-serif w-48">Judge Name <span className="text-red-500 text-base">●</span></th>
                          <th className="uppercase text-xs font-bold tracking-wider text-slate-700 bg-white border-b border-zinc-200 py-2 px-3 text-left font-serif w-28">Acronym <span className="text-red-500 text-base">●</span></th>
                          <th className="uppercase text-xs font-bold tracking-wider text-slate-700 bg-white border-b border-zinc-200 py-2 px-3 text-left font-serif w-40">Ring Type <span className="text-red-500 text-base">●</span></th>
                          <th className="bg-white border-b border-zinc-200 py-2 px-3 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {judges.map((judge, index) => (
                    <tr key={judge.id} className={index % 2 === 0 ? "bg-white" : "bg-zinc-50"} style={{ height: 40 }}>
                      <td className="px-3 py-2 align-middle"><span className="inline-block min-w-[2rem] px-2 py-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-200 text-slate-800 font-bold text-xs shadow font-mono text-center border border-amber-100">{index + 1}</span></td>
                      <td className="px-3 py-2 align-middle"><input type="text" value={judge.name} onChange={e => updateJudge(judge.id, 'name', e.target.value)} onFocus={() => handleFieldFocus(`judge${index}Name`)} onBlur={handleFieldBlur} className="w-full rounded-full px-3 py-1.5 text-sm font-medium border border-zinc-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 !focus:border-amber-400 !focus:ring-amber-100 transition-all duration-200 shadow-sm bg-white placeholder-zinc-300" placeholder="Enter judge name" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} /></td>
                      <td className="px-3 py-2 align-middle"><input type="text" value={judge.acronym} onChange={e => updateJudge(judge.id, 'acronym', e.target.value)} onFocus={() => handleFieldFocus(`judge${index}Acronym`)} onBlur={handleFieldBlur} className="w-full rounded-full px-3 py-1.5 text-sm font-medium border border-zinc-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 !focus:border-amber-400 !focus:ring-amber-100 transition-all duration-200 shadow-sm bg-white placeholder-zinc-300" placeholder="Acronym" maxLength={5} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }} /></td>
                      <td className="px-3 py-2 align-middle"><CustomSelect options={["Longhair", "Shorthair", "Allbreed", "Double Specialty"]} value={judge.ringType} onChange={val => updateJudge(judge.id, 'ringType', val)} ariaLabel="Ring Type" className="min-w-[120px] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 !focus:border-amber-400 !focus:ring-amber-100" /></td>
                      <td className="px-3 py-2 align-middle text-center"><div className="flex items-center justify-center"><div className="relative group"><button type="button" onClick={() => { const newJudges = judges.filter(j => j.id !== judge.id); const reindexedJudges = reindexJudges(newJudges); setJudges(reindexedJudges); setShowData(prev => ({ ...prev, numberOfJudges: reindexedJudges.length })); }} className="p-1.5 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 hover:from-amber-200 hover:to-amber-300 shadow hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400" title="Remove judge" onMouseEnter={e => e.currentTarget.parentElement?.classList.add('show-tooltip')} onMouseLeave={e => e.currentTarget.parentElement?.classList.remove('show-tooltip')}><svg className="w-4 h-4 text-amber-700 group-hover:text-red-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span className="sr-only">Remove judge</span><span className="absolute -top-7 left-1/2 -translate-x-1/2 scale-0 group-[.show-tooltip]:scale-100 transition-transform duration-200 bg-amber-700 text-white text-xs rounded px-2 py-1 shadow-lg pointer-events-none z-10">Remove judge</span></button></div></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Premium Action Buttons */}
        <ActionButtons
          onSaveToCSV={handleSaveToCSVClick}
          onLoadFromCSV={handleRestoreFromCSVClick}
          onReset={handleResetClick}
          onFillTestData={handleFillTestData}
        />
      </div>
    </div>
  );
} 