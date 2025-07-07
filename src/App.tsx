import { useState, useEffect, useRef } from 'react'
import GeneralTab from './components/GeneralTab'
import ChampionshipTab from './components/ChampionshipTab'
import type { ChampionshipTabRef } from './components/ChampionshipTab'
import ToastContainer from './components/ToastContainer'
import { useToast } from './hooks/useToast'
import cfaLogo from './assets/cfa-logo.png'
import PremiershipTab from './components/PremiershipTab'
import KittenTab from './components/KittenTab'
import HouseholdPetTab from './components/HouseholdPetTab'

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
    gps: number; // total GPs (auto-calculated)
    lhGps: number;
    shGps: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
    prs: number; // total PRs (auto-calculated)
    total: number;
  };
  householdPetCount: number;
}

function App() {
  const [activeTab, setActiveTab] = useState('general');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom level in percentage
  const [showData, setShowData] = useState<ShowData>({
    showDate: '',
    clubName: '',
    masterClerk: '',
    numberOfJudges: 0,
    championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, novs: 0, chs: 0, total: 0 },
    kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
    premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 },
    householdPetCount: 0
  });

  // Toast notification system
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // Ref for ChampionshipTab to call fillTestData
  const championshipTabRef = useRef<ChampionshipTabRef>(null);

  // State to track when Championship test data should be filled
  const [shouldFillChampionshipData] = useState(false);

  // --- ChampionshipTab State ---
  const [championshipTabData, setChampionshipTabData] = useState({
    showAwards: {},
    championsFinals: {},
    lhChampionsFinals: {},
    shChampionsFinals: {},
    voidedShowAwards: {},
    voidedChampionsFinals: {},
    voidedLHChampionsFinals: {},
    voidedSHChampionsFinals: {},
    errors: {},
  });
  // --- PremiershipTab State ---
  const [premiershipTabData, setPremiershipTabData] = useState({
    showAwards: {},
    premiersFinals: {},
    abPremiersFinals: {},
    lhPremiersFinals: {},
    shPremiersFinals: {},
    voidedShowAwards: {},
    voidedPremiersFinals: {},
    voidedABPremiersFinals: {},
    voidedLHPremiersFinals: {},
    voidedSHPremiersFinals: {},
    errors: {},
  });

  // Kitten tab state
  const [kittenTabData, setKittenTabData] = useState({ 
    showAwards: {}, 
    voidedShowAwards: {},
    errors: {},
    focusedColumnIndex: null as number | null,
    isResetModalOpen: false,
    isCSVErrorModalOpen: false // NEW: Modal for CSV error
  });

  // Household Pet tab state (LIFTED)
  const [householdPetTabData, setHouseholdPetTabData] = useState({ showAwards: {}, voidedShowAwards: {} });

  // Auto-calculate championship counts
  useEffect(() => {
    const gcs = showData.championshipCounts.lhGcs + showData.championshipCounts.shGcs;
    const chs = showData.championshipCounts.lhChs + showData.championshipCounts.shChs;
    const total = gcs + chs + showData.championshipCounts.novs;
    setShowData(prev => ({
      ...prev,
      championshipCounts: {
        ...prev.championshipCounts,
        gcs,
        chs,
        total
      }
    }));
  }, [showData.championshipCounts.lhGcs, showData.championshipCounts.shGcs, showData.championshipCounts.lhChs, showData.championshipCounts.shChs, showData.championshipCounts.novs]);

  // Auto-calculate premiership counts
  useEffect(() => {
    const gps = showData.premiershipCounts.lhGps + showData.premiershipCounts.shGps;
    const prs = showData.premiershipCounts.lhPrs + showData.premiershipCounts.shPrs;
    const total = gps + prs + showData.premiershipCounts.novs;
    setShowData(prev => ({
      ...prev,
      premiershipCounts: {
        ...prev.premiershipCounts,
        gps,
        prs,
        total
      }
    }));
  }, [showData.premiershipCounts.lhGps, showData.premiershipCounts.shGps, showData.premiershipCounts.lhPrs, showData.premiershipCounts.shPrs, showData.premiershipCounts.novs]);

  // Auto-calculate kitten counts
  useEffect(() => {
    const total = showData.kittenCounts.lhKittens + showData.kittenCounts.shKittens;
    setShowData(prev => ({
      ...prev,
      kittenCounts: {
        ...prev.kittenCounts,
        total
      }
    }));
  }, [showData.kittenCounts.lhKittens, showData.kittenCounts.shKittens]);

  // Update number of judges when judges array changes
  useEffect(() => {
    setShowData(prev => ({
      ...prev,
      numberOfJudges: judges.length
    }));
  }, [judges]);

  // Helper to check if all required Show Information fields are valid
  function isShowInfoValid(showData: ShowData) {
    return (
      !!showData.showDate &&
      !!showData.clubName.trim() &&
      showData.clubName.length <= 255 &&
      !!showData.masterClerk.trim() &&
      showData.masterClerk.length <= 120
    );
  }

  // Helper to check if all judge fields are valid and non-empty
  function areJudgesValid(judges: Judge[]) {
    if (judges.length === 0) return false;
    const names = new Set();
    for (const judge of judges) {
      if (!judge.name.trim() || judge.name.length > 120) return false;
      if (!judge.acronym.trim() || judge.acronym.length > 6) return false;
      if (!judge.ringType) return false;
      if (names.has(judge.name.trim())) return false;
      names.add(judge.name.trim());
    }
    return true;
  }

  // Reset all application data and return to General tab
  const resetAllData = () => {
    setShowData({
      showDate: new Date().toISOString().split('T')[0], // Set to today's date
      clubName: '',
      masterClerk: '',
      numberOfJudges: 0,
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 },
      householdPetCount: 0
    });
    setJudges([]);
    setActiveTab('general');
    
    showSuccess(
      'All Data Reset',
      'All application data has been successfully reset. You are now on the General tab.',
      4000
    );
  };

  const championshipTabDisabled =
    showData.championshipCounts.total === 0 ||
    !isShowInfoValid(showData) ||
    !areJudgesValid(judges);
  const kittenTabDisabled =
    showData.kittenCounts.total === 0 ||
    !isShowInfoValid(showData) ||
    !areJudgesValid(judges);
  const premiershipTabDisabled =
    showData.premiershipCounts.total === 0 ||
    !isShowInfoValid(showData) ||
    !areJudgesValid(judges);

  // Helper: Reset championship and premiership columns for a judge when ring type changes (any change)
  const handleJudgeRingTypeChange = (
    judgeId: number,
    oldType: string,
    newType: string
  ) => {
    // Helper to generate columns for a given judges array
    function generateColumns(judgesArr: Judge[]): { judge: Judge; specialty: string }[] {
      const columns: { judge: Judge; specialty: string }[] = [];
      judgesArr.forEach(judge => {
        if (judge.ringType === 'Double Specialty') {
          columns.push({ judge, specialty: 'Longhair' });
          columns.push({ judge, specialty: 'Shorthair' });
        } else {
          columns.push({ judge, specialty: judge.ringType });
        }
      });
      return columns;
    }

    // Helper to build a reverse map for old columns: columnIndex -> {judgeId, specialty}
    function buildIdxToKey(columns: { judge: Judge; specialty: string }[]) {
      const map: Record<number, string> = {};
      columns.forEach((col, idx) => {
        map[idx] = `${col.judge.id}-${col.specialty}`;
      });
      return map;
    }

    // For each section, rebuild the data:
    function resetColumns(
      setTabData: React.Dispatch<React.SetStateAction<unknown>>,
      tabType: 'championship' | 'premiership' | 'kitten'
    ) {
      const sections = tabType === 'championship'
        ? ['showAwards', 'championsFinals', 'lhChampionsFinals', 'shChampionsFinals', 'voidedShowAwards', 'voidedChampionsFinals', 'voidedLHChampionsFinals', 'voidedSHChampionsFinals', 'errors']
        : ['showAwards', 'premiersFinals', 'abPremiersFinals', 'lhPremiersFinals', 'shPremiersFinals', 'voidedShowAwards', 'voidedPremiersFinals', 'voidedABPremiersFinals', 'voidedLHPremiersFinals', 'voidedSHPremiersFinals', 'errors'];
      setTabData((prev: unknown) => {
        const oldJudges = judges.map(j => j.id === judgeId ? { ...j, ringType: oldType } : j);
        const newJudges = judges.map(j => j.id === judgeId ? { ...j, ringType: newType } : j);
        const oldColumns = generateColumns(oldJudges);
        const newColumns = generateColumns(newJudges);
        const oldIdxToKey = buildIdxToKey(oldColumns);
        const newIdxToKey = buildIdxToKey(newColumns);
        const newData = { ...(prev as Record<string, unknown>) };
        for (const section of sections) {
          if (!newData[section]) continue;
          const rebuilt: Record<string, unknown> = {};
          Object.entries(newIdxToKey).forEach(([newIdxStr, key]) => {
            const [jIdStr] = key.split('-');
            if (parseInt(jIdStr, 10) === judgeId) {
              // Reset all data for affected judge's columns (do not copy old data)
            } else {
              const oldIdx = Object.entries(oldIdxToKey).find(([, k]) => k === key)?.[0];
              if (oldIdx !== undefined) {
                Object.entries(newData[section] as Record<string, unknown>).forEach(([dataKey, value]) => {
                  const [colIdxStr] = dataKey.split(/[-_]/);
                  if (parseInt(colIdxStr, 10) === parseInt(oldIdx, 10)) {
                    const newKey = dataKey.replace(/^[0-9]+/, newIdxStr);
                    rebuilt[newKey] = value;
                  }
                });
              }
            }
          });
          newData[section] = rebuilt;
        }
        return newData;
      });
    }
    resetColumns(setChampionshipTabData as React.Dispatch<React.SetStateAction<unknown>>, 'championship');
    resetColumns(setPremiershipTabData as React.Dispatch<React.SetStateAction<unknown>>, 'premiership');
    resetColumns(setKittenTabData as React.Dispatch<React.SetStateAction<unknown>>, 'kitten');
  };

  // Function to return the full show state for CSV export
  const getShowState = () => ({
    general: showData,
    judges,
    championship: championshipTabData,
    premiership: premiershipTabData,
    kitten: kittenTabData,
    household: {
      householdPetCount: showData.householdPetCount,
      ...householdPetTabData,
    },
  });

  // Function to handle CSV import and restore application state
  const handleCSVImport = async () => {
    try {
      const { handleRestoreFromCSV } = await import('./utils/formActions');
      const restoredState = await handleRestoreFromCSV(showSuccess, showError);
      if (!restoredState) return;

      // Update all state with restored data
      setShowData(restoredState.general);
      setJudges(restoredState.judges);
      setChampionshipTabData(restoredState.championship);
      setPremiershipTabData(restoredState.premiership);
      setKittenTabData(restoredState.kitten);
      setHouseholdPetTabData(restoredState.household);
    } catch (error) {
      showError('Import Error', 'An error occurred while importing the CSV file.');
    }
  };

  const tabs = [
    { 
      id: 'general', 
      name: 'General', 
      component: <GeneralTab 
        showData={showData}
        setShowData={setShowData}
        judges={judges}
        setJudges={setJudges}
        showSuccess={showSuccess}
        showError={showError}
        showWarning={showWarning}
        showInfo={showInfo}
        onJudgeRingTypeChange={handleJudgeRingTypeChange}
        getShowState={getShowState}
        onCSVImport={handleCSVImport}
      />,
      disabled: false
    },
    { 
      id: 'championship', 
      name: 'Championship', 
      component: <ChampionshipTab 
        ref={championshipTabRef}
        judges={judges} 
        championshipTotal={showData.championshipCounts.total}
        championshipCounts={{
          lhGcs: showData.championshipCounts.lhGcs,
          shGcs: showData.championshipCounts.shGcs,
          lhChs: showData.championshipCounts.lhChs,
          shChs: showData.championshipCounts.shChs
        }}
        showSuccess={showSuccess}
        showError={showError}
        showInfo={showInfo}
        shouldFillTestData={shouldFillChampionshipData}
        onResetAllData={resetAllData}
        championshipTabData={championshipTabData}
        setChampionshipTabData={setChampionshipTabData}
        onTabReset={() => setChampionshipTabData({
          showAwards: {},
          championsFinals: {},
          lhChampionsFinals: {},
          shChampionsFinals: {},
          voidedShowAwards: {},
          voidedChampionsFinals: {},
          voidedLHChampionsFinals: {},
          voidedSHChampionsFinals: {},
          errors: {},
        })}
        getShowState={getShowState}
        isActive={activeTab === 'championship'}
        onCSVImport={handleCSVImport}
      />,
      disabled: championshipTabDisabled
    },
    {
      id: 'kitten',
      name: 'Kittens',
      component: <KittenTab
        judges={judges}
        kittenCounts={showData.kittenCounts}
        showSuccess={showSuccess}
        showError={showError}
        isActive={activeTab === 'kitten'}
        kittenTabData={kittenTabData}
        setKittenTabData={setKittenTabData}
        onTabReset={() => setKittenTabData({ showAwards: {}, voidedShowAwards: {}, errors: {}, focusedColumnIndex: null, isResetModalOpen: false, isCSVErrorModalOpen: false })}
        getShowState={getShowState}
        onCSVImport={handleCSVImport}
      />,
      disabled: kittenTabDisabled
    },
    { 
      id: 'premiership', 
      name: 'Premiership', 
      component: <PremiershipTab 
        judges={judges}
        premiershipTotal={showData.premiershipCounts.total}
        premiershipCounts={{
          gps: showData.premiershipCounts.gps,
          lhGps: showData.premiershipCounts.lhGps,
          shGps: showData.premiershipCounts.shGps,
          lhPrs: showData.premiershipCounts.lhPrs,
          shPrs: showData.premiershipCounts.shPrs,
          novs: showData.premiershipCounts.novs,
          prs: showData.premiershipCounts.prs
        }}
        showSuccess={showSuccess}
        showError={showError}
        isActive={activeTab === 'premiership'}
        premiershipTabData={premiershipTabData}
        setPremiershipTabData={setPremiershipTabData}
        getShowState={getShowState}
        onCSVImport={handleCSVImport}
      />,
      disabled: premiershipTabDisabled
    },
    { 
      id: 'household', 
      name: 'Household Pet',
      component: <HouseholdPetTab
        judges={judges}
        householdPetCount={showData.householdPetCount}
        showSuccess={showSuccess}
        showError={showError}
        isActive={activeTab === 'household'}
        getShowState={getShowState} // Accepts full show state
        householdPetTabData={householdPetTabData}
        setHouseholdPetTabData={setHouseholdPetTabData}
        onTabReset={() => setHouseholdPetTabData({ showAwards: {}, voidedShowAwards: {} })}
        onCSVImport={handleCSVImport}
      />,
      disabled: showData.householdPetCount <= 0
    }
  ];

  // Auto-switch to General tab if current tab becomes disabled
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab?.disabled) {
      setActiveTab('general');
    }
  }, [activeTab, tabs]);

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200)); // Max 200%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50)); // Min 50%
  };

  // Handle keyboard zoom (Shift + mouse wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.shiftKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />

      {/* Header */}
      <header className="cfa-header">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img src={cfaLogo} alt="CFA Logo" className="h-12 w-auto" />
            </div>
            
            {/* Centered Title */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold cfa-header-text text-center">
                CFA Master Clerk Entry Tool
              </h1>
              <p className="cfa-header-subtitle text-sm text-center">Professional Cat Show Data Management</p>
            </div>
            
            {/* Version Badge */}
            <div className="cfa-badge">
              <span className="mr-1">●</span>
              Version 0.1.0
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="cfa-tab-nav">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex space-x-2">
              {tabs.map(tab => (
                <div key={tab.id} className="relative flex items-center group">
                  <button
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    className={`cfa-tab ${activeTab === tab.id ? 'cfa-tab-active' : 'text-gray-700'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={tab.disabled}
                    tabIndex={tab.disabled ? -1 : 0}
                    aria-disabled={tab.disabled}
                  >
                    {tab.name}
                  </button>
                  {/* Tooltip for disabled tabs - positioned outside the button */}
                  {tab.disabled && (
                    <div className="absolute left-1/2 -translate-x-1/2 -mb-2 z-20 hidden group-hover:block">
                      <div className="bg-white text-gray-800 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-300 whitespace-nowrap min-w-max flex items-center gap-2">
                        <span className="text-orange-500 font-bold">⚠</span>
                        Complete all required fields in the General tab to continue.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 bg-white rounded-lg shadow-md px-2 py-1">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Zoom Out (Shift + Scroll Down)"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="text-xs text-gray-600 font-medium min-w-[3rem] text-center">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Zoom In (Shift + Scroll Up)"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div 
          className="cfa-card cfa-card-hover"
          style={{ 
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  )
}

export default App
