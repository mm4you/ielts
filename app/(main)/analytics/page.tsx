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

  // 1. Top 5 Block Blast
  const topBlockblastRaw = await prisma.user.findMany({
    where: { blockblastHighScore: { gt: 0 } },
    orderBy: { blockblastHighScore: 'desc' },
    take: 5,
    select: { name: true, email: true, blockblastHighScore: true }
  });

  // 2. Top 5 Speedrun
  const topSpeedrunRaw = await prisma.user.findMany({
    where: { speedrunHighScore: { gt: 0 } },
    orderBy: { speedrunHighScore: 'desc' },
    take: 5,
    select: { name: true, email: true, speedrunHighScore: true }
  });

  // 3. Top 5 Sniper
  const topSniperRaw = await prisma.user.findMany({
    where: { sniperHighScore: { gt: 0 } },
    orderBy: { sniperHighScore: 'desc' },
    take: 5,
    select: { name: true, email: true, sniperHighScore: true }
  });

  // 4. Top 5 Mastered (từ đã thuộc lòng: interval_days > 15)
  const masteredGroups = await prisma.userProgress.groupBy({
    by: ['userId'],
    _count: {
      id: true
    },
    where: {
      interval_days: { gt: 15 }
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 10
  });

  const userIds = masteredGroups.map((g: any) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  });

  const topMasteredRaw = masteredGroups
    .map((g: any) => {
      const u = users.find((user: any) => user.id === g.userId);
      return {
        name: u?.name || null,
        email: u?.email || null,
        score: g._count.id
      };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  // Helper ẩn thông tin email để bảo mật
  const formatUser = (uObj: { name: string | null; email: string | null; score: number }) => {
    let displayName = 'Ẩn danh';
    if (uObj.name) {
      displayName = uObj.name;
    } else if (uObj.email) {
      displayName = uObj.email.split('@')[0];
    }
    return {
      name: displayName,
      score: uObj.score
    };
  };

  const leaderboard = {
    blockblast: topBlockblastRaw.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.blockblastHighScore })),
    speedrun: topSpeedrunRaw.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.speedrunHighScore })),
    sniper: topSniperRaw.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.sniperHighScore })),
    mastered: topMasteredRaw.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.score }))
  };

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
      leaderboard={leaderboard}
    />
  );
}
