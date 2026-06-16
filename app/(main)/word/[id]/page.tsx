import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOPIC_LABELS } from '@/types';

async function getWord(id: string) {
  const word = await prisma.word.findUnique({
    where: { id: parseInt(id) },
  });
  return word;
}

export default async function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const word = await getWord(id);

  if (!word) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/library"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 inline-block"
      >
        ← Quay lại thư viện
      </Link>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold">{word.word}</h1>
            {word.ipa && <p className="text-xl text-[var(--muted)] mt-1">{word.ipa}</p>}
          </div>
          <span className="px-3 py-1 bg-[var(--primary)] text-white rounded-full text-sm font-medium">
            {word.level}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-[var(--muted)] mb-1">Nghĩa</p>
            <p className="text-lg whitespace-pre-line">{word.meaning_vi}</p>
          </div>

          {word.example && (
            <div>
              <p className="text-sm text-[var(--muted)] mb-1">Ví dụ</p>
              <p className="text-gray-600 italic whitespace-pre-line">"{word.example}"</p>
            </div>
          )}

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
                <p className="text-2xl font-bold">{word.repetition_count}</p>
                <p className="text-xs text-[var(--muted)]">Lần ôn</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{word.interval_days}</p>
                <p className="text-xs text-[var(--muted)]">Ngày间隔</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-2xl font-bold">{word.ease_factor.toFixed(1)}</p>
                <p className="text-xs text-[var(--muted)]">Độ dễ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}