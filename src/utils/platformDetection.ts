/**
 * Platform Detection Utility
 * 
 * Provides reliable detection for different runtime environments
 * to enable platform-specific functionality for file operations.
 */

/**
 * Checks if the application is running in Tauri desktop environment
 * @returns boolean - True if running in Tauri desktop app
 */
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;
};

/**
 * Checks if the application is running in a web browser
 * @returns boolean - True if running in web browser
 */
export const isBrowser = (): boolean => {
  return !isDesktop();
};

/**
 * Checks if Tauri APIs are available and accessible
 * @returns boolean - True if Tauri APIs can be used
 */
export const hasTauriAPIs = (): boolean => {
  return isDesktop() && 
         (window as any).__TAURI__?.path && 
         (window as any).__TAURI__?.fs;
};

/**
 * Checks if modern browser File System Access API is available
 * @returns boolean - True if File System Access API is supported
 */
export const hasFileSystemAccess = (): boolean => {
  return typeof window !== 'undefined' && 
         'showSaveFilePicker' in window &&
         'showDirectoryPicker' in window;
};

/**
 * Gets the current platform type as a string
 * @returns string - Platform identifier
 */
export const getPlatformType = (): 'desktop' | 'modern-browser' | 'legacy-browser' => {
  if (isDesktop()) {
    return 'desktop';
  } else if (hasFileSystemAccess()) {
    return 'modern-browser';
  } else {
    return 'legacy-browser';
  }
};

/**
 * Type guard for Tauri environment
 * Useful for TypeScript type narrowing
 */
export const isTauriEnvironment = (): boolean => {
  return isDesktop() && hasTauriAPIs();
};