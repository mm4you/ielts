import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalWords, masteredWords, dueToday] = await Promise.all([
      prisma.word.count(),
      prisma.word.count({ where: { interval_days: { gte: 21 } } }),
      prisma.word.count({ where: { next_review_date: { lt: tomorrow } } }),
    ]);

    return { totalWords, masteredWords, dueToday, streak: 1, error: null };
  } catch (error) {
    return { totalWords: 0, masteredWords: 0, dueToday: 0, streak: 0, error: 'Database not connected' };
  }
}

export default async function HomePage() {
  const { totalWords, masteredWords, dueToday, streak, error } = await getStats();

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)] mb-4">{error}</p>
        <p className="text-sm text-[var(--muted)]">Vui lòng cấu hình DATABASE_URL</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Xin chào!</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="stat-value">{totalWords}</div>
          <div className="stat-label">Tổng số từ</div>
        </div>
        <div className="card">
          <div className="stat-value">{masteredWords}</div>
          <div className="stat-label">Đã thuộc</div>
        </div>
        <div className="card">
          <div className="stat-value">{dueToday}</div>
          <div className="stat-label">Cần ôn hôm nay</div>
        </div>
        <div className="card">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Chuỗi ngày</div>
        </div>
      </div>

      {dueToday > 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--muted)] mb-4">
            Bạn có <span className="font-bold text-[var(--foreground)]">{dueToday}</span> từ cần ôn tập hôm nay
          </p>
          <Link href="/review" className="btn-primary inline-block">
            Bắt đầu ôn tập
          </Link>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-[var(--muted)]">Không có từ nào cần ôn tập hôm nay. Giỏi lắm!</p>
          <Link href="/library" className="btn-secondary inline-block mt-4">
            Khám phá thư viện
          </Link>
        </div>
      )}
    </div>
  );
}