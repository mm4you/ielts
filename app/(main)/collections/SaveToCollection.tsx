'use client';

import { useState, useEffect } from 'react';

interface SaveToCollectionProps {
  wordId: number;
  className?: string;
  onSaveStatusChange?: (saved: boolean) => void;
}

export default function SaveToCollection({
  wordId,
  className = '',
  onSaveStatusChange,
}: SaveToCollectionProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
        if (nextSaved) {
          setMessage(`Lưu: ${data.collection?.name || 'Sổ tay'}`);
        } else {
          setMessage(`Bỏ lưu: ${data.collection?.name || 'Sổ tay'}`);
        }
        // Auto clear message after 1.5 seconds
        setTimeout(() => setMessage(''), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !message) {
    return (
      <span className={`text-[10px] font-mono opacity-50 select-none ${className}`}>
        [ ... ]
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`text-[10px] md:text-xs font-mono font-bold px-2 py-0.5 rounded border border-[var(--line)] transition-all cursor-pointer select-none ${
          isSaved
            ? 'bg-[var(--blue)] text-white hover:brightness-110 shadow-[1px_1px_0_var(--line)]'
            : 'bg-white hover:bg-gray-50 text-[var(--ink)] shadow-[1px_1px_0_var(--line)]'
        }`}
      >
        {isSaved ? 'Đã lưu' : 'Lưu'}
      </button>
      {message && (
        <span className="text-[9px] md:text-[10px] font-mono text-[var(--blue)] font-bold animate-pulse whitespace-nowrap">
          {message}
        </span>
      )}
    </span>
  );
}
