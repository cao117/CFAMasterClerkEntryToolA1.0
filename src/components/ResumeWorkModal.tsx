/**
 * ResumeWorkModal Component
 * 
 * Modal component for offering to resume recent work on startup.
 * Follows the existing Modal.tsx design patterns and styling.
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
              Previous Work Detected
            </h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Would you like to resume your previous work created at:
          </p>
          <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-md">
            {timestamp}
          </p>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Start Fresh
          </button>
          <button
            onClick={handleResume}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md transition-colors duration-200"
          >
            Resume Work
          </button>
        </div>
      </div>
    </div>
  );
} 