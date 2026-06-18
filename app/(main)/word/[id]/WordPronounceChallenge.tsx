'use client';

import { useState } from 'react';
import PronounceRoast from '@/app/(main)/pronounce-challenge/PronounceRoast';

interface WordPronounceChallengeProps {
  wordId: number;
  wordText: string;
}

export default function WordPronounceChallenge({ wordId, wordText }: WordPronounceChallengeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border-t-2 border-dashed border-[var(--line)] pt-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-brutal w-full bg-[var(--blue)] text-white py-3.5 px-6 text-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform shadow-[4px_4px_0_var(--line)]"
        >
          🎙️ LUYỆN PHÁT ÂM VỚI AI
        </button>
      ) : (
        <div className="relative">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-black bg-[var(--red)] text-white border-2 border-[var(--line)] px-2.5 py-1 uppercase shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-[0_0_0_var(--line)] transition-all"
            >
              ✕ Đóng luyện tập
            </button>
          </div>
          <PronounceRoast wordId={wordId} wordText={wordText} />
        </div>
      )}
    </div>
  );
}
