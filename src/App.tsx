import { useState, useEffect, useRef } from 'react'
import GeneralTab from './components/GeneralTab'
import ChampionshipTab from './components/ChampionshipTab'
import type { ChampionshipTabRef } from './components/ChampionshipTab'
import ToastContainer from './components/ToastContainer'
import { useToast } from './hooks/useToast'
import cfaLogo from './assets/cfa-logo-official.png';
import PremiershipTab from './components/PremiershipTab'
import KittenTab from './components/KittenTab'
import HouseholdPetTab from './components/HouseholdPetTab'
import SettingsPanel from './components/SettingsPanel'
import Tooltip from './components/Tooltip'

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
    lhNovs: number; // NEW – LH novices
    shNovs: number; // NEW – SH novices
    novs: number;   // Aggregated novices (auto-calc)
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
    lhNovs: number; // NEW – LH novices
    shNovs: number; // NEW – SH novices
    novs: number;   // Aggregated novices (auto-calc)
    prs: number;    // total PRs (auto-calculated)
    total: number;
  };
  householdPetCount: number;
}

function App() {
  const [activeTab, setActiveTab] = useState('general');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom level in percentage
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings panel state
  const [showData, setShowData] = useState<ShowData>({
    showDate: '',
    clubName: '',
    masterClerk: '',
    numberOfJudges: 0,
    championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
    kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
    premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, prs: 0, total: 0 },
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
    const novs = showData.championshipCounts.lhNovs + showData.championshipCounts.shNovs;
    const total = gcs + chs + novs;
    setShowData(prev => ({
      ...prev,
      championshipCounts: {
        ...prev.championshipCounts,
        gcs,
        chs,
        novs,
        total
      }
    }));
  }, [showData.championshipCounts.lhGcs, showData.championshipCounts.shGcs, showData.championshipCounts.lhChs, showData.championshipCounts.shChs, showData.championshipCounts.lhNovs, showData.championshipCounts.shNovs]);

  // Auto-calculate premiership counts
  useEffect(() => {
    const gps = showData.premiershipCounts.lhGps + showData.premiershipCounts.shGps;
    const prs = showData.premiershipCounts.lhPrs + showData.premiershipCounts.shPrs;
    const novs = showData.premiershipCounts.lhNovs + showData.premiershipCounts.shNovs;
    const total = gps + prs + novs;
    setShowData(prev => ({
      ...prev,
      premiershipCounts: {
        ...prev.premiershipCounts,
        gps,
        prs,
        novs,
        total
      }
    }));
  }, [showData.premiershipCounts.lhGps, showData.premiershipCounts.shGps, showData.premiershipCounts.lhPrs, showData.premiershipCounts.shPrs, showData.premiershipCounts.lhNovs, showData.premiershipCounts.shNovs]);

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
      championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, lhNovs: 0, shNovs: 0, novs: 0, chs: 0, total: 0 },
      kittenCounts: { lhKittens: 0, shKittens: 0, total: 0 },
      premiershipCounts: { gps: 0, lhGps: 0, shGps: 0, lhPrs: 0, shPrs: 0, lhNovs: 0, shNovs: 0, novs: 0, prs: 0, total: 0 },
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
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img src={cfaLogo} alt="CFA Logo" className="h-12 w-auto" />
            </div>
            
            {/* Centered Title */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1
                className="text-3xl md:text-4xl font-bold modern-header-gradient text-center"
                style={{
                  background: 'linear-gradient(90deg, #a89256 0%, #d6cfa1 60%, #e5e4e2 100%)',
                  color: '#b7a97a',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 8px #b7a97a33',
                  fontFamily: 'Inter, Montserrat, Arial, Helvetica Neue, sans-serif',
                  letterSpacing: '0.01em',
                  margin: 0,
                  padding: 0,
                }}
              >
                CFA Master Clerk Entry Tool
              </h1>
              <p
                className="mt-1 text-sm md:text-base font-normal text-center"
                style={{
                  color: '#d6d5ce', // soft platinum/muted gray
                  fontWeight: 400,
                  letterSpacing: '0.03em',
                  fontFamily: 'Inter, Montserrat, Arial, Helvetica Neue, sans-serif',
                  background: 'none',
                  border: 'none',
                  boxShadow: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                Professional Cat Show Data Management
              </p>
            </div>
            
            {/* Zoom Controls and Settings */}
            <div className="flex items-center gap-3">
              {/* Zoom Controls */}
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#C7B273]/30">
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-[#C7B273]/20 hover:bg-[#C7B273]/30 transition-colors duration-200 text-[#C7B273] hover:text-white"
                  title="Zoom Out (Shift + Scroll)"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <span className="text-sm font-medium text-[#C7B273] min-w-[3rem] text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-[#C7B273]/20 hover:bg-[#C7B273]/30 transition-colors duration-200 text-[#C7B273] hover:text-white"
                  title="Zoom In (Shift + Scroll)"
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Settings Gear */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#C7B273]/20 hover:bg-[#C7B273]/30 transition-all duration-200 text-[#C7B273] hover:text-white border border-[#C7B273]/30 hover:border-[#C7B273]/50"
                title="Settings"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      {/* --- Refined, business-class tab bar --- */}
      <div className="w-full flex justify-center items-center py-4" style={{ background: 'rgba(20,20,20,0.92)', borderBottom: '2px solid #C7B273' }}>
        <div className="flex gap-2 px-2">
          {/* General Tab */}
          <button
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 ${activeTab === 'general' ? 'border-[#C7B273] text-[#C7B273] shadow-gold' : 'border-transparent text-gray-200 hover:border-[#C7B273] hover:text-[#C7B273]'}`}
            onClick={() => setActiveTab('general')}
            aria-current={activeTab === 'general'}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="3" y="7" width="14" height="10" rx="2" stroke="#C7B273" strokeWidth="2"/><rect x="7" y="3" width="6" height="4" rx="1" stroke="#C7B273" strokeWidth="2"/></svg>
            General
          </button>
          {/* Championship Tab */}
          {championshipTabDisabled ? (
            <Tooltip content="Complete General Info to unlock.">
              <button
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 disabled`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32-3.87-3.77 5.34-.78L10 2z" stroke="#C7B273" strokeWidth="2" fill="none"/></svg>
                Championship
              </button>
            </Tooltip>
          ) : (
            <button
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 ${activeTab === 'championship' ? 'border-[#C7B273] text-[#C7B273] shadow-gold' : 'border-transparent text-gray-200 hover:border-[#C7B273] hover:text-[#C7B273]'}`}
              onClick={() => setActiveTab('championship')}
              aria-disabled={false}
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32-3.87-3.77 5.34-.78L10 2z" stroke="#C7B273" strokeWidth="2" fill="none"/></svg>
              Championship
            </button>
          )}
          {/* Kittens Tab */}
          {kittenTabDisabled ? (
            <Tooltip content="Complete General Info to unlock.">
              <button
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 disabled`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><ellipse cx="10" cy="13" rx="6" ry="4" stroke="#C7B273" strokeWidth="2"/><circle cx="7" cy="8" r="2" stroke="#C7B273" strokeWidth="2"/><circle cx="13" cy="8" r="2" stroke="#C7B273" strokeWidth="2"/></svg>
                Kittens
              </button>
            </Tooltip>
          ) : (
                  <button
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 ${activeTab === 'kitten' ? 'border-[#C7B273] text-[#C7B273] shadow-gold' : 'border-transparent text-gray-200 hover:border-[#C7B273] hover:text-[#C7B273]'}`}
              onClick={() => setActiveTab('kitten')}
              aria-disabled={false}
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><ellipse cx="10" cy="13" rx="6" ry="4" stroke="#C7B273" strokeWidth="2"/><circle cx="7" cy="8" r="2" stroke="#C7B273" strokeWidth="2"/><circle cx="13" cy="8" r="2" stroke="#C7B273" strokeWidth="2"/></svg>
              Kittens
                  </button>
          )}
          {/* Premiership Tab */}
          {premiershipTabDisabled ? (
            <Tooltip content="Complete General Info to unlock.">
              <button
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 disabled`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="#C7B273" strokeWidth="2"/><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#C7B273">PR</text></svg>
                Premiership
              </button>
            </Tooltip>
          ) : (
            <button
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 ${activeTab === 'premiership' ? 'border-[#C7B273] text-[#C7B273] shadow-gold' : 'border-transparent text-gray-200 hover:border-[#C7B273] hover:text-[#C7B273]'}`}
              onClick={() => setActiveTab('premiership')}
              aria-disabled={false}
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" stroke="#C7B273" strokeWidth="2"/><text x="10" y="15" textAnchor="middle" fontSize="10" fill="#C7B273">PR</text></svg>
              Premiership
            </button>
          )}
          {/* Household Pet Tab */}
          {showData.householdPetCount <= 0 ? (
            <Tooltip content="Complete General Info to unlock.">
              <button
                className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 disabled`}
                aria-disabled="true"
                tabIndex={-1}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#C7B273" strokeWidth="2"/><ellipse cx="10" cy="6" rx="4" ry="3" stroke="#C7B273" strokeWidth="2"/></svg>
                Household Pet
              </button>
            </Tooltip>
          ) : (
            <button
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base transition-all duration-200 focus:outline-none modern-tab-font border-b-2 ${activeTab === 'household' ? 'border-[#C7B273] text-[#C7B273] shadow-gold' : 'border-transparent text-gray-200 hover:border-[#C7B273] hover:text-[#C7B273]'}`}
              onClick={() => setActiveTab('household')}
              aria-disabled={false}
              tabIndex={0}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 20 20"><rect x="4" y="8" width="12" height="8" rx="2" stroke="#C7B273" strokeWidth="2"/><ellipse cx="10" cy="6" rx="4" ry="3" stroke="#C7B273" strokeWidth="2"/></svg>
              Household Pet
            </button>
          )}
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

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showSuccess={showSuccess}
      />
      {/* App Version Badge Footer */}
      <footer className="fixed bottom-4 right-4 z-50">
        <div
          className="flex items-center px-4 py-1.5 rounded-full bg-black/70 border border-[#C7B273] shadow-lg text-[#C7B273] font-semibold text-sm backdrop-blur-md transition-all duration-200 hover:shadow-gold cursor-pointer select-none"
          title="App Version"
          style={{ boxShadow: '0 2px 12px 0 #C7B27355, 0 0 8px 2px #C7B27322' }}
        >
          <svg width="10" height="10" fill="#C7B273" className="mr-2" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></svg>
          Version 0.1.0
        </div>
      </footer>
    </div>
  )
}

export default App
