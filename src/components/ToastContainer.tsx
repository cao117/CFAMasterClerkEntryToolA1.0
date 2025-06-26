import { useState, useCallback } from 'react';
import ToastNotification from './ToastNotification';
import type { Toast } from './ToastNotification';

interface ToastContainerProps {
  toasts: Toast[];
  onRemoveToast: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemoveToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 8}px)`,
            zIndex: 1000 - index
          }}
        >
          <ToastNotification
            toast={toast}
            onRemove={onRemoveToast}
          />
        </div>
      ))}
    </div>
  );
} 