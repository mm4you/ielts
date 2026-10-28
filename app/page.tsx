import NavLayout from '@/components/NavLayout';
import Dashboard from '@/components/Dashboard';
import LoginWall from './LoginWall';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) return <LoginWall />;
  const userId = session.user.id;
  const [totalWords, dueWords, collectionsCount, savedWordsCount] = await Promise.all([
    prisma.word.count(),
    prisma.userProgress.count({where:{userId,next_review_date:{lte:new Date()},repetition_count:{gt:0}}}),
    prisma.collection.count({where:{userId}}),
    prisma.collectionWord.count({where:{collection:{userId}}}),
  ]);
  return <NavLayout><Dashboard name={session.user.name || 'Tài khoản'} totalWords={totalWords} dueWords={dueWords} collectionsCount={collectionsCount} savedWordsCount={savedWordsCount} /></NavLayout>;
}
