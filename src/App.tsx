import { useState, useEffect, useRef } from 'react'
import GeneralTab from './components/GeneralTab'
import ChampionshipTab from './components/ChampionshipTab'
import type { ChampionshipTabRef } from './components/ChampionshipTab'
import ToastContainer from './components/ToastContainer'
import { useToast } from './hooks/useToast'
import cfaLogo from './assets/cfa-logo.png'
import PremiershipTab from './components/PremiershipTab'

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
  kittenCount: number;
  premiershipCounts: {
    gcs: number;
    lhPrs: number;
    shPrs: number;
    novs: number;
    prs: number;
    total: number;
  };
}

function App() {
  const [activeTab, setActiveTab] = useState('general');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [showData, setShowData] = useState<ShowData>({
    showDate: '',
    clubName: '',
    masterClerk: '',
    numberOfJudges: 0,
    championshipCounts: { gcs: 0, lhGcs: 0, shGcs: 0, lhChs: 0, shChs: 0, novs: 0, chs: 0, total: 0 },
    kittenCount: 0,
    premiershipCounts: { gcs: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 }
  });

  // Toast notification system
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // Ref for ChampionshipTab to call fillTestData
  const championshipTabRef = useRef<ChampionshipTabRef>(null);

  // State to track when Championship test data should be filled
  const [shouldFillChampionshipData] = useState(false);
  // State to track when Premiership test data should be filled
  const [shouldFillPremiershipData] = useState(false);

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
    const prs = showData.premiershipCounts.lhPrs + showData.premiershipCounts.shPrs;
    const total = showData.premiershipCounts.gcs + prs + showData.premiershipCounts.novs;
    setShowData(prev => ({
      ...prev,
      premiershipCounts: {
        ...prev.premiershipCounts,
        prs,
        total
      }
    }));
  }, [showData.premiershipCounts.gcs, showData.premiershipCounts.lhPrs, showData.premiershipCounts.shPrs, showData.premiershipCounts.novs]);

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
      kittenCount: 0,
      premiershipCounts: { gcs: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 }
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
    showData.kittenCount === 0 ||
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

    // Helper to build a map from judgeId-specialty to column index for a given columns array
    function buildColumnMap(columns: { judge: Judge; specialty: string }[]) {
      const map: Record<string, number> = {};
      columns.forEach((col, idx) => {
        map[`${col.judge.id}-${col.specialty}`] = idx;
      });
      return map;
    }

    // Helper to reset tab data for the affected judge only, preserving all other data
    function resetColumns(
      tabData: any,
      setTabData: React.Dispatch<React.SetStateAction<any>>,
      tabType: 'championship' | 'premiership'
    ) {
      // Sections to update
      const sections = tabType === 'championship'
        ? ['showAwards', 'championsFinals', 'lhChampionsFinals', 'shChampionsFinals', 'voidedShowAwards', 'voidedChampionsFinals', 'voidedLHChampionsFinals', 'voidedSHChampionsFinals', 'errors']
        : ['showAwards', 'premiersFinals', 'abPremiersFinals', 'lhPremiersFinals', 'shPremiersFinals', 'voidedShowAwards', 'voidedPremiersFinals', 'voidedABPremiersFinals', 'voidedLHPremiersFinals', 'voidedSHPremiersFinals', 'errors'];
      setTabData((prev: any) => {
        // Generate columns for old and new config
        const oldJudges = judges.map(j => j.id === judgeId ? { ...j, ringType: oldType } : j);
        const newJudges = judges.map(j => j.id === judgeId ? { ...j, ringType: newType } : j);
        const oldColumns = generateColumns(oldJudges);
        const newColumns = generateColumns(newJudges);
        const oldColMap = buildColumnMap(oldColumns);
        const newColMap = buildColumnMap(newColumns);
        // Build a reverse map for old columns: columnIndex -> {judgeId, specialty}
        const oldIdxToKey: Record<number, string> = {};
        oldColumns.forEach((col, idx) => {
          oldIdxToKey[idx] = `${col.judge.id}-${col.specialty}`;
        });
        // Build a map for new columns: columnIndex -> {judgeId, specialty}
        const newIdxToKey: Record<number, string> = {};
        newColumns.forEach((col, idx) => {
          newIdxToKey[idx] = `${col.judge.id}-${col.specialty}`;
        });
        // For each section, rebuild the data:
        const newData = { ...prev };
        for (const section of sections) {
          if (!newData[section]) continue;
          const rebuilt: Record<string, any> = {};
          // For each key in the new config, try to copy from old config if not the affected judge
          Object.entries(newIdxToKey).forEach(([newIdxStr, key]) => {
            const newIdx = parseInt(newIdxStr, 10);
            const [jIdStr] = key.split('-');
            if (parseInt(jIdStr, 10) === judgeId) {
              // Reset all data for affected judge's columns (do not copy old data)
              // For each possible position, leave empty (do not set)
              // (UI will show empty cells)
            } else {
              // For all other judges, try to find the old column index for this judgeId-specialty
              const oldIdx = Object.entries(oldIdxToKey).find(([_idx, k]) => k === key)?.[0];
              if (oldIdx !== undefined) {
                // Copy all positions for this column from old to new
                Object.entries(newData[section]).forEach(([dataKey, value]) => {
                  // dataKey is like 'colIdx-pos' or 'colIdx_pos'
                  const [colIdxStr, pos] = dataKey.split(/[-_]/);
                  if (parseInt(colIdxStr, 10) === parseInt(oldIdx, 10)) {
                    // Re-key for new column index
                    const newKey = dataKey.replace(/^\d+/, newIdxStr);
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
    resetColumns(championshipTabData, setChampionshipTabData, 'championship');
    resetColumns(premiershipTabData, setPremiershipTabData, 'premiership');
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
      />,
      disabled: championshipTabDisabled
    },
    { 
      id: 'kitten', 
      name: 'Kitten', 
      component: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold mb-6 text-gray-800">Kitten Finals</h2><p className="text-gray-600">Coming soon...</p></div>,
      disabled: kittenTabDisabled
    },
    { 
      id: 'premiership', 
      name: 'Premiership', 
      component: <PremiershipTab 
        judges={judges}
        premiershipTotal={showData.premiershipCounts.total}
        premiershipCounts={{
          gcs: showData.premiershipCounts.gcs,
          lhPrs: showData.premiershipCounts.lhPrs,
          shPrs: showData.premiershipCounts.shPrs,
          novs: showData.premiershipCounts.novs
        }}
        showSuccess={showSuccess}
        showError={showError}
        showInfo={showInfo}
        onResetAllData={resetAllData}
        isActive={activeTab === 'premiership'}
        shouldFillTestData={shouldFillPremiershipData}
        premiershipTabData={premiershipTabData}
        setPremiershipTabData={setPremiershipTabData}
        onTabReset={() => setPremiershipTabData({
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
        })}
      />,
      disabled: premiershipTabDisabled
    },
    { 
      id: 'household', 
      name: 'Household Cats', 
      component: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold mb-6 text-gray-800">Household Cats</h2><p className="text-gray-600">Coming soon...</p></div>,
      disabled: false
    }
  ];

  // Auto-switch to General tab if current tab becomes disabled
  useEffect(() => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (currentTab?.disabled) {
      setActiveTab('general');
    }
  }, [showData.championshipCounts.total, showData.kittenCount, showData.premiershipCounts.total]);

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
              Version 1.0
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="cfa-tab-nav">
        <div className="max-w-7xl mx-auto px-4 py-4">
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="cfa-card cfa-card-hover">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </div>
    </div>
  )
}

export default App
