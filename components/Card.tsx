import Link from 'next/link';
import { Word } from '@/types';

export default function Card({ word }: { word: Word }) {
  return (
    <Link href={`/word/${word.id}`} className="block p-4 bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-[var(--foreground)]">{word.word}</span>
          {word.ipa && (
            <span className="text-sm text-[var(--muted)]">{word.ipa}</span>
          )}
          <p className="mt-2 text-sm text-[var(--muted)] line-clamp-2">{word.meaning_vi}</p>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-[var(--foreground)]">{word.level}</span>
          <span className="px-2 py-1 bg-gray-100 rounded text-xs text-[var(--foreground)]">{word.topic}</span>
        </div>
      </div>
    </Link>
  );
}
