import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = 'confirm',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = true
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          icon: "text-yellow-600",
          iconBg: "bg-yellow-100",
          border: "border-yellow-200",
          button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
        };
      case 'alert':
        return {
          icon: "text-red-600",
          iconBg: "bg-red-100",
          border: "border-red-200",
          button: "bg-red-600 hover:bg-red-700 focus:ring-red-500"
        };
      default:
        return {
          icon: "text-blue-600",
          iconBg: "bg-blue-100",
          border: "border-blue-200",
          button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  // --- Modal centering and width fix: always center in viewport, robust max-width ---
  // Use a fixed overlay with flexbox centering, and make dialog scrollable if needed
  const modalJSX = (
    <div className="cfa-modal-overlay">
      {/* Backdrop */}
      <div 
        className="cfa-modal-backdrop"
        onClick={onClose}
      />
      {/* Modal Dialog */}
        <div
        className="cfa-modal-dialog"
        tabIndex={-1}
          ref={modalRef}
        onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${styles.border}`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconBg}`}>
                <div className={styles.icon}>
                  {getIcon()}
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              </div>
            </div>
            
            {/* Premium X Button - Top Right */}
            <button
              onClick={onClose}
              className={`group relative w-6 h-6 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 shadow-sm hover:shadow-md`}
              aria-label="Close modal"
            >
              <svg 
                className={`w-3 h-3 transition-all duration-300 group-hover:rotate-90 ${
                  type === 'alert' ? 'text-red-500 group-hover:text-red-700' :
                  type === 'warning' ? 'text-yellow-500 group-hover:text-yellow-700' :
                  'text-gray-500 group-hover:text-gray-700'
                }`}
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
              <div className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 blur-sm ${
                type === 'alert' ? 'bg-gradient-to-r from-red-200/50 to-red-100/50' :
                type === 'warning' ? 'bg-gradient-to-r from-yellow-200/50 to-yellow-100/50' :
                'bg-gradient-to-r from-gray-200/50 to-gray-100/50'
              }`}></div>
              {/* Subtle border effect */}
              <div className={`absolute inset-0 rounded-full border transition-all duration-300 ${
                type === 'alert' ? 'border-red-200/30 group-hover:border-red-300/50' :
                type === 'warning' ? 'border-yellow-200/30 group-hover:border-yellow-300/50' :
                'border-gray-200/30 group-hover:border-gray-300/50'
              }`}></div>
            </button>
          </div>
          {/* Content */}
          <div className="p-6">
            <p className="text-sm text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${styles.button}`}
            >
              {confirmText}
            </button>
          </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(modalJSX, document.body);
} 