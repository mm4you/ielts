import Header from '@/components/Header';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function HomePage() {
  const totalWords = await prisma.word.count();
  
  const today = new Date();
  const dueWords = await prisma.word.count({
    where: { next_review_date: { lte: today } }
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] relative overflow-hidden">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <Header />
      
      <main className="max-w-[1120px] mx-auto px-4 pt-32 pb-10">
        <section className="flex flex-col md:flex-row gap-6 justify-between items-start mb-12">
          <div className="max-w-2xl">
            <div className="inline-block mb-4 px-3 py-1 border-2 border-[var(--line)] rounded-full bg-white font-bold text-xs">
              IELTS Vocabulary Studio
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--ink)] mb-4">
              Ôn trắc nghiệm Từ vựng
            </h1>
            <p className="text-[var(--muted)] text-lg max-w-[700px]">
              Ứng dụng học từ vựng IELTS. Giao diện gọn, tập trung. Luyện từ với hệ thống lặp lại ngắt quãng thông minh.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end max-w-[320px]">
            <span className="chip">~{totalWords} từ vựng</span>
            <span className="chip">Học lặp lại ngắt quãng</span>
            <span className="chip">{dueWords} từ đến hạn ôn</span>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2">Học & Ôn tập</h2>
            <p className="text-[var(--muted)] mb-6 flex-1">
              Ôn tập các từ vựng đến hạn. Hệ thống sẽ tự động tính toán thời điểm lặp lại tối ưu cho từng thẻ.
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold">{dueWords > 0 ? `${dueWords} thẻ cần ôn` : 'Đã ôn xong'}</span>
              <Link href="/review" className="btn-primary">
                Bắt đầu ôn
              </Link>
            </div>
          </article>

          <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--yellow)] rounded-bl-full opacity-10"></div>
            <h2 className="text-2xl font-serif font-bold mb-2">Thư viện từ vựng</h2>
            <p className="text-[var(--muted)] mb-6 flex-1">
              Tra cứu, tìm kiếm và xem lại danh sách toàn bộ từ vựng theo chủ đề hoặc cấp độ (A1-C2).
            </p>
            <div className="w-full flex items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)]">
              <span className="font-bold">Khám phá {totalWords} từ</span>
              <Link href="/library" className="btn-brutal bg-[var(--yellow)] text-[var(--ink)]">
                Vào thư viện
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
