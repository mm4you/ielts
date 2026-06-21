import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginWall from './LoginWall';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import LeaderboardSidebar from '@/components/LeaderboardSidebar';

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    return <LoginWall />;
  }

  const totalWords = await prisma.word.count();
  
  let dueWords = 0;
  let collectionsCount = 0;
  let savedWordsCount = 0;
  if (session?.user?.id) {
    const today = new Date();
    const [dueCount, colCount, wordsCount] = await Promise.all([
      prisma.userProgress.count({
        where: { 
          userId: session.user.id,
          next_review_date: { lte: today },
          repetition_count: { gt: 0 }
        }
      }),
      prisma.collection.count({
        where: { userId: session.user.id }
      }),
      prisma.collectionWord.count({
        where: {
          collection: {
            userId: session.user.id
          }
        }
      })
    ]);
    dueWords = dueCount;
    collectionsCount = colCount;
    savedWordsCount = wordsCount;
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
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-[var(--ink)]">
              Lò Luyện Từ Vựng Khắc Nghiệt
            </h1>
          </div>
        </section>

        {/* Bố cục 2 cột: Học tập & Giải trí bên trái, Bảng xếp hạng bên phải */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột trái: Học tập & Giải trí */}
          <div className="lg:col-span-8 space-y-12">
            {/* Phần 1: Học Tập */}
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-black uppercase text-[var(--ink)] tracking-tight mb-2 border-b-[3px] border-dashed border-[var(--line)] pb-3">
                Học Tập
              </h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-4 -mx-4 px-4 scrollbar-none md:grid md:grid-cols-3 md:overflow-x-visible md:snap-none md:gap-6 md:pb-0 md:mx-0 md:px-0">
                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Học & Ôn tập</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1">
                    Ôn tập các từ vựng đến hạn bằng flashcard. Hệ thống tự tính thời điểm lặp lại tối ưu.
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-center min-[380px]:text-left">
                      {!session ? 'Cần đăng nhập' : (dueWords > 0 ? `${dueWords.toLocaleString('vi-VN')} thẻ cần ôn` : 'Đã ôn xong')}
                    </span>
                    <Link href="/review" className="btn-brutal bg-[var(--green)] text-white text-center w-full min-[380px]:w-auto select-none">
                      Bắt đầu
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--green)] shadow-[8px_8px_0_var(--green)] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--green)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2 text-[var(--green)]">Bộ Sưu Tập Của Tôi</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1">
                    Quản lý các danh mục từ vựng cá nhân. Tự tạo sổ tay từ khó, phân loại theo nhóm và luyện tập riêng biệt.
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[var(--green)] text-center min-[380px]:text-left">
                      {collectionsCount} sổ tay / {savedWordsCount} từ
                    </span>
                    <Link href="/collections" className="btn-brutal bg-[var(--green)] text-white text-center w-full min-[380px]:w-auto select-none">
                      Quản lý bộ
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--yellow)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2">Thư viện Từ điển</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1">
                    Tra cứu, tìm kiếm danh sách toàn bộ từ vựng theo chủ đề hoặc cấp độ (A1-C2).
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-center min-[380px]:text-left">Khám phá <span className="text-[var(--blue)]">{totalWords.toLocaleString('vi-VN')}</span> từ</span>
                    <Link href="/library" className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] text-center w-full min-[380px]:w-auto select-none">
                      Vào thư viện
                    </Link>
                  </div>
                </article>
              </div>
            </div>

            {/* Phần 2: Khu Vui Chơi Luyện Phản Xạ */}
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-black uppercase text-[var(--ink)] tracking-tight mb-2 border-b-[3px] border-dashed border-[var(--line)] pb-3">
                Khu Vui Chơi Luyện Phản Xạ
              </h2>
              
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-4 -mx-4 px-4 scrollbar-none md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:snap-none md:gap-6 md:pb-0 md:mx-0 md:px-0">
                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--red)] shadow-[8px_8px_0_var(--red)] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--red)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2 text-[var(--red)]">Sinh Tồn Tốc Chiến</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
                    45 giây sinh tồn đếm ngược. Bắn từ vô hạn. Trả lời đúng +2s. Sai bị trừ 3s. Hết giờ là GAME OVER!
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[var(--red)] text-center min-[380px]:text-left">Ép nhịp tim</span>
                    <Link href="/speedrun" className="btn-brutal bg-[var(--red)] text-white text-center w-full min-[380px]:w-auto select-none">
                      Chơi luôn
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--blue)] shadow-[8px_8px_0_var(--blue)] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2 text-[var(--blue)]">Lật Thẻ Tìm Cặp</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
                    Luyện trí nhớ hình ảnh bằng cách ghép cặp từ Tiếng Anh và nghĩa Tiếng Việt.
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[var(--blue)] text-center min-[380px]:text-left">Nhẹ nhàng</span>
                    <Link href="/match" className="btn-brutal bg-[var(--blue)] text-white text-center w-full min-[380px]:w-auto select-none">
                      Chơi ngay
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[#8b5cf6] shadow-[8px_8px_0_#8b5cf6] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b5cf6] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-bold mb-2 text-[#8b5cf6]">Block Blast</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
                    Xếp hình sinh tồn! Kéo thả gạch ăn điểm, trả lời từ vựng để mở khóa gạch mới.
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[#8b5cf6] text-center min-[380px]:text-left">Gây nghiện</span>
                    <Link href="/blockblast" className="btn-brutal bg-[#8b5cf6] text-white text-center w-full min-[380px]:w-auto select-none">
                      Xếp hình
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[var(--ink)] shadow-[8px_8px_0_var(--ink)] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ink)] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-black mb-2 text-[var(--ink)]">Thiện Xạ</h2>
                  <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
                    Bắn hạ từ vựng tiếng Anh đang bay với tốc độ cao để rèn luyện phản xạ.
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[var(--ink)] text-center min-[380px]:text-left">Căng não</span>
                    <Link href="/sniper" className="btn-brutal bg-[var(--ink)] text-[var(--paper)] text-center w-full min-[380px]:w-auto select-none">
                      Bắn ngay
                    </Link>
                  </div>
                </article>

                <article className="panel flex flex-col items-start relative overflow-hidden group hover:-translate-y-1 transition-transform border-[#ff3b30] shadow-[8px_8px_0_#ff3b30] snap-start shrink-0 w-[290px] sm:w-[320px] md:w-auto">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff3b30] rounded-bl-full opacity-10"></div>
                  <h2 className="text-2xl font-serif font-black mb-2 text-[#ff3b30] flex items-center gap-2">
                    AI Mỏ Hỗn
                    <span className="bg-yellow-400 text-black text-xs px-2 py-1 border-2 border-black rotate-[10deg] animate-bounce">BETA</span>
                  </h2>
                  <p className="text-[var(--muted)] mb-6 flex-1 font-bold">
                    Thử thách phát âm tiếng Anh. Đọc sai bị AI chửi xéo xắt, đọc đúng được bưng bô lên mây!
                  </p>
                  <div className="w-full flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between mt-auto pt-4 border-t-2 border-dashed border-[var(--line)] gap-2">
                    <span className="font-bold text-lg text-[#ff3b30] text-center min-[380px]:text-left">Hài hước</span>
                    <Link href="/pronounce-challenge" className="btn-brutal bg-[#ff3b30] text-white text-center w-full min-[380px]:w-auto select-none">
                      Khịa AI
                    </Link>
                  </div>
                </article>
              </div>
            </div>
          </div>

          {/* Cột phải: Bảng xếp hạng vinh danh (Sidebar) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <LeaderboardSidebar />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
