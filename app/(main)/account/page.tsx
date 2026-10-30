import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import StudyPreferences from '@/components/StudyPreferences';
import GoogleConnection from './GoogleConnection';
export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, accounts: { where: { provider: 'google' }, select: { provider: true } } } });
  if (!user) redirect('/');
  return <section><PageHeader title="Tài khoản" description={user.email} /><StudyPreferences /><GoogleConnection email={user.email} linked={user.accounts.length > 0} /></section>;
}
