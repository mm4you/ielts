import NavLayout from '@/components/NavLayout';
import Dashboard from '@/components/Dashboard';
import LoginWall from './LoginWall';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { dueProgressWhere } from '@/lib/srs';

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (error) return <LoginWall initialError={error === 'GoogleAccountMismatch' ? 'Tài khoản Google không khớp hồ sơ đang liên kết. Đăng nhập lại và chọn đúng email Google.' : error === 'OAuthAccountNotLinked' ? 'Email này đã có tài khoản. Đăng nhập bằng phương thức đã dùng trước đó để xác nhận danh tính.' : 'Đăng nhập chưa thành công. Vui lòng thử lại.'} />;
  const session = await auth();
  if (!session?.user?.id) return <LoginWall />;
  const userId = session.user.id;
  const [totalWords, dueWords, collectionsCount, savedWordsCount] = await Promise.all([
    prisma.word.count(),
    prisma.userProgress.count({where:dueProgressWhere(userId)}),
    prisma.collection.count({where:{userId}}),
    prisma.collectionWord.count({where:{collection:{userId}}}),
  ]);
  return <NavLayout><Dashboard name={session.user.name || 'Tài khoản'} totalWords={totalWords} dueWords={dueWords} collectionsCount={collectionsCount} savedWordsCount={savedWordsCount} /></NavLayout>;
}
