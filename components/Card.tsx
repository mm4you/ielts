import Link from 'next/link';
import { Word } from '@/types';
import { parseMeaning } from '@/lib/parse';

export default function Card({ word }: { word: Word }) {
  return (
    <Link href={`/word/${word.id}`} className="block panel hover:-translate-y-1 transition-transform cursor-pointer h-full flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold font-serif group-hover:text-[var(--blue)] transition-colors">{word.word}</h3>
          {word.ipa && (
            <span className="text-sm text-[var(--muted)]">{word.ipa}</span>
          )}
        </div>
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
                  {pos && <span className="text-[var(--blue)] mr-1">[{pos}]</span>}
                  {en}
                </p>
                {vi && <p className="text-[var(--muted)] text-sm line-clamp-1">{vi}</p>}
              </>
            )}
          </div>
        );
      })()}
      
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
        <span className="chip bg-[var(--yellow)]">{word.level}</span>
        <span className="chip">{word.topic}</span>
      </div>
    </Link>
  );
}
