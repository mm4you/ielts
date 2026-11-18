import type { Metadata } from 'next';
import Link from 'next/link';
import EngCredit from '@/components/EngCredit';
import StudyBackdrop from '@/components/StudyBackdrop';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Giới thiệu | IELTS Vocab',
  description: 'Tìm hiểu về IELTS Vocab, dự án luyện từ vựng của một thành viên Ban Chủ nhiệm ENG.',
};

export default function AboutPage() {
  return (
    <div className="about-page">
      <StudyBackdrop />
      <main className="about-content" id="main-content">
        <Link className="back-link" href="/">Về IELTS Vocab</Link>
        <header className="about-heading">
          <h1>Giới thiệu IELTS Vocab</h1>
          <p>Một nơi để học từ mới, ôn lại đúng lúc và luyện cùng bạn bè.</p>
        </header>
        <EngCredit variant="about" />
        <section className="about-section" aria-labelledby="about-learning">
          <h2 id="about-learning">Bạn có thể học gì ở đây?</h2>
          <p>Chọn từ theo chủ đề và cấp độ, lưu vào bộ sưu tập rồi ôn lại bằng flashcard. Khi muốn đổi nhịp, bạn có thể nghe và gõ chính tả, luyện từ theo ngữ cảnh hoặc mời bạn bè vào phòng thi đấu.</p>
          <Link className="btn-primary about-cta" href="/">Mở IELTS Vocab</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
