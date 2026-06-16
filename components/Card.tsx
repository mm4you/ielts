import Link from 'next/link';
import { Word } from '@/types';

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
      
      <p className="mt-2 text-[var(--ink)] line-clamp-2 flex-1 mb-4">{word.meaning_vi}</p>
      
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
        <span className="chip bg-[var(--yellow)]">{word.level}</span>
        <span className="chip">{word.topic}</span>
      </div>
    </Link>
  );
}
