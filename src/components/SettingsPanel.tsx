import React, { useState } from 'react';
import cfaLogo from '../assets/cfa-logo-official.png';
import { useEffect, useRef } from 'react';

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
}

// Default values as specified
const DEFAULT_SETTINGS: SettingsData = {
  max_judges: 12,
  max_cats: 450,
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
  ]
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
}

type SettingsSection = 'general' | 'placement' | 'breed';

export default function SettingsPanel({ isOpen, onClose, showSuccess }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [breedTab, setBreedTab] = useState<'SHORT HAIR' | 'LONG HAIR'>('SHORT HAIR');
  const modalRef = useRef<HTMLDivElement>(null);

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

  // Handle numeric input validation (3-digit, 1-999)
  const handleNumericInput = (value: string, min: number = 1, max: number = 999): number => {
    const num = parseInt(value) || 0;
    if (num < min) return min;
    if (num > max) return max;
    return num;
  };

  // Update general settings
  const updateGeneralSetting = (field: 'max_judges' | 'max_cats', value: string) => {
    const numValue = handleNumericInput(value);
    setSettings(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Update placement threshold settings
  const updatePlacementThreshold = (field: keyof SettingsData['placement_thresholds'], value: string) => {
    const numValue = handleNumericInput(value);
    setSettings(prev => ({
      ...prev,
      placement_thresholds: {
        ...prev.placement_thresholds,
        [field]: numValue
      }
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
      if (settings[targetList].includes(trimmedBreed)) {
      showSuccess('Breed Exists', `${trimmedBreed} already exists in the ${breedTab.toLowerCase()} breeds list.`);
        return;
      }

      setSettings(prev => ({
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
    if (settings[targetList].includes(trimmedBreed) && trimmedBreed !== editingBreed) {
      showSuccess('Breed Exists', `${trimmedBreed} already exists in the ${breedTab.toLowerCase()} breeds list.`);
        return;
      }

      setSettings(prev => ({
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
      
      setSettings(prev => ({
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

  // Save settings
  const handleSaveSettings = () => {
    // In a real implementation, this would save to localStorage or a file
    console.log('Saving settings:', settings);
    showSuccess('Settings Saved', 'All settings have been saved successfully.');
    onClose();
  };

  // Render General Settings section with premium styling
  const renderGeneralSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">General Settings</h3>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Maximum Number of Judges - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-amber-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-amber-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Maximum Number of Judges
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.max_judges}
                onChange={(e) => updateGeneralSetting('max_judges', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/30 focus:outline-none transition-all duration-300 hover:border-amber-300 hover:shadow-lg"
                placeholder="12"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/20 to-yellow-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-3 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Maximum Number of Cats - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:shadow-teal-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-teal-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Maximum Number of Cats
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.max_cats}
                onChange={(e) => updateGeneralSetting('max_cats', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-teal-400 focus:ring-4 focus:ring-teal-200/30 focus:outline-none transition-all duration-300 hover:border-teal-300 hover:shadow-lg"
                placeholder="450"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400/20 to-cyan-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-3 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Placement Threshold section with premium styling
  const renderPlacementSection = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Placement Threshold Settings</h3>
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-4" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Championship Threshold - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-purple-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-purple-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Championship
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.placement_thresholds.championship}
                onChange={(e) => updatePlacementThreshold('championship', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-purple-400 focus:ring-4 focus:ring-purple-200/30 focus:outline-none transition-all duration-300 hover:border-purple-300 hover:shadow-lg"
                placeholder="85"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400/20 to-indigo-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Kitten Threshold - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-pink-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-pink-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-pink-400 to-rose-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Kitten
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.placement_thresholds.kitten}
                onChange={(e) => updatePlacementThreshold('kitten', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-pink-400 focus:ring-4 focus:ring-pink-200/30 focus:outline-none transition-all duration-300 hover:border-pink-300 hover:shadow-lg"
                placeholder="75"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-400/20 to-rose-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premiership Threshold - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-emerald-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-emerald-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-green-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Premiership
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.placement_thresholds.premiership}
                onChange={(e) => updatePlacementThreshold('premiership', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-200/30 focus:outline-none transition-all duration-300 hover:border-emerald-300 hover:shadow-lg"
                placeholder="50"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Household Pet Threshold - Premium Design */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl"></div>
          <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:shadow-orange-200/30 transition-all duration-500 transform hover:scale-[1.02] group-hover:border-orange-300">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-br from-orange-400 to-amber-500 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              Household Pet
            </label>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="999"
                value={settings.placement_thresholds.household_pet}
                onChange={(e) => updatePlacementThreshold('household_pet', e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-lg font-bold text-gray-800 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-300 rounded-xl py-3 px-4 focus:border-orange-400 focus:ring-4 focus:ring-orange-200/30 focus:outline-none transition-all duration-300 hover:border-orange-300 hover:shadow-lg"
                placeholder="50"
              />
              {/* Animated focus indicator */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400/20 to-amber-400/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
            
            <div className="mt-2 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-100 rounded-full px-3 py-1">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                <span>Range: 1-999</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Breed List section with table format and inline editing
  const renderBreedSection = () => {
    const currentBreeds = breedTab === 'SHORT HAIR' ? settings.short_hair_breeds : settings.long_hair_breeds;
    const totalBreeds = currentBreeds.length;
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Breed List</h3>
        <div className="w-full h-px bg-gray-200 opacity-70 mb-2 mt-1" />
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
              <input
                id="new-breed-input"
                type="text"
                value={newBreedValue}
                onChange={(e) => setNewBreedValue(e.target.value)}
                onKeyDown={handleNewBreedKeyDown}
                placeholder={`Enter ${breedTab.toLowerCase()} breed name...`}
                className="text-sm font-mono text-gray-800 bg-transparent border-none outline-none focus:ring-0 min-w-[200px]"
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
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={saveEditBreed}
                        className="cfa-input w-full text-sm font-mono text-gray-800"
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
            </nav>
          </div>

          {/* Main Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeSection === 'general' && renderGeneralSection()}
            {activeSection === 'placement' && renderPlacementSection()}
            {activeSection === 'breed' && renderBreedSection()}
          </div>
        </div>

        {/* Footer with Action Buttons - Sticky */}
        <div className="border-t-2 border-cfa-gold bg-gradient-to-r from-white to-gray-50 p-6 sticky bottom-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to restore all settings to default values?')) {
                    setSettings(DEFAULT_SETTINGS);
                    showSuccess('Defaults Restored', 'All settings have been restored to default values.');
                  }
                }}
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
                  const dataStr = JSON.stringify(settings, null, 2);
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
              className="cfa-button"
              title="Save all current settings"
            >
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
    </div>
  );
} 