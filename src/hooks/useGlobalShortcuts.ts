import { useEffect } from 'react';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { platform } from '@tauri-apps/plugin-os';
import { isTauriEnvironment } from '../utils/platformDetection';

/**
 * Hook for managing cross-platform global keyboard shortcuts
 * 
 * Features:
 * - Platform-specific shortcuts (Alt+F4 on Windows/Linux, Cmd+M/Cmd+Q on macOS)
 * - Automatic cleanup on component unmount
 * - Error handling with console logging
 * - Only registers shortcuts in Tauri environment
 * 
 * Integration: Used by App.tsx for system-wide keyboard shortcuts
 * Files: src/hooks/useGlobalShortcuts.ts
 */
export const useGlobalShortcuts = () => {
  useEffect(() => {
    // Only register shortcuts in Tauri environment
    if (!isTauriEnvironment()) {
      console.log('🔍 useGlobalShortcuts: Not in Tauri environment, skipping shortcut registration');
      return;
    }

    const registerShortcuts = async () => {
      try {
        // Detect the current platform
        const currentPlatform = await platform();
        console.log(`🔍 useGlobalShortcuts: Detected platform: ${currentPlatform}`);
        
        if (currentPlatform === 'macos') {
          // macOS shortcuts
          console.log('🔍 useGlobalShortcuts: Registering macOS shortcuts...');
          
          // Cmd+M for minimize
          await register('Cmd+M', async () => {
            console.log('🔍 Cmd+M pressed - minimizing window');
            try {
              const window = getCurrentWindow();
              await window.minimize();
              console.log('✅ Window minimized successfully via keyboard shortcut');
            } catch (error) {
              console.error('❌ Failed to minimize via keyboard shortcut:', error);
            }
          });
          
          // Cmd+Q for quit
          await register('Cmd+Q', async () => {
            console.log('🔍 Cmd+Q pressed - closing window');
            try {
              const window = getCurrentWindow();
              await window.close();
              console.log('✅ Window closed successfully via keyboard shortcut');
            } catch (error) {
              console.error('❌ Failed to close via keyboard shortcut:', error);
            }
          });
          
        } else {
          // Windows and Linux shortcuts
          console.log('🔍 useGlobalShortcuts: Registering Windows/Linux shortcuts...');
          
          // Alt+F4 for close
          await register('Alt+F4', async () => {
            console.log('🔍 Alt+F4 pressed - closing window');
            try {
              const window = getCurrentWindow();
              await window.close();
              console.log('✅ Window closed successfully via keyboard shortcut');
            } catch (error) {
              console.error('❌ Failed to close via keyboard shortcut:', error);
            }
          });
        }
        
        console.log(`✅ useGlobalShortcuts: Platform-specific shortcuts registered for: ${currentPlatform}`);
        
      } catch (error) {
        console.error('❌ useGlobalShortcuts: Failed to register global shortcuts:', error);
      }
    };

    // Register shortcuts when component mounts
    registerShortcuts();

    // Cleanup function to unregister shortcuts when component unmounts
    return () => {
      console.log('🔍 useGlobalShortcuts: Cleaning up global shortcuts...');
      unregisterAll().catch(error => {
        console.error('❌ useGlobalShortcuts: Failed to unregister shortcuts:', error);
      });
    };
  }, []);
}; 