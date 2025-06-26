import { useState, useEffect } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

interface ToastNotificationProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

export default function ToastNotification({ toast, onRemove }: ToastNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-dismiss
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0";
    const exitStyles = isExiting ? "translate-x-full opacity-0" : "";
    
    return `${baseStyles} ${visibilityStyles} ${exitStyles}`;
  };

  const getTypeStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          container: "bg-green-50 border-green-200",
          icon: "text-green-600",
          title: "text-green-800",
          message: "text-green-700",
          progress: "bg-green-500"
        };
      case 'error':
        return {
          container: "bg-red-50 border-red-200",
          icon: "text-red-600",
          title: "text-red-800",
          message: "text-red-700",
          progress: "bg-red-500"
        };
      case 'warning':
        return {
          container: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-600",
          title: "text-yellow-800",
          message: "text-yellow-700",
          progress: "bg-yellow-500"
        };
      case 'info':
        return {
          container: "bg-blue-50 border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-800",
          message: "text-blue-700",
          progress: "bg-blue-500"
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          icon: "text-gray-600",
          title: "text-gray-800",
          message: "text-gray-700",
          progress: "bg-gray-500"
        };
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={getToastStyles()}>
      <div className={`rounded-lg border shadow-lg overflow-hidden ${styles.container}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              {getIcon()}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-semibold ${styles.title}`}>
                {toast.title}
              </h3>
              {toast.message && (
                <p className={`text-sm mt-1 ${styles.message}`}>
                  {toast.message}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.icon} hover:bg-opacity-10 hover:bg-current`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {toast.duration !== 0 && (
          <div className="h-1 bg-gray-200">
            <div 
              className={`h-full ${styles.progress} transition-all duration-300 ease-linear`}
              style={{ 
                width: isExiting ? '0%' : '100%',
                transitionDuration: `${toast.duration || 5000}ms`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 