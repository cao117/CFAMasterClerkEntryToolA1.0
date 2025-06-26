import { useState, useCallback } from 'react';
import type { Toast } from '../components/ToastNotification';

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message: message || '', duration });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message: message || '', duration });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message: message || '', duration });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message: message || '', duration });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
} 