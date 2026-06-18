'use client';

import { useState, useEffect } from 'react';

interface SaveToCollectionProps {
  wordId: number;
  wordText?: string;
  className?: string;
  onSaveStatusChange?: (saved: boolean) => void;
}

interface Toast {
  show: boolean;
  message: string;
  isSaved: boolean;
}

export default function SaveToCollection({
  wordId,
  wordText = '',
  className = '',
  onSaveStatusChange,
}: SaveToCollectionProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let active = true;
    const checkSaved = async () => {
      try {
        const res = await fetch(`/api/collections/quick-add?wordId=${wordId}`);
        const data = await res.json();
        if (active && res.ok && data.savedCollectionIds) {
          setIsSaved(data.savedCollectionIds.length > 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    checkSaved();
    return () => {
      active = false;
    };
  }, [wordId]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/collections/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId })
      });
      const data = await res.json();
      if (res.ok) {
        const nextSaved = data.added;
        setIsSaved(nextSaved);
        if (onSaveStatusChange) {
          onSaveStatusChange(nextSaved);
        }

        // Trigger toast notification at the right corner of the screen
        setToast({
          show: true,
          message: nextSaved 
            ? `Đã lưu thành công: "${wordText || 'từ vựng'}"` 
            : `Đã gỡ thành công: "${wordText || 'từ vựng'}"`,
          isSaved: nextSaved
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !toast) {
    return (
      <span className={`text-[10px] font-mono opacity-50 select-none ${className}`}>
        [ ... ]
      </span>
    );
  }

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

      <span className={`inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={loading}
          className={`text-[10px] md:text-xs font-mono font-black px-2.5 py-1 rounded border transition-all cursor-pointer select-none hover:scale-102 active:scale-98 ${
            isSaved
              ? 'bg-[var(--green)] text-white border-[var(--line)] shadow-[1.5px_1.5px_0_var(--line)] hover:brightness-105'
              : 'bg-[var(--paper)] text-[var(--ink)] border-[var(--line)] shadow-[1.5px_1.5px_0_var(--line)] hover:bg-green-50 hover:text-[var(--green)] hover:border-[var(--green)] hover:shadow-[1.5px_1.5px_0_var(--green)]'
          }`}
        >
          {isSaved ? 'ĐÃ LƯU' : 'LƯU'}
        </button>
      </span>

      {/* Screen Corner Toast Alert */}
      {toast?.show && (
        <div 
          className={`fixed bottom-6 right-6 z-50 py-3 px-5 border-[3px] border-[var(--line)] shadow-[4px_4px_0px_#000] font-mono text-sm font-bold uppercase flex items-center gap-3 rounded-xl animate-toast-slide ${
            toast.isSaved 
              ? 'bg-[var(--green)] text-white' 
              : 'bg-[var(--red)] text-white'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
