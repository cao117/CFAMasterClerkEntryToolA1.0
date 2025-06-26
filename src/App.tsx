import { useState, useEffect } from 'react'
import GeneralTab from './components/GeneralTab'
import ChampionshipTab from './components/ChampionshipTab'
import ToastContainer from './components/ToastContainer'
import { useToast } from './hooks/useToast'
import cfaLogo from './assets/cfa-logo.png'

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
    championshipCounts: { gcs: 0, lhChs: 0, shChs: 0, novs: 0, chs: 0, total: 0 },
    kittenCount: 0,
    premiershipCounts: { gcs: 0, lhPrs: 0, shPrs: 0, novs: 0, prs: 0, total: 0 }
  });

  // Toast notification system
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();

  // Auto-calculate championship counts
  useEffect(() => {
    const chs = showData.championshipCounts.lhChs + showData.championshipCounts.shChs;
    const total = showData.championshipCounts.gcs + chs + showData.championshipCounts.novs;
    setShowData(prev => ({
      ...prev,
      championshipCounts: {
        ...prev.championshipCounts,
        chs,
        total
      }
    }));
  }, [showData.championshipCounts.gcs, showData.championshipCounts.lhChs, showData.championshipCounts.shChs, showData.championshipCounts.novs]);

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
      />,
      disabled: false
    },
    { 
      id: 'championship', 
      name: 'Championship', 
      component: <ChampionshipTab judges={judges} />,
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
      component: <div className="p-6 bg-white rounded-lg shadow"><h2 className="text-2xl font-bold mb-6 text-gray-800">Premiership Finals</h2><p className="text-gray-600">Coming soon...</p></div>,
      disabled: premiershipTabDisabled
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
