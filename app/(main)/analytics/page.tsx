import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AnalyticsClient from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect('/');
  }

  const userId = session.user.id;

  // Lấy tổng số từ trong thư viện hệ thống
  const totalWords = await prisma.word.count();

  // Lấy các chỉ số từ UserProgress
  const learnedWords = await prisma.userProgress.count({
    where: { userId }
  });

  const masteredCount = await prisma.userProgress.count({
    where: {
      userId,
      interval_days: { gt: 15 }
    }
  });

  const learningCount = await prisma.userProgress.count({
    where: {
      userId,
      interval_days: { lte: 15 }
    }
  });

  // Số từ chưa học
  const newCount = Math.max(0, totalWords - learnedWords);

  // Lấy hoạt động hàng ngày
  const activities = await prisma.dailyActivity.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  // Lấy điểm số kỷ lục trò chơi
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      blockblastHighScore: true,
      speedrunHighScore: true,
      sniperHighScore: true,
      name: true,
      email: true
    }
  });

  // Tính toán Streak
  const activityDates = new Set(
    activities.map((a: any) => {
      const d = new Date(a.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    })
  );

  let streak = 0;
  const today = new Date();
  const formatDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const todayStr = formatDate(today);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let hasActivityToday = activityDates.has(todayStr);
  let hasActivityYesterday = activityDates.has(yesterdayStr);

  if (hasActivityToday || hasActivityYesterday) {
    let checkDate = hasActivityToday ? today : yesterday;
    while (activityDates.has(formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Chuẩn bị dữ liệu hoạt động cho Heatmap (365 ngày qua)
  const heatmapData: Record<string, number> = {};
  activities.forEach((a: any) => {
    const d = new Date(a.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${date}`;
    heatmapData[key] = (heatmapData[key] || 0) + a.wordsLearned;
  });

  return (
    <AnalyticsClient
      totalWords={totalWords}
      learnedWords={learnedWords}
      masteredCount={masteredCount}
      learningCount={learningCount}
      newCount={newCount}
      streak={streak}
      hasActivityToday={hasActivityToday}
      heatmapData={heatmapData}
      highScores={{
        blockblast: user?.blockblastHighScore || 0,
        speedrun: user?.speedrunHighScore || 0,
        sniper: user?.sniperHighScore || 0
      }}
      userName={user?.name || user?.email || 'Học viên'}
    />
  );
}
