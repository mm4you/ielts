'use client';


import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
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
    <div className="word-card group">
      <Link href={`/word/${word.id}`} className="absolute inset-0 z-0"></Link>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/word/${word.id}`} className="block">
              <h3 className="text-xl font-semibold font-sans group-hover:text-[var(--blue)] transition-colors">{word.word}</h3>
            </Link>
            <button
              onClick={handlePlayAudio}
              className={`audio-button relative z-20 ${isPlaying ? 'bg-[var(--green)] text-white translate-y-0.5 shadow-none' : 'bg-[var(--bg)] hover:bg-[var(--brand-soft)] text-[var(--blue)] active:shadow-none' }`}
              title="Phát âm"
            >
              {isPlaying ? (
                <Speaker2Regular aria-hidden="true" className="w-3.5 h-3.5 " />
              ) : (
                <Speaker2Regular aria-hidden="true" className="w-3.5 h-3.5" />
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
              <p className="text-[var(--muted)] font-semibold italic text-sm">(Chưa có định nghĩa)</p>
            ) : (
              <>
                <p className="text-[var(--ink)] font-semibold line-clamp-1">
                  {pos && <span className="word-pos">{pos}</span>}
                  {en}
                </p>
                {vi && <p className="text-[var(--muted)] text-sm line-clamp-1">{vi}</p>}
              </>
            )}
          </div>
        );
      })()}

      <div className="word-footer">
        <span className="word-level">{word.level}</span>
        <span className="chip">{word.topic}</span>
      </div>
    </div>
  );
}
