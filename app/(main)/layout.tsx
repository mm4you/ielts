import NavLayout from '@/components/NavLayout';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect('/');
  }
  return <NavLayout>{children}</NavLayout>;
}