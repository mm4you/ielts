import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    // 1. Top 5 Block Blast
    const rawBlockblast = await prisma.user.findMany({
      where: { blockblastHighScore: { gt: 0 } },
      orderBy: { blockblastHighScore: 'desc' },
      take: 5,
      select: { name: true, email: true, blockblastHighScore: true }
    });

    // 2. Top 5 Speedrun
    const rawSpeedrun = await prisma.user.findMany({
      where: { speedrunHighScore: { gt: 0 } },
      orderBy: { speedrunHighScore: 'desc' },
      take: 5,
      select: { name: true, email: true, speedrunHighScore: true }
    });

    // 3. Top 5 Sniper
    const rawSniper = await prisma.user.findMany({
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
      take: 10 // Lấy dư một chút để map thông tin user
    });

    const userIds = masteredGroups.map((g: any) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });

    const rawMastered = masteredGroups
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

    // Hàm ẩn thông tin email để bảo mật
    const formatUser = (user: { name: string | null; email: string | null; score: number }) => {
      let displayName = 'Ẩn danh';
      if (user.name) {
        displayName = user.name;
      } else if (user.email) {
        const parts = user.email.split('@');
        displayName = parts[0];
      }
      return {
        name: displayName,
        score: user.score
      };
    };

    return NextResponse.json({
      blockblast: rawBlockblast.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.blockblastHighScore })),
      speedrun: rawSpeedrun.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.speedrunHighScore })),
      sniper: rawSniper.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.sniperHighScore })),
      mastered: rawMastered.map((u: any) => formatUser({ name: u.name, email: u.email, score: u.score }))
    });

  } catch (error) {
    console.error('Lỗi khi lấy bảng xếp hạng:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ nội bộ' }, { status: 500 });
  }
}
