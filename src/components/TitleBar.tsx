import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minimize, Maximize2, X } from 'lucide-react';
import { isTauriEnvironment } from '../utils/platformDetection';

export const TitleBar: React.FC = () => {
  // Only render in Tauri environment
  if (!isTauriEnvironment()) {
    return null;
  }

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      console.log('🔍 Attempting to minimize window...');
      await appWindow.minimize();
      console.log('✅ Window minimized successfully');
    } catch (error) {
      console.error('❌ Failed to minimize:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      console.log('🔍 Attempting to toggle maximize window...');
      await appWindow.toggleMaximize();
      console.log('✅ Window maximize toggled successfully');
    } catch (error) {
      console.error('❌ Failed to maximize:', error);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      console.log('🔍 Attempting to close window...');
      await appWindow.close();
      console.log('✅ Window closed successfully');
    } catch (error) {
      console.error('❌ Failed to close:', error);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-end w-full h-12 px-6 z-[9999] select-none fixed top-0 left-0 right-0"
      style={{ 
        WebkitUserSelect: 'none',
        userSelect: 'none',
        background: 'linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(26,26,26,0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '2px solid #C7B273',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2), 0 2px 8px rgba(199,178,115,0.1)'
      }}
    >
      {/* Elegant Window Controls */}
      <div className="flex items-center gap-3">
        {/* Minimize Button */}
        <button
          title="Minimize"
          aria-label="Minimize window"
          className="group relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ease-out"
          style={{ 
            WebkitAppRegion: 'no-drag',
            background: 'linear-gradient(135deg, rgba(199,178,115,0.15) 0%, rgba(199,178,115,0.08) 100%)',
            border: '1px solid rgba(199,178,115,0.2)',
            backdropFilter: 'blur(8px)'
          } as React.CSSProperties}
          onClick={handleMinimize}
          tabIndex={-1}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C7B273]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Minimize 
            size={14} 
            className="text-[#C7B273] group-hover:text-white transition-colors duration-300 relative z-10" 
          />
          <div className="absolute inset-0 rounded-xl ring-1 ring-[#C7B273]/0 group-hover:ring-[#C7B273]/40 transition-all duration-300" />
        </button>
        
        {/* Maximize Button */}
        <button
          title="Maximize"
          aria-label="Maximize window"
          className="group relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ease-out"
          style={{ 
            WebkitAppRegion: 'no-drag',
            background: 'linear-gradient(135deg, rgba(199,178,115,0.15) 0%, rgba(199,178,115,0.08) 100%)',
            border: '1px solid rgba(199,178,115,0.2)',
            backdropFilter: 'blur(8px)'
          } as React.CSSProperties}
          onClick={handleMaximize}
          tabIndex={-1}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C7B273]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Maximize2 
            size={14} 
            className="text-[#C7B273] group-hover:text-white transition-colors duration-300 relative z-10" 
          />
          <div className="absolute inset-0 rounded-xl ring-1 ring-[#C7B273]/0 group-hover:ring-[#C7B273]/40 transition-all duration-300" />
        </button>
        
        {/* Close Button */}
        <button
          title="Close"
          aria-label="Close window"
          className="group relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 ease-out"
          style={{ 
            WebkitAppRegion: 'no-drag',
            background: 'linear-gradient(135deg, rgba(199,178,115,0.15) 0%, rgba(199,178,115,0.08) 100%)',
            border: '1px solid rgba(199,178,115,0.2)',
            backdropFilter: 'blur(8px)'
          } as React.CSSProperties}
          onClick={handleClose}
          tabIndex={-1}
        >
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <X 
            size={14} 
            className="text-[#C7B273] group-hover:text-red-400 transition-colors duration-300 relative z-10" 
          />
          <div className="absolute inset-0 rounded-xl ring-1 ring-red-500/0 group-hover:ring-red-500/40 transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}; 