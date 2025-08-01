import React, { useState } from 'react';
import cfaLogo from '../assets/cfa-logo-official.png';
import { useEffect, useRef } from 'react';
import SettingsInput from './SettingsInput';
import Modal from './Modal';
import { AutoSaveService } from '../utils/autoSaveService';


// Settings data structure
interface SettingsData {
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
  numberOfSaves: number;
  saveCycle: number;
}

// Default values as specified
const DEFAULT_SETTINGS: SettingsData = {
  max_judges: 12, // Default value (hard cap is 24)
  max_cats: 450, // Default value (hard cap is 1000)
  placement_thresholds: {
    championship: 85,
    kitten: 75,
    premiership: 50,
    household_pet: 50,
  },
  short_hair_breeds: [
    "ABYSSINIAN", "AMERICAN SH", "AMERICAN WH", "BALINESE", "BALINESE-JAVANESE",
    "BENGAL", "BOMBAY", "BRITISH SH", "BURMESE", "BURMILLA - LH", "BURMILLA - SH",
    "CHARTREUX", "COLORPOINT SH", "CORNISH REX", "DEVON REX", "EGYPTIAN MAU",
    "EUROPEAN BURM", "HAVANA BROWN", "JAPANESE BOBTAIL - LH", "JAPANESE BOBTAIL - SH",
    "KORAT", "LAPERM - LH", "LAPERM - SH", "LYKOI", "MANX - LH", "MANX - SH",
    "OCICAT", "ORIENTAL - LH", "ORIENTAL - SH", "RUSSIAN BLUE", "SCOTTISH FOLD - LH",
    "SCOTTISH FOLD - SH", "SCOTTISH STRAIGHT EAR - LH", "SCOTTISH STRAIGHT EAR - SH",
    "SELKIRK REX - LH", "SELKIRK REX - SH", "SIAMESE", "SINGAPURA", "SOMALI",
    "SPHYNX", "TONKINESE", "TOYBOB"
  ],
  long_hair_breeds: [
    "AMERICAN BOBTAIL-LH", "AMERICAN BOBTAIL-SH", "AMERICAN CURL-LH", "AMERICAN CURL-SH",
    "BIRMAN", "EXOTIC SOLID", "EXOTIC SILVER/GOLDEN", "EXOTIC SHADED/SMOKE",
    "EXOTIC TABBY", "EXOTIC PARTI-COLOR", "EXOTIC CALICO/BI-COLOR", "EXOTIC POINTED",
    "MAINE COON CAT", "NORWEGIAN FOREST CAT", "PERSIAN SOLID", "PERSIAN SILVER/GOLDEN",
    "PERSIAN SHADED/SMOKE", "PERSIAN TABBY", "PERSIAN PARTI-COLOR", "PERSIAN CALICO/BI-COLOR",
    "PERSIAN HIMALAYAN", "RAGAMUFFIN", "RAGDOLL", "SIBERIAN", "TURKISH ANGORA", "TURKISH VAN"
  ],
  numberOfSaves: 3,
  saveCycle: 5
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
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
    numberOfSaves: number;
    saveCycle: number;
  };
  setGlobalSettings: React.Dispatch<React.SetStateAction<{
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
    numberOfSaves: number;
    saveCycle: number;
  }>>;
  currentNumberOfJudges: number;

}

type SettingsSection = 'general' | 'placement' | 'breed' | 'auto-save';

export default function SettingsPanel({ isOpen, onClose, showSuccess, globalSettings, setGlobalSettings, currentNumberOfJudges }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('auto-save');
  const [breedTab, setBreedTab] = useState<'SHORT HAIR' | 'LONG HAIR'>('SHORT HAIR');
  const modalRef = useRef<HTMLDivElement>(null);
  const [showMaxJudgesErrorModal, setShowMaxJudgesErrorModal] = useState(false);
  
  const [localMaxJudges, setLocalMaxJudges] = useState(globalSettings.max_judges.toString());
  const [localMaxCats, setLocalMaxCats] = useState(globalSettings.max_cats.toString());
  const [localChampionship, setLocalChampionship] = useState(globalSettings.placement_thresholds.championship.toString());
  const [localKitten, setLocalKitten] = useState(globalSettings.placement_thresholds.kitten.toString());
  const [localPremiership, setLocalPremiership] = useState(globalSettings.placement_thresholds.premiership.toString());
  const [localHouseholdPet, setLocalHouseholdPet] = useState(globalSettings.placement_thresholds.household_pet.toString());
  
  // Add state for auto-save settings
  const [localNumberOfSaves, setLocalNumberOfSaves] = useState("3");
  const [localSaveCycle, setLocalSaveCycle] = useState("5");
  
  // Reset local state if globalSettings changes externally
  useEffect(() => {
    setLocalMaxJudges(globalSettings.max_judges.toString());
    setLocalMaxCats(globalSettings.max_cats.toString());
    setLocalChampionship(globalSettings.placement_thresholds.championship.toString());
    setLocalKitten(globalSettings.placement_thresholds.kitten.toString());
    setLocalPremiership(globalSettings.placement_thresholds.premiership.toString());
    setLocalHouseholdPet(globalSettings.placement_thresholds.household_pet.toString());
    setLocalNumberOfSaves(globalSettings.numberOfSaves?.toString() || "3");
    setLocalSaveCycle(globalSettings.saveCycle?.toString() || "5");
  }, [globalSettings]);


  

  
  // Keyboard accessibility: ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle numeric input validation (3-digit, 0-999, allows empty for editing)
  const handleNumericInput = (value: string, min: number = 0, max: number = 999): number => {
    const num = parseInt(value) || 0;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  // Handle key down events for max_judges input (Case 2: Down arrow validation)
  const handleMaxJudgesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Check for down arrow key when trying to decrease max_judges
    if (e.key === 'ArrowDown') {
      const currentValue = parseInt(e.currentTarget.value) || 0;
      const newValue = currentValue - 1;
      
      // Validate if the new value would be lower than current number of judges
      if (newValue < currentNumberOfJudges && newValue > 0) {
        e.preventDefault(); // Prevent the default down arrow behavior
        setShowMaxJudgesErrorModal(true);
        return;
      }
    }
  };

  // Handle blur events for max_judges input (Case 1: Focus outside validation)
  const handleMaxJudgesBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // If field is empty, set to default value of 1
    if (inputValue === '') {
      setGlobalSettings(prev => ({
        ...prev,
        max_judges: 1
      }));
      return;
    }
    
    const currentValue = parseInt(inputValue) || 0;
    
    // Apply hard cap of 24
    const cappedValue = Math.min(currentValue, 24);
    
    // Validate if the current value is lower than current number of judges
    if (cappedValue < currentNumberOfJudges && cappedValue > 0) {
      setShowMaxJudgesErrorModal(true);
      // Reset to the previous valid value
      setGlobalSettings(prev => ({
        ...prev,
        max_judges: Math.max(prev.max_judges, currentNumberOfJudges)
      }));
    } else {
      // Apply the capped value
      setGlobalSettings(prev => ({
        ...prev,
        max_judges: cappedValue
      }));
    }
  };

  // Note: Removed onInput handler to prevent validation during typing
  // Validation now only occurs on blur, save, and down arrow key

  // Update general settings with hard cap enforcement
  const updateGeneralSetting = (field: 'max_judges' | 'max_cats', value: string) => {
    // Apply hard caps: max_judges = 24, max_cats = 1000
    const hardCaps = {
      max_judges: 24,
      max_cats: 1000
    };
    
    const numValue = parseInt(value) || 0;
    const cappedValue = Math.min(numValue, hardCaps[field]);
    
    setGlobalSettings(prev => ({
      ...prev,
      [field]: cappedValue
    }));
  };

  // Update placement threshold settings
  const updatePlacementThreshold = (field: keyof SettingsData['placement_thresholds'], value: string) => {
    const numValue = handleNumericInput(value);
    
    setGlobalSettings(prev => ({
      ...prev,
      placement_thresholds: {
        ...prev.placement_thresholds,
        [field]: numValue
      }
    }));
  };

  // Update auto-save settings with validation and capping
  const updateAutoSaveSetting = async (field: 'numberOfSaves' | 'saveCycle', value: string) => {
    const numValue = parseInt(value) || 0;
    const minValue = field === 'numberOfSaves' ? 1 : 1;
    const maxValue = field === 'numberOfSaves' ? 10 : 60;
    const cappedValue = Math.max(minValue, Math.min(numValue, maxValue));
    
    // If numberOfSaves is being reduced, cleanup excess files
    if (field === 'numberOfSaves') {
      const currentNumberOfSaves = globalSettings.numberOfSaves || 3;
      if (cappedValue < currentNumberOfSaves) {
        try {
          const autoSaveService = new AutoSaveService();
          await autoSaveService.cleanupExcessAutoSaveFiles(cappedValue);
          console.log(`Cleaned up auto-save files: reduced from ${currentNumberOfSaves} to ${cappedValue}`);
        } catch (error) {
          console.error('Failed to cleanup excess auto-save files:', error);
        }
      }
    }
    
    setGlobalSettings(prev => ({
      ...prev,
      [field]: cappedValue
    }));
  };

  // Show new breed input
  const showAddBreedInput = () => {
    setShowNewBreedInput(true);
    setNewBreedValue('');
    setTimeout(() => {
      const input = document.querySelector('#new-breed-input') as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }, 10);
  };

  // Add breed with cool animation
  const addBreed = () => {
    if (!newBreedValue.trim()) return;
    
    const trimmedBreed = newBreedValue.trim().toUpperCase();
      const targetList = breedTab === 'SHORT HAIR' ? 'short_hair_breeds' : 'long_hair_breeds';
      
      // Check if breed already exists
      if (globalSettings[targetList].includes(trimmedBreed)) {
      showSuccess('Breed Exists', `${trimmedBreed} already exists in the ${breedTab.toLowerCase()} breeds list.`);
        return;
      }

      setGlobalSettings(prev => ({
        ...prev,
        [targetList]: [...prev[targetList], trimmedBreed].sort()
      }));
    
    setShowNewBreedInput(false);
    setNewBreedValue('');
    showSuccess('Breed Added', `${trimmedBreed} has been added to the ${breedTab.toLowerCase()} breeds list.`);
  };

  // Cancel new breed input
  const cancelAddBreed = () => {
    setShowNewBreedInput(false);
    setNewBreedValue('');
  };

  // Handle new breed input keydown
  const handleNewBreedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addBreed();
    } else if (e.key === 'Escape') {
      cancelAddBreed();
    }
  };

  // Inline editing state
  const [editingBreed, setEditingBreed] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // New breed input state
  const [showNewBreedInput, setShowNewBreedInput] = useState(false);
  const [newBreedValue, setNewBreedValue] = useState('');
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [breedToDelete, setBreedToDelete] = useState<string>('');
  
  // Restore defaults modal state
  const [showRestoreDefaultsModal, setShowRestoreDefaultsModal] = useState(false);
  


  // Edit input ref for auto-focus
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Start inline editing with auto-highlight
  const startEditBreed = (breed: string) => {
    setEditingBreed(breed);
    setEditValue(breed);
    // Auto-highlight the text after a brief delay to ensure input is focused
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 10);
  };

  // Save inline edit
  const saveEditBreed = () => {
    if (!editingBreed || !editValue.trim()) return;
    
    const trimmedBreed = editValue.trim().toUpperCase();
      const targetList = breedTab === 'SHORT HAIR' ? 'short_hair_breeds' : 'long_hair_breeds';
      
      // Check if new breed name already exists (excluding the current one)
    if (globalSettings[targetList].includes(trimmedBreed) && trimmedBreed !== editingBreed) {
      showSuccess('Breed Exists', `${trimmedBreed} already exists in the ${breedTab.toLowerCase()} breeds list.`);
        return;
      }

      setGlobalSettings(prev => ({
        ...prev,
        [targetList]: prev[targetList].map(breed => 
        breed === editingBreed ? trimmedBreed : breed
        ).sort()
      }));
    showSuccess('Breed Updated', `${editingBreed} has been updated to ${trimmedBreed}.`);
    setEditingBreed(null);
    setEditValue('');
  };

  // Cancel inline edit
  const cancelEditBreed = () => {
    setEditingBreed(null);
    setEditValue('');
  };

  // Handle edit input keydown
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditBreed();
    } else if (e.key === 'Escape') {
      cancelEditBreed();
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (breed: string) => {
    setBreedToDelete(breed);
    setShowDeleteModal(true);
  };

  // Delete breed from the appropriate list with toast notification
    const deleteBreed = () => {
    if (!breedToDelete) return;
    
    const targetList = breedTab === 'SHORT HAIR' ? 'short_hair_breeds' : 'long_hair_breeds';
    
    setGlobalSettings(prev => ({
      ...prev,
      [targetList]: prev[targetList].filter(breed => breed !== breedToDelete)
    }));
    
    setShowDeleteModal(false);
    setBreedToDelete('');
    showSuccess('Breed Deleted', `${breedToDelete} has been removed from the ${breedTab.toLowerCase()} breeds list.`);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setBreedToDelete('');
  };
  
  // Championship threshold change modal handlers


  // Save settings
  const handleSaveSettings = () => {
    console.log('Save Settings clicked');
    
    // Validate max_judges before saving
    if (!validateMaxJudgesBeforeSave()) {
      return; // Don't save if validation fails
    }
    
    // Save to localStorage (this is already handled by the App component's useEffect)
    showSuccess('Settings Saved', 'All settings have been saved successfully.');
    onClose();
  };

  // Validate max_judges setting before saving (Case 3: Save settings validation)
  const validateMaxJudgesBeforeSave = (): boolean => {
    if (globalSettings.max_judges < currentNumberOfJudges && globalSettings.max_judges > 0) {
      setShowMaxJudgesErrorModal(true);
      return false;
    }
    return true;
  };

  // Handle restore defaults confirmation
  const handleRestoreDefaults = () => {
    // Clear localStorage and reset to default values
    try {
      localStorage.removeItem('cfa_global_settings');
    } catch (error) {
      console.error('Error clearing settings from localStorage:', error);
    }
    
    setGlobalSettings(DEFAULT_SETTINGS);
    setShowRestoreDefaultsModal(false);
    showSuccess('Defaults Restored', 'All settings have been restored to default values.');
  };



  // NOTE: Maximum Number of Rings field was removed as it was not needed for the application
  // The settings panel now only includes: max_judges, max_cats, placement_thresholds, and breed lists
  
  // Error handling: Prevents users from setting max_judges lower than current number of judges
  // Validation occurs ONLY in these three cases:
  // Case 1: User finishes input and moves focus outside the input box (onBlur)
  // Case 2: User clicks the built-in spinner down arrow (onKeyDown ArrowDown)
  // Case 3: User clicks save settings button (validateMaxJudgesBeforeSave)
  // All editing actions (clearing, typing, etc.) are allowed without validation during editing
  // Empty field automatically becomes 1 when user leaves the field
  // Shows error modal with guidance to reduce judge count in General Information tab first

  // Render General Settings section with modern, fashionable design
  const renderGeneralSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">General Settings</h3>
        <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Maximum Number of Judges - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-amber-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-amber-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-base font-semibold text-gray-700 mb-6 flex items-center justify-center">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-lg">Maximum Number of Judges</span>
            </label>
            
            <div className="flex justify-center">
              {/* Use width='md' to match placement threshold input width */}
              <SettingsInput
                type="number"
                min={1}
                max={24}
                value={globalSettings.max_judges}
                onChange={(e) => updateGeneralSetting('max_judges', e.target.value)}
                onKeyDown={handleMaxJudgesKeyDown}
                onBlur={handleMaxJudgesBlur}
                placeholder="12"
                width="md" // Ensures uniform width with placement threshold
                glowColor="amber"
              />
            </div>
          </div>
        </div>
        
        {/* Maximum Number of Cats - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-teal-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-teal-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-base font-semibold text-gray-700 mb-6 flex items-center justify-center">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-lg">Maximum Number of Cats</span>
            </label>
            
            <div className="flex justify-center">
              {/* Use width='md' to match placement threshold input width */}
              <SettingsInput
                type="number"
                min={1}
                max={1000}
                value={localMaxCats}
                onChange={(e) => setLocalMaxCats(e.target.value)}
                onBlur={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setGlobalSettings(prev => ({ ...prev, max_cats: 450 }));
                    setLocalMaxCats('450');
                    return;
                  }
                  const currentValue = parseInt(inputValue) || 0;
                  const cappedValue = Math.min(currentValue, 1000);
                  setGlobalSettings(prev => ({ ...prev, max_cats: cappedValue }));
                  setLocalMaxCats(cappedValue.toString());
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur(); // Trigger onBlur when Enter is pressed
                  }
                }}
                placeholder="450"
                width="md" // Ensures uniform width with placement threshold
                glowColor="teal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Placement Threshold section with modern, fashionable design
  const renderPlacementSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">Placement Threshold Settings</h3>
        <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full mx-auto"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Championship Threshold - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-purple-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-lg font-semibold text-gray-700 mb-6 flex items-center justify-start px-2 ml-16">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span className="text-lg">Championship</span>
            </label>
            
            <div className="flex justify-center">
              <SettingsInput
                type="number"
                min={1}
                max={999}
                value={localChampionship}
                onChange={(e) => setLocalChampionship(e.target.value)}
                placeholder="85"
                width="md"
              />
            </div>
          </div>
        </div>
        
        {/* Kitten Threshold - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-pink-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-pink-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-lg font-semibold text-gray-700 mb-6 flex items-center justify-start px-2 ml-16">
              <div className="p-3 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-lg">Kitten</span>
            </label>
            
            <div className="flex justify-center">
              <SettingsInput
                type="number"
                min={1}
                max={999}
                value={localKitten}
                onChange={(e) => setLocalKitten(e.target.value)}
                placeholder="75"
                width="md"
              />
            </div>
          </div>
        </div>
        
        {/* Premiership Threshold - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-emerald-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-lg font-semibold text-gray-700 mb-6 flex items-center justify-start px-2 ml-16">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-lg">Premiership</span>
            </label>
            
            <div className="flex justify-center">
              <SettingsInput
                type="number"
                min={1}
                max={999}
                value={localPremiership}
                onChange={(e) => setLocalPremiership(e.target.value)}
                placeholder="50"
                width="md"
              />
            </div>
          </div>
        </div>
        
        {/* Household Pet Threshold - Modern Glassmorphism Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-6 shadow-xl hover:shadow-2xl hover:shadow-orange-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-orange-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            
            <label className="block text-lg font-semibold text-gray-700 mb-6 flex items-center justify-start px-2 ml-16">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl mr-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              <span className="text-lg">Household Pet</span>
            </label>
            
            <div className="flex justify-center">
              <SettingsInput
                type="number"
                min={1}
                max={999}
                value={localHouseholdPet}
                onChange={(e) => setLocalHouseholdPet(e.target.value)}
                placeholder="50"
                width="md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Breed List section with table format and inline editing
  const renderBreedSection = () => {
    const currentBreeds = breedTab === 'SHORT HAIR' ? globalSettings.short_hair_breeds : globalSettings.long_hair_breeds;
    const totalBreeds = currentBreeds.length;
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">Breed List Settings</h3>
          <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full mx-auto"></div>
        </div>
        {/* Ultra-Modern Breed Type Tabs */}
        <div className="relative bg-gray-100 rounded-2xl p-1.5 shadow-inner">
          <div className="flex relative">
            {/* Animated background slider */}
            <div 
              className={`absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-md transition-all duration-500 ease-out ${
                breedTab === 'SHORT HAIR' ? 'left-1.5 w-[calc(50%-0.375rem)]' : 'left-[calc(50%+0.375rem)] w-[calc(50%-0.375rem)]'
              }`}
            ></div>
            
          <button
            type="button"
            onClick={() => setBreedTab('SHORT HAIR')}
              className={`relative z-10 flex-1 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-500 ${
              breedTab === 'SHORT HAIR'
                  ? 'text-gray-800'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {/* Cat - Pointed ears, whiskers, typical cat features */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {/* Cat head */}
                  <circle cx="12" cy="12" r="5"/>
                  {/* Pointed ears */}
                  <path d="M8 8l2-3 2 2z"/>
                  <path d="M16 8l-2-3-2 2z"/>
                  {/* Eyes */}
                  <circle cx="10" cy="11" r="0.8"/>
                  <circle cx="14" cy="11" r="0.8"/>
                  {/* Nose */}
                  <path d="M12 13l-0.3 0.5h0.6z"/>
                  {/* Whiskers */}
                  <line x1="6" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="6" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="18" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="18" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="0.5"/>
                </svg>
                <span>SHORT HAIR</span>
              </div>
          </button>
            
          <button
            type="button"
            onClick={() => setBreedTab('LONG HAIR')}
              className={`relative z-10 flex-1 px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-500 ${
              breedTab === 'LONG HAIR'
                  ? 'text-gray-800'
                  : 'text-gray-600 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {/* Rabbit - Long ears, round face, typical rabbit features */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  {/* Rabbit head */}
                  <circle cx="12" cy="13" r="4"/>
                  {/* Long ears */}
                  <ellipse cx="10" cy="6" rx="1" ry="4"/>
                  <ellipse cx="14" cy="6" rx="1" ry="4"/>
                  {/* Eyes */}
                  <circle cx="10" cy="12" r="0.6"/>
                  <circle cx="14" cy="12" r="0.6"/>
                  {/* Nose */}
                  <circle cx="12" cy="14" r="0.3"/>
                  {/* Whiskers */}
                  <line x1="8" y1="13" x2="6" y2="13" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="8" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="16" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="0.5"/>
                  <line x1="16" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="0.5"/>
                </svg>
                <span>LONG HAIR</span>
              </div>
          </button>
          </div>
        </div>

        {/* Breed Count and Add Button */}
        <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {totalBreeds} {breedTab.toLowerCase()} breeds
        </div>

          {/* Cool Inline Add Breed Input */}
          {showNewBreedInput ? (
            <div className="flex items-center space-x-2 bg-white border-2 border-amber-300 rounded-xl shadow-lg px-4 py-2 animate-in slide-in-from-right-2 duration-300">
              <SettingsInput
                id="new-breed-input"
                type="text"
                value={newBreedValue}
                onChange={(e) => setNewBreedValue(e.target.value)}
                onKeyDown={handleNewBreedKeyDown}
                placeholder={`Enter ${breedTab.toLowerCase()} breed name...`}
                width="min-w-[200px]"
                className="text-sm font-mono bg-transparent border-none outline-none focus:ring-0"
                autoFocus
              />
                  <button
                onClick={addBreed}
                className="p-1.5 text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-lg hover:bg-green-100 hover:shadow-sm"
                title="Add Breed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                onClick={cancelAddBreed}
                className="p-1.5 text-red-600 hover:text-red-800 transition-colors bg-red-50 rounded-lg hover:bg-red-100 hover:shadow-sm"
                title="Cancel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
          ) : (
            <button
              type="button"
              onClick={showAddBreedInput}
              className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Add new breed"
            >
              {/* Animated background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
              
              {/* Icon with animation */}
              <div className="relative flex items-center justify-center w-5 h-5 mr-2 bg-white/20 rounded-full group-hover:bg-white/30 transition-all duration-300">
                <svg className="w-3 h-3 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <span className="relative font-medium text-sm">Add Breed</span>
              
              {/* Sparkle effect */}
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-ping"></div>
            </button>
          )}
        </div>

        {/* Zingy Two-Column Breed Grid with Compact Design */}
        <div className="grid grid-cols-2 gap-4">
          {currentBreeds.map((breed, index) => (
            <div 
              key={index} 
              className={`group p-3 rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-200/30 transition-all duration-300 transform hover:scale-[1.02] ${
                index % 2 === 0 
                  ? 'bg-gradient-to-r from-white to-gray-50/30' 
                  : 'bg-gradient-to-r from-gray-50/50 to-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingBreed === breed ? (
                    <div className="flex items-center space-x-2">
                      <SettingsInput
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={saveEditBreed}
                        width="w-full"
                        className="text-sm font-mono"
                        autoFocus
                      />
                      <button
                        onClick={saveEditBreed}
                        className="p-1.5 text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-lg hover:bg-green-100 hover:shadow-sm"
                        title="Save"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={cancelEditBreed}
                        className="p-1.5 text-red-600 hover:text-red-800 transition-colors bg-red-50 rounded-lg hover:bg-red-100 hover:shadow-sm"
                        title="Cancel"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-mono text-gray-800 group-hover:text-gray-900 transition-colors truncate block">{breed}</span>
                  )}
          </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2">
                  <button
                    type="button"
                    onClick={() => startEditBreed(breed)}
                    className="p-1.5 text-gray-500 hover:text-amber-600 transition-all duration-200 rounded-lg hover:bg-amber-100/50 hover:shadow-sm"
                    title={`Edit ${breed}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => showDeleteConfirmation(breed)}
                    className="p-1.5 text-gray-500 hover:text-red-500 transition-all duration-200 rounded-lg hover:bg-red-100/50 hover:shadow-sm"
                    title={`Delete ${breed}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  // Render Auto-Save Settings section with modern, fashionable design
  const renderAutoSaveSection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">Auto-Save Settings</h3>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto"></div>
      </div>
      
      <div className="space-y-8">
        {/* Save Location - Full Row Design */}
        <div className="group relative">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
          
          <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-emerald-300/80">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            

          </div>
        </div>
        
        {/* Number of Saves and Save Cycle - Row Below */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Number of Saves - Modern Glassmorphism Design */}
          <div className="group relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
            
            <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-cyan-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-cyan-300/80">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              
              <label className="block text-base font-semibold text-gray-700 mb-6 flex items-center justify-center">
                <div className="p-3 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl mr-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <span className="text-lg">Number of Saves</span>
              </label>
              
              <div className="flex justify-center">
                {/* Number of auto-save files to maintain in rotation (1-10) */}
                <SettingsInput
                  type="number"
                  min={1}
                  max={10}
                  value={localNumberOfSaves}
                  onChange={(e) => setLocalNumberOfSaves(e.target.value)}
                  onBlur={async (e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setLocalNumberOfSaves('3');
                      await updateAutoSaveSetting('numberOfSaves', '3');
                      return;
                    }
                    const currentValue = parseInt(inputValue) || 0;
                    const cappedValue = Math.max(1, Math.min(currentValue, 10));
                    setLocalNumberOfSaves(cappedValue.toString());
                    await updateAutoSaveSetting('numberOfSaves', cappedValue.toString());
                  }}
                  placeholder="3"
                  width="md"
                  glowColor="cyan"
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Number of auto-save files to maintain in rotation</p>
              </div>
            </div>
          </div>
          
          {/* Save Cycle - Modern Glassmorphism Design */}
          <div className="group relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 blur-2xl"></div>
            
            <div className="relative bg-white/90 backdrop-blur-sm border border-gray-200/60 rounded-3xl p-8 shadow-xl hover:shadow-2xl hover:shadow-indigo-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-indigo-300/80">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
              
              <label className="block text-base font-semibold text-gray-700 mb-6 flex items-center justify-center">
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mr-4 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-lg">Save Cycle</span>
              </label>
              
              <div className="flex justify-center">
                {/* Auto-save frequency in minutes (1-60) */}
                <SettingsInput
                  type="number"
                  min={1}
                  max={60}
                  value={localSaveCycle}
                  onChange={(e) => setLocalSaveCycle(e.target.value)}
                  onBlur={async (e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setLocalSaveCycle('5');
                      await updateAutoSaveSetting('saveCycle', '5');
                      return;
                    }
                    const currentValue = parseInt(inputValue) || 0;
                    const cappedValue = Math.max(1, Math.min(currentValue, 60));
                    setLocalSaveCycle(cappedValue.toString());
                    await updateAutoSaveSetting('saveCycle', cappedValue.toString());
                  }}
                  placeholder="5"
                  width="md"
                  glowColor="indigo"
                />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">Save once every X minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" ref={modalRef}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col relative">
        {/* Stylish Header with Gear Icon and Gold Accent - Sticky */}
        <div className="flex items-center justify-between p-6 border-b-2 border-cfa-gold bg-gradient-to-r from-gray-50 to-white sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-cfa-gold rounded-lg shadow-lg">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            title="Close Settings"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Ultra-Modern CFA Sidebar with Creative Effects */}
          <div className="w-64 bg-gradient-to-br from-slate-50 via-gray-50 to-white border-r border-gray-200/60 p-6 shadow-inner relative overflow-hidden">
            {/* Subtle CFA Pattern Background */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-4 right-4 w-16 h-16 border-2 border-cfa-gold/20 rounded-full"></div>
              <div className="absolute bottom-8 left-4 w-8 h-8 border border-cfa-gold/15 rounded-full"></div>
              <div className="absolute top-1/2 right-8 w-4 h-4 bg-cfa-gold/10 rounded-full"></div>
            </div>
            
            <nav className="space-y-4 relative z-10">
              <button
                onClick={() => setActiveSection('auto-save')}
                className={`group relative w-full text-left px-6 py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
                  activeSection === 'auto-save'
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 text-gray-800 shadow-2xl shadow-amber-200/40 scale-105'
                    : 'text-gray-700 hover:text-gray-900 bg-white/60 hover:bg-white/90 backdrop-blur-sm border border-transparent hover:border-amber-200/30 hover:shadow-xl hover:shadow-amber-200/20'
                }`}
              >
                {/* Animated Background Glow */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  activeSection === 'auto-save'
                    ? 'bg-gradient-to-r from-amber-200/30 to-yellow-200/30 animate-pulse'
                    : 'group-hover:bg-gradient-to-r group-hover:from-amber-200/10 group-hover:to-yellow-200/10'
                }`}></div>
                
                <div className="relative flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    activeSection === 'auto-save'
                      ? 'bg-gray-800/10 text-gray-800 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-amber-200/30 group-hover:text-amber-700 group-hover:shadow-md'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <span className="font-medium">Auto-Save</span>
                  {activeSection === 'auto-save' && (
                    <div className="absolute right-2 w-2 h-2 bg-black rounded-full animate-ping"></div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveSection('breed')}
                className={`group relative w-full text-left px-6 py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
                  activeSection === 'breed'
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 text-gray-800 shadow-2xl shadow-amber-200/40 scale-105'
                    : 'text-gray-700 hover:text-gray-900 bg-white/60 hover:bg-white/90 backdrop-blur-sm border border-transparent hover:border-amber-200/30 hover:shadow-xl hover:shadow-amber-200/20'
                }`}
              >
                {/* Animated Background Glow */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  activeSection === 'breed'
                    ? 'bg-gradient-to-r from-amber-200/30 to-yellow-200/30 animate-pulse'
                    : 'group-hover:bg-gradient-to-r group-hover:from-amber-200/10 group-hover:to-yellow-200/10'
                }`}></div>
                
                <div className="relative flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    activeSection === 'breed'
                      ? 'bg-gray-800/10 text-gray-800 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-amber-200/30 group-hover:text-amber-700 group-hover:shadow-md'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                  <span className="font-medium">Breed List</span>
                  {activeSection === 'breed' && (
                    <div className="absolute right-2 w-2 h-2 bg-black rounded-full animate-ping"></div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveSection('general')}
                className={`group relative w-full text-left px-6 py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
                  activeSection === 'general'
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 text-gray-800 shadow-2xl shadow-amber-200/40 scale-105'
                    : 'text-gray-700 hover:text-gray-900 bg-white/60 hover:bg-white/90 backdrop-blur-sm border border-transparent hover:border-amber-200/30 hover:shadow-xl hover:shadow-amber-200/20'
                }`}
              >
                {/* Animated Background Glow */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  activeSection === 'general'
                    ? 'bg-gradient-to-r from-amber-200/30 to-yellow-200/30 animate-pulse'
                    : 'group-hover:bg-gradient-to-r group-hover:from-amber-200/10 group-hover:to-yellow-200/10'
                }`}></div>
                
                <div className="relative flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    activeSection === 'general'
                      ? 'bg-gray-800/10 text-gray-800 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-amber-200/30 group-hover:text-amber-700 group-hover:shadow-md'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-medium">General</span>
                  {activeSection === 'general' && (
                    <div className="absolute right-2 w-2 h-2 bg-black rounded-full animate-ping"></div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveSection('placement')}
                className={`group relative w-full text-left px-6 py-4 rounded-2xl font-semibold transition-all duration-500 transform hover:scale-105 ${
                  activeSection === 'placement'
                    ? 'bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-200 text-gray-800 shadow-2xl shadow-amber-200/40 scale-105'
                    : 'text-gray-700 hover:text-gray-900 bg-white/60 hover:bg-white/90 backdrop-blur-sm border border-transparent hover:border-amber-200/30 hover:shadow-xl hover:shadow-amber-200/20'
                }`}
              >
                {/* Animated Background Glow */}
                <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
                  activeSection === 'placement'
                    ? 'bg-gradient-to-r from-amber-200/30 to-yellow-200/30 animate-pulse'
                    : 'group-hover:bg-gradient-to-r group-hover:from-amber-200/10 group-hover:to-yellow-200/10'
                }`}></div>
                
                <div className="relative flex items-center space-x-4">
                  <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                    activeSection === 'placement'
                      ? 'bg-gray-800/10 text-gray-800 shadow-lg'
                      : 'bg-gray-100 group-hover:bg-amber-200/30 group-hover:text-amber-700 group-hover:shadow-md'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="font-medium">Placement Threshold</span>
                  {activeSection === 'placement' && (
                    <div className="absolute right-2 w-2 h-2 bg-black rounded-full animate-ping"></div>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'general' && renderGeneralSection()}
            {activeSection === 'placement' && renderPlacementSection()}
            {activeSection === 'breed' && renderBreedSection()}
            {activeSection === 'auto-save' && renderAutoSaveSection()}
          </div>
        </div>

        {/* Footer with Action Buttons - Sticky */}
        <div className="border-t-2 border-cfa-gold bg-gradient-to-r from-white to-gray-50 p-6 sticky bottom-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRestoreDefaultsModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                title="Restore all settings to default values"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Restore Defaults
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(globalSettings, null, 2);
                  const dataBlob = new Blob([dataStr], {type: 'application/json'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'cfa-settings.json';
                  link.click();
                  URL.revokeObjectURL(url);
                  showSuccess('Settings Exported', 'Settings have been exported to cfa-settings.json');
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                title="Export settings to JSON file"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export JSON
              </button>
            </div>
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Save all current settings"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delete Breed</h3>
                <p className="text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-800 font-medium">
                Are you sure you want to delete <span className="text-red-600 font-bold">"{breedToDelete}"</span> from the {breedTab.toLowerCase()} breeds list?
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteBreed}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                Delete Breed
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Maximum Judges Error Modal */}
      <Modal
        isOpen={showMaxJudgesErrorModal}
        onClose={() => setShowMaxJudgesErrorModal(false)}
        title="Invalid Maximum Judges Setting"
        message={`You cannot set the maximum number of judges to ${globalSettings.max_judges} because you currently have ${currentNumberOfJudges} judges assigned. Please reduce the number of judges in the General Information tab first, then try setting the maximum again.`}
        type="alert"
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShowMaxJudgesErrorModal(false)}
      />
      
      {/* Restore Defaults Confirmation Modal */}
      <Modal
        isOpen={showRestoreDefaultsModal}
        onClose={() => setShowRestoreDefaultsModal(false)}
        title="Restore Default Settings"
        message="Are you sure you want to restore all settings to default values? This action cannot be undone and will reset all current settings including maximum judges, rings, cats, placement thresholds, and breed lists."
        type="warning"
        confirmText="Restore Defaults"
        cancelText="Cancel"
        onConfirm={handleRestoreDefaults}
        onCancel={() => setShowRestoreDefaultsModal(false)}
      />
      

    </div>
  );
} 