import Link from 'next/link';
import { PRIVACY_CONTACT } from '@/lib/privacy';
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
  return <section><PageHeader title="Tài khoản" description={user.email} /><StudyPreferences /><GoogleConnection email={user.email} linked={user.accounts.length > 0} />
    <section className="panel privacy-account"><h2>Dữ liệu cá nhân</h2><p>Bạn có thể yêu cầu xem, nhận bản sao, chỉnh sửa, xóa, hạn chế xử lý hoặc rút lại sự đồng ý đã cấp.</p><p>Gửi yêu cầu từ email tài khoản để đội vận hành xác minh. Bạn cũng có thể liên hệ với tư cách người đại diện hợp pháp.</p><a href={'mailto:'+PRIVACY_CONTACT+'?subject=IELTS%20Vocab%20-%20Yeu%20cau%20du%20lieu'}>Gửi yêu cầu về dữ liệu</a><Link href="/privacy">Chính sách quyền riêng tư</Link></section>
  </section>;
}
