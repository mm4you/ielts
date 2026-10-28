'use client';


import { DismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { useState } from 'react';
import PronounceRoast from '@/app/(main)/pronounce-challenge/PronounceRoast';

interface WordPronounceChallengeProps {
  wordId: number;
  wordText: string;
}

export default function WordPronounceChallenge({ wordId, wordText }: WordPronounceChallengeProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-solid border-[var(--line)] pt-6">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-brutal w-full bg-[var(--blue)] text-white py-3.5 px-6 text-lg font-semibold flex items-center justify-center gap-2 transition-transform "
        >
          Luyện phát âm với AI
        </button>
      ) : (
        <div className="relative">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold bg-[var(--red)] text-white border border-[var(--line)] px-2.5 py-1.5 transition-all flex items-center gap-1"
            >
              <DismissRegular aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />
              <span>Đóng luyện tập</span>
            </button>
          </div>
          <PronounceRoast wordId={wordId} wordText={wordText} />
        </div>
      )}
    </div>
  );
}
