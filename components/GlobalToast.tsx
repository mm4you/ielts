'use client';

import { MessageBar, MessageBarBody } from '@fluentui/react-components';
import { useState, useEffect } from 'react';

interface ToastData {
  id: number;
  message: string;
  isSaved: boolean;
}

/**
 * Global helper to trigger a save/remove notification.
 * Dispatches a custom event caught by the root-level GlobalToast component.
 */
export function showToast(message: string, isSaved: boolean) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('show-global-toast', {
      detail: { id: Date.now(), message, isSaved },
    });
    window.dispatchEvent(event);
  }
}

export default function GlobalToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastData>;
      if (customEvent.detail) {
        setToast(customEvent.detail);
        setShow(true);
      }
    };

    window.addEventListener('show-global-toast', handleToast);
    return () => {
      window.removeEventListener('show-global-toast', handleToast);
    };
  }, []);

  // Auto-dismiss timeout
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setShow(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [show, toast]); // dependency on toast ensures timer resets for new notifications

  if (!toast || !show) return null;

  return <div className="global-toast" role="status" aria-live="polite"><MessageBar intent={toast.isSaved?'success':'error'}><MessageBarBody>{toast.message}</MessageBarBody></MessageBar></div>;
}
