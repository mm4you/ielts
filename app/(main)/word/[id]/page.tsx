import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOPIC_LABELS } from '@/types';
import { auth } from '@/auth';
import RecentWordTracker from './RecentWordTracker';
import { parseMeaning } from '@/lib/parse';
import WordPronounceChallenge from './WordPronounceChallenge';

import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

async function getWordAndProgress(id: string) {
  const session = await auth();
  const word = await prisma.word.findUnique({
    where: { id: parseInt(id) },
  });

  if (!word) return { word: null, progress: null };

  let progress = null;
  if (session?.user?.id) {
    progress = await prisma.userProgress.findUnique({
      where: {
        userId_wordId: {
          userId: session.user.id,
          wordId: word.id
        }
      }
    });
  }

  return { word, progress };
}

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { word, progress } = await getWordAndProgress(id);

  if (!word) {
    notFound();
  }

  return (
    <div>
      <RecentWordTracker word={word} />
      <Link
        href="/library"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 inline-block"
      >
        ← Quay lại thư viện
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex gap-3 items-center flex-wrap">
              <h1 className="text-4xl font-bold">{word.word}</h1>
              <SaveToCollection wordId={word.id} wordText={word.word} />
            </div>
            {word.ipa && <p className="text-xl text-[var(--muted)] mt-1">{word.ipa}</p>}
          </div>
          <span className="px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-medium">
            {word.level}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">Nghĩa</p>
            {(() => {
              const { pos, en, vi } = parseMeaning(word.meaning_vi, word.pos);
              return (
                <div className="space-y-1">
                  <p className="text-xl font-bold text-[var(--ink)]">
                    {pos && <span className="text-[var(--blue)] mr-2 text-sm border-2 border-[var(--blue)] px-2 py-0.5 rounded-full">{pos}</span>}
                    {en}
                  </p>
                  {vi && <p className="text-base text-[var(--muted)]">{vi}</p>}
                </div>
              );
            })()}
          </div>

          {word.synonyms && (
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Từ đồng nghĩa</p>
              <div className="flex flex-wrap gap-2">
                {word.synonyms.split(',').map((s, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {s.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Chủ đề</p>
              <p className="font-medium">{TOPIC_LABELS[word.topic] || word.topic}</p>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <p className="text-sm text-[var(--muted)] mb-3">Thống kê ôn tập</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{progress?.repetition_count ?? 0}</p>
                <p className="text-xs text-[var(--muted)]">Lần ôn</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{progress?.interval_days ?? 0}</p>
                <p className="text-xs text-[var(--muted)]">Giãn cách (ngày)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{progress?.ease_factor?.toFixed(1) ?? "2.5"}</p>
                <p className="text-xs text-[var(--muted)]">Độ dễ</p>
              </div>
            </div>
          </div>

          {/* Luyện phát âm AI cho từ vựng này */}
          <WordPronounceChallenge wordId={word.id} wordText={word.word} />
        </div>
      </div>
    </div>
  );
}