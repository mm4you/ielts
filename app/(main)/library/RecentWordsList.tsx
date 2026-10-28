'use client';


import { HistoryRegular } from '@fluentui/react-icons/svg/history';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { parseMeaning } from '@/lib/parse';

interface RecentWord {
  id: number;
  word: string;
  pos?: string | null;
  meaning_vi: string;
}

export default function RecentWordsList() {
  const [recentWords, setRecentWords] = useState<RecentWord[]>([]);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('recent_words');
      if (historyStr) {
        setRecentWords(JSON.parse(historyStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (recentWords.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-sans font-semibold text-[var(--ink)] mb-3 flex items-center gap-2">
        <HistoryRegular aria-hidden="true" className="w-5 h-5 text-[var(--blue)]" />
        Vừa tra cứu gần đây
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {recentWords.map((w, idx) => {
          const { pos, en } = parseMeaning(w.meaning_vi, w.pos);
          return (
            <Link
              key={`${w.id}-${idx}`}
              href={`/word/${w.id}`}
              className="flex-shrink-0 bg-[var(--paper)] border border-[var(--line)] rounded-xl px-4 py-2 hover:border-[var(--blue)] transition-all group"
            >
              <div className="flex gap-1 items-center">
                <p className="font-semibold text-[var(--ink)] group-hover:text-[var(--blue)]">{w.word}</p>
                {pos && <span className="bg-[#0ea5e9] text-[#111827] border border-[var(--line)] px-1.5 py-0.5 rounded font-sans text-[9px] font-semibold ">{pos}</span>}
              </div>
              <p className="text-xs text-[var(--muted)] truncate max-w-[120px]">{en}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
