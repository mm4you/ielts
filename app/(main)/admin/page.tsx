import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await auth();

  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/');
  }

  const words = await prisma.word.findMany({
    orderBy: { created_at: 'desc' },
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { progress: true }
      }
    }
  });

  return <AdminClient initialWords={words} initialUsers={users as any} />;
}
