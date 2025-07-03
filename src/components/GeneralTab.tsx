import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { validateGeneralForm } from '../validation/generalValidation';
import { handleSaveToTempCSV, handleGenerateFinalCSV, handleRestoreFromCSV, handleReset } from '../utils/formActions';

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
    gcs: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
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
}

export default function GeneralTab({ 
  showData, 
  setShowData, 
  judges, 
  setJudges,
  showSuccess,
  showError,
  showWarning: _showWarning,
  showInfo: _showInfo,
  onJudgeRingTypeChange
}: GeneralTabProps) {
  // Local state for form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [focusedField, setFocusedField] = useState<string>('');
  
  // Modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  // Refs for focus management
  const numberOfJudgesRef = useRef<HTMLInputElement>(null);
  const clubNameRef = useRef<HTMLInputElement>(null);
  const masterClerkRef = useRef<HTMLInputElement>(null);

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
      setShowData(prev => ({ ...prev, numberOfJudges: 12 }));
    }
    
    // Allow 0 judges (no minimum enforcement)
    if (targetCount < 0) {
      targetCount = 0;
      setShowData(prev => ({ ...prev, numberOfJudges: 0 }));
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
  }, [showData.numberOfJudges]);

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

  const updateShowData = (field: keyof ShowData, value: any) => {
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

  // Focus handler for number inputs - clear the field if it's 0
  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
      e.target.select(); // Select all text for immediate replacement
    }
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

  const handleSaveToTempCSVClick = () => {
    const errors = validateGeneralForm(showData, judges);
    setErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError(
        'Validation Errors',
        'Please fix all validation errors before saving to CSV. Check the form for highlighted fields with errors.',
        8000
      );
      return;
    }
    handleSaveToTempCSV(showData, judges, showSuccess, showError);
  };

  const handleGenerateFinalCSVClick = () => {
    const errors = validateGeneralForm(showData, judges);
    setErrors(errors);
    if (Object.keys(errors).length > 0) {
      showError(
        'Validation Errors',
        'Please fix all validation errors before generating the final CSV. Check the form for highlighted fields with errors.',
        8000
      );
      return;
    }
    handleGenerateFinalCSV(showData, judges, showSuccess, showError);
  };

  const handleRestoreFromCSVClick = () => {
    handleRestoreFromCSV(showData, showSuccess, showError);
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
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { gcs: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 },
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
    console.log('=== GeneralTab handleFillTestData called ===');
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Set number of judges to 6 if not already set
    const numberOfJudges = showData.numberOfJudges === 0 ? 6 : showData.numberOfJudges;
    
    // Fill basic show information
    const updatedShowData = {
      ...showData,
      showDate: today,
      clubName: 'Cat Fanciers Club',
      masterClerk: 'John Smith',
      numberOfJudges: numberOfJudges,
      championshipCounts: {
        gcs: Math.floor(Math.random() * 50) + 20,
        lhGcs: Math.floor(Math.random() * 30) + 15,
        shGcs: Math.floor(Math.random() * 30) + 15,
        lhChs: Math.floor(Math.random() * 30) + 15,
        shChs: Math.floor(Math.random() * 30) + 15,
        novs: Math.floor(Math.random() * 20) + 10,
        chs: 0, // Will be auto-calculated
        total: 0 // Will be auto-calculated
      },
      kittenCounts: {
        lhKittens: Math.floor(Math.random() * 15) + 5,
        shKittens: Math.floor(Math.random() * 15) + 5,
        total: 0 // Will be auto-calculated
      },
      premiershipCounts: {
        gcs: Math.floor(Math.random() * 40) + 15,
        lhPrs: Math.floor(Math.random() * 25) + 10,
        shPrs: Math.floor(Math.random() * 25) + 10,
        novs: Math.floor(Math.random() * 15) + 5,
        prs: 0, // Will be auto-calculated
        total: 0 // Will be auto-calculated
      },
      householdPetCount: Math.floor(Math.random() * 10) + 5
    };

    setShowData(updatedShowData);

    // Fill judge information
    const judgeNames = ['James Wilson', 'Robert Johnson', 'Mary Davis', 'Patricia Miller', 'Jennifer Garcia', 'Michael Brown', 'Elizabeth Jones', 'David Martinez', 'Richard Taylor', 'Susan Anderson', 'Thomas White', 'Nancy Thomas'];
    const judgeAcronyms = ['JW', 'RJ', 'MD', 'PM', 'JG', 'MB', 'EJ', 'DM', 'RT', 'SA', 'TW', 'NT'];
    // Force all judges to Allbreed for Allbreed testing
    const testJudges: Judge[] = [];
    for (let i = 0; i < numberOfJudges; i++) {
      const nameIndex = i % judgeNames.length;
      let judgeName = judgeNames[nameIndex];
      let judgeAcronym = judgeAcronyms[nameIndex];
      if (i >= judgeNames.length) {
        const suffix = Math.floor(i / judgeNames.length) + 1;
        judgeName += " " + suffix;
        judgeAcronym += suffix;
      }
      testJudges.push({
        id: i + 1,
        name: judgeName,
        acronym: judgeAcronym,
        ringType: 'Allbreed' // Force Allbreed for all judges
      });
    }
    console.log('Setting judges:', testJudges);
    setJudges(testJudges);
    showSuccess('Test Data Filled', 'General tab has been filled with realistic test data. Championship tab will now be available with test data.');
  };

  return (
    <div className="p-8">
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

      {/* Required Field Legend - Form Level */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-red-500 font-bold">*</span>
        <span className="text-sm text-gray-600">Required field</span>
      </div>

      <div className="space-y-8">
        {/* Show Information */}
        <div className="cfa-section">
          <h2 className="cfa-section-header">Show Information</h2>
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
        </div>

        {/* Show Count */}
        <div className="cfa-section">
          <h2 className="cfa-section-header">Show Count</h2>
          <div className="cfa-table">
            <table className="w-full">
              <tbody>
                {/* Championship Count */}
                <tr className="cfa-table-header">
                  <td colSpan={12} className="py-3 pl-4">Championship Count</td>
                </tr>
                <tr className="cfa-table-row">
                  <td className="text-sm font-medium pl-4 py-3"># of LH GCs:</td>
                  <td className="py-3"><input type="number" min="0" value={showData.championshipCounts.lhGcs} onChange={e => updateChampionshipCount('lhGcs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshiplhGcs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of SH GCs:</td>
                  <td><input type="number" min="0" value={showData.championshipCounts.shGcs} onChange={e => updateChampionshipCount('shGcs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipshGcs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of LH CHs:</td>
                  <td><input type="number" min="0" value={showData.championshipCounts.lhChs} onChange={e => updateChampionshipCount('lhChs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshiplhChs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of SH CHs:</td>
                  <td><input type="number" min="0" value={showData.championshipCounts.shChs} onChange={e => updateChampionshipCount('shChs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipshChs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of NOVs:</td>
                  <td><input type="number" min="0" value={showData.championshipCounts.novs} onChange={e => updateChampionshipCount('novs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'championshipnovs')} className="cfa-input w-20 text-sm"/></td>
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
                <tr className="cfa-table-row">
                  <td className="text-sm font-medium pl-4 py-3"># of GCs:</td>
                  <td className="py-3"><input type="number" min="0" value={showData.premiershipCounts.gcs} onChange={e => updatePremiershipCount('gcs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipgcs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of LH PRs:</td>
                  <td><input type="number" min="0" value={showData.premiershipCounts.lhPrs} onChange={e => updatePremiershipCount('lhPrs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershiplhPrs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of SH PRs:</td>
                  <td><input type="number" min="0" value={showData.premiershipCounts.shPrs} onChange={e => updatePremiershipCount('shPrs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipshPrs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of NOVs:</td>
                  <td><input type="number" min="0" value={showData.premiershipCounts.novs} onChange={e => updatePremiershipCount('novs', parseInt(e.target.value) || 0)} onFocus={handleNumberFocus} onBlur={(e) => handleNumberBlur(e, 'premiershipnovs')} className="cfa-input w-20 text-sm"/></td>
                  <td className="text-sm font-medium"># of PRs:</td>
                  <td><input type="number" value={showData.premiershipCounts.prs} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
                  <td className="text-sm font-medium">Total Count:</td>
                  <td><input type="number" value={showData.premiershipCounts.total} readOnly className="cfa-input cfa-input-readonly w-20 text-sm"/></td>
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
        </div>

        {/* Judge Information */}
        <div className="cfa-section">
          <h2 className="cfa-section-header">Judge Information</h2>
          
          {showData.numberOfJudges === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Judges Selected</h3>
              <p className="text-gray-600 mb-4">
                Please set the number of judges (1-12) in the "# of Judges" field above to begin entering judge information.
              </p>
              <div className="text-sm text-gray-500">
                <p>• Enter a number between 1-12 in the "# of Judges" field to add judges</p>
                <p>• Judge information table will appear once you set the count</p>
                <p>• You can set the count to 0 to clear all judges</p>
              </div>
            </div>
          ) : (
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
            <button
              type="button"
              onClick={handleFillTestData}
              className="cfa-button-secondary"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            >
              Fill Test Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 