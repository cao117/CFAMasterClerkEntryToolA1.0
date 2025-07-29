import React from 'react';

/**
 * Props for ActionButtons component.
 * Only handlers and a flag for Fill Test Data are needed.
 */
interface ActionButtonsProps {
  onSaveToExcel: () => void;
  onLoadFromExcel: () => void;
  onReset: () => void;
  onFillTestData?: () => void;
  resetButtonText?: string; // e.g., "Reset Tab"
}

/**
 * Shared ActionButtons component for all tabs.
 * Renders 3 or 4 premium, CFA-branded buttons with consistent styling.
 * All button classes are hardcoded for robustness and Tailwind compatibility.
 * @param props ActionButtonsProps
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSaveToExcel,
  onLoadFromExcel,
  onReset,
  onFillTestData,
  resetButtonText = 'Reset',
}) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-12">
      <div className="flex gap-3">
        {/* Save to Excel Button */}
        <button
          type="button"
          onClick={onSaveToExcel}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium modern-tab-font rounded-full border border-emerald-600/40 shadow-sm transition-all duration-250 focus:outline-none hover:scale-105 hover:shadow-green-200/30 hover:from-emerald-700 hover:to-green-500 hover:border-green-400 hover:text-emerald-50 mr-3"
        >
          <span className="relative flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Save to Excel</span>
          </span>
        </button>
        {/* Load from Excel Button */}
        <button
          type="button"
          onClick={onLoadFromExcel}
          className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-medium modern-tab-font rounded-full border border-blue-600/40 shadow-sm transition-all duration-250 focus:outline-none hover:scale-105 hover:shadow-blue-200/30 hover:from-blue-700 hover:to-blue-400 hover:border-blue-400 hover:text-blue-50 mr-3"
        >
          <span className="relative flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>Load from Excel</span>
          </span>
        </button>
        {/* Reset Button */}
        <button
          type="button"
          onClick={onReset}
          className={`group relative px-5 py-2.5 bg-gradient-to-r from-gray-500 to-slate-600 text-white font-medium modern-tab-font rounded-full border border-slate-600/40 shadow-sm transition-all duration-250 focus:outline-none hover:scale-105 hover:shadow-gray-200/30 hover:from-slate-700 hover:to-gray-500 hover:border-gray-400 hover:text-gray-100${onFillTestData ? ' mr-3' : ''}`}
        >
          <span className="relative flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{resetButtonText}</span>
          </span>
        </button>
        {/* Fill Test Data Button (only for General tab) */}
        {onFillTestData && (
          <button
            type="button"
            onClick={onFillTestData}
                      className="group relative px-5 py-2.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-medium modern-tab-font rounded-full border border-orange-400/40 shadow-sm transition-all duration-250 focus:outline-none hover:scale-105 hover:shadow-yellow-200/30 hover:from-orange-600 hover:to-yellow-400 hover:border-yellow-400 hover:text-yellow-50"
          >
            <span className="relative flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Fill Test Data</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons; 