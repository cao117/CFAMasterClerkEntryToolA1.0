/**
 * ResumeWorkModal Component
 * 
 * Clean modal component for offering to resume recent work on startup.
 * Matches existing modal styling patterns for consistency.
 */

import { useEffect, useRef } from 'react';

interface ResumeWorkModalProps {
  isOpen: boolean;
  onResume: () => void;
  onDecline: () => void;
  timestamp: string;
}

export default function ResumeWorkModal({
  isOpen,
  onResume,
  onDecline,
  timestamp
}: ResumeWorkModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDecline();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onDecline]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleResume = () => {
    onResume();
  };

  const handleDecline = () => {
    onDecline();
  };

  return (
    <div className="cfa-modal-overlay">
      {/* Backdrop */}
      <div 
        className="cfa-modal-backdrop"
        onClick={handleDecline}
      />
      
      {/* Modal Dialog */}
      <div
        className="cfa-modal-dialog"
        tabIndex={-1}
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
              <div className="text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Previous work (within 24 hours) detected
              </h3>
            </div>
          </div>
          
          {/* Premium X Button - Top Right */}
          <button
            onClick={handleDecline}
            className="group relative w-6 h-6 rounded-full bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 shadow-sm hover:shadow-md"
            aria-label="Close modal"
          >
            <svg 
              className="w-3 h-3 text-orange-500 group-hover:text-orange-700 transition-all duration-300 group-hover:rotate-90" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2.5} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
            {/* Premium glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-200/50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm"></div>
            {/* Subtle border effect */}
            <div className="absolute inset-0 rounded-full border border-orange-200/30 group-hover:border-orange-300/50 transition-all duration-300"></div>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Would you like to resume your work from your previous session?
          </p>
          
          {/* Timestamp Display */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last worked on</p>
                <p className="text-sm text-orange-600">
                  {timestamp}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleDecline}
            className="group relative px-4 py-2 text-sm font-medium text-gray-700 bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 transform hover:-translate-y-0.5"
          >
            <span className="relative z-10">Start New Session</span>
            {/* Subtle background glow on hover */}
            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-gray-100/50 to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
          
          <button
            onClick={handleResume}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 rounded-md shadow-sm hover:shadow-md"
          >
            Resume Work
          </button>
        </div>
      </div>
    </div>
  );
} 