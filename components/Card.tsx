'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Word } from '@/types';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

export default function Card({ word }: { word: Word }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(`/api/tts?text=${encodeURIComponent(word.word)}&lang=en`);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.play().catch(err => {
      console.warn("Audio play failed:", err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
  };

  return (
    <div className="block panel hover:-translate-y-1 transition-transform h-full flex flex-col group relative">
      <Link href={`/word/${word.id}`} className="absolute inset-0 z-0"></Link>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/word/${word.id}`} className="block">
              <h3 className="text-xl font-bold font-serif group-hover:text-[var(--blue)] transition-colors">{word.word}</h3>
            </Link>
            <button
              onClick={handlePlayAudio}
              className={`p-1 rounded-md border-2 border-[var(--line)] transition-all flex items-center justify-center cursor-pointer select-none relative z-20
                ${isPlaying 
                  ? 'bg-[var(--green)] text-white translate-y-0.5 shadow-none' 
                  : 'bg-[var(--bg)] hover:bg-[var(--yellow)] text-[var(--ink)] shadow-[1.5px_1.5px_0_var(--line)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
                }`}
              title="Phát âm"
            >
              {isPlaying ? (
                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              )}
            </button>
          </div>
          {word.ipa && (
            <span className="text-sm text-[var(--muted)]">{word.ipa}</span>
          )}
        </div>
        <SaveToCollection wordId={word.id} wordText={word.word} />
      </div>
      
      {(() => {
        const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
        const hasMeaning = en || vi;

        return (
          <div className="mt-2 flex-1 mb-4">
            {!hasMeaning ? (
              <p className="text-[var(--muted)] font-bold italic text-sm">(Chưa có định nghĩa)</p>
            ) : (
              <>
                <p className="text-[var(--ink)] font-bold line-clamp-1">
                  {pos && <span className="bg-[#0ea5e9] text-[#111827] border border-[var(--line)] px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold uppercase mr-1.5 shadow-[1px_1px_0_var(--line)]">{pos}</span>}
                  {en}
                </p>
                {vi && <p className="text-[var(--muted)] text-sm line-clamp-1">{vi}</p>}
              </>
            )}
          </div>
        );
      })()}
      
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
        <span className="bg-[#f59e0b] text-[#111827] border-2 border-[var(--line)] shadow-[1.5px_1.5px_0_var(--line)] font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider">{word.level}</span>
        <span className="chip">{word.topic}</span>
      </div>
    </div>
  );
}
