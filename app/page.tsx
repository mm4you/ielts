import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginWall from '@/components/LoginWall';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    return <LoginWall />;
  }

  const totalWords = await prisma.word.count();
  
  let dueWords = 0;
  if (session?.user?.id) {
    const today = new Date();
    dueWords = await prisma.userProgress.count({
      where: { 
        userId: session.user.id,
        next_review_date: { lte: today },
        repetition_count: { gt: 0 }
      }
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-16 md:pb-0">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <Header />
      
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 flex-1">
        <section className="flex flex-col gap-6 justify-between items-start mb-12">
          <div className="max-w-2xl">
            <div className="inline-block mb-4 px-3 py-1 border-2 border-[var(--line)] rounded-full bg-[var(--paper)] font-bold text-xs shadow-[2px_2px_0_var(--line)]">
              IELTS Vocabulary Studio
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-[var(--ink)] mb-4">
              Ôn trắc nghiệm Từ vựng
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-[700px]">
              Ứng dụng học từ vựng IELTS. Giao diện gọn, tập trung. Luyện từ với hệ thống lặp lại ngắt quãng thông minh.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2">Học & Ôn tập</h2>
            <p className="text-[var(--muted)] mb-6 flex-1">
              Ôn tập các từ vựng đến hạn bằng flashcard. Hệ thống tự tính thời điểm lặp lại tối ưu.
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold text-lg">
                {!session ? 'Cần đăng nhập' : (dueWords > 0 ? `${dueWords.toLocaleString('vi-VN')} thẻ cần ôn` : 'Đã ôn xong')}
              </span>
              <Link href="/review" className="btn-primary">
                Bắt đầu
              </Link>
            </div>
          </article>

          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--green)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2">Quẹt Thẻ Tinder</h2>
            <p className="text-[var(--muted)] mb-6 flex-1">
              Quẹt trái/phải để lọc nhanh hàng trăm từ vựng, giúp hệ thống biết bạn đã rành từ nào.
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold text-lg text-[var(--green)]">Lọc siêu tốc</span>
              <Link href="/swipe" className="btn-brutal bg-[var(--green)] text-white">
                Quẹt ngay
              </Link>
            </div>
          </article>

          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--red)] shadow-[8px_8px_0_var(--red)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--red)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2 text-[var(--red)]">Sinh Tồn Tốc Chiến</h2>
            <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
              15 giây sinh tồn. Trả lời đúng +2s. Sai là GAME OVER ngay lập tức!
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold text-lg text-[var(--red)]">Ép nhịp tim</span>
              <Link href="/speedrun" className="btn-brutal bg-[var(--red)] text-white animate-pulse">
                Chơi luôn
              </Link>
            </div>
          </article>

          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--yellow)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2">Thư viện Từ điển</h2>
            <p className="text-[var(--muted)] mb-6 flex-1">
              Tra cứu, tìm kiếm danh sách toàn bộ từ vựng theo chủ đề hoặc cấp độ (A1-C2).
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold text-lg">Khám phá <span className="text-[var(--blue)]">{totalWords.toLocaleString('vi-VN')}</span> từ</span>
              <Link href="/library" className="btn-brutal bg-[var(--yellow)] text-[var(--ink)]">
                Vào thư viện
              </Link>
            </div>
          </article>

          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--blue)] shadow-[8px_8px_0_var(--blue)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2 text-[var(--blue)]">Lật Thẻ Tìm Cặp</h2>
            <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
              Luyện trí nhớ hình ảnh bằng cách ghép cặp từ Tiếng Anh và nghĩa Tiếng Việt.
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold text-lg text-[var(--blue)]">Nhẹ nhàng</span>
              <Link href="/match" className="btn-brutal bg-[var(--blue)] text-white">
                Chơi ngay
              </Link>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
