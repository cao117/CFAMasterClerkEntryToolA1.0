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
        <div className="flex items-center p-6 border-b border-blue-200">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Resume Previous Work
            </h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Would you like to resume your work from your previous session?
          </p>
          
          {/* Timestamp Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last worked on</p>
                <p className="text-sm text-gray-600">
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Start New Session
          </button>
          
          <button
            onClick={handleResume}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 rounded-md"
          >
            Resume Work
          </button>
        </div>
      </div>
    </div>
  );
} 