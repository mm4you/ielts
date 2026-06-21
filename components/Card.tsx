import Link from 'next/link';
import { Word } from '@/types';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

export default function Card({ word }: { word: Word }) {
  return (
    <div className="block panel hover:-translate-y-1 transition-transform h-full flex flex-col group relative">
      <Link href={`/word/${word.id}`} className="absolute inset-0 z-0"></Link>
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <Link href={`/word/${word.id}`} className="block">
            <h3 className="text-xl font-bold font-serif group-hover:text-[var(--blue)] transition-colors">{word.word}</h3>
          </Link>
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
