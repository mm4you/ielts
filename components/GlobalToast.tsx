'use client';

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

  return (
    <>
      {/* Stylesheet injected for toast animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-toast-slide {
          animation: slideInRight 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}} />

      {/* Screen Corner Toast Alert (using z-[9999] and rendered at root body level) */}
      <div 
        key={toast.id}
        className={`fixed bottom-6 right-6 z-[9999] py-3 px-5 border-[3px] border-[var(--line)] shadow-[4px_4px_0px_#000] font-mono text-sm font-bold uppercase flex items-center gap-3 rounded-xl animate-toast-slide ${
          toast.isSaved 
            ? 'bg-[var(--green)] text-white' 
            : 'bg-[var(--red)] text-white'
        }`}
      >
        <span>{toast.message}</span>
      </div>
    </>
  );
}
