import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import { ArrowUpRightRegular } from '@fluentui/react-icons/svg/arrow-up-right';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import BrandMark from '@/components/BrandMark';
import EngCredit from '@/components/EngCredit';
import Footer from '@/components/Footer';
import { engValues } from '@/lib/eng-values';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Giới thiệu | IELTS Vocab',
  description: 'Tìm hiểu IELTS Vocab và ENG, câu lạc bộ học thuật tiếng Anh kết nối những người muốn cùng học và thực hành.',
};

const activities = [
  { icon: BookOpenRegular, title: 'Chọn từ theo mục tiêu', detail: 'Tìm từ trong thư viện theo chủ đề và cấp độ, rồi lưu vào bộ sưu tập của bạn.' },
  { icon: ArrowRepeatAllRegular, title: 'Ôn khi đến hạn', detail: 'Dùng flashcard để nhớ lại từ đã học. Mục Học tiếp đưa bạn về đúng phần đang cần ôn.' },
  { icon: GamesRegular, title: 'Đổi nhịp bằng trò chơi', detail: 'Nghe và gõ với Ong Chính Tả, học từ trong ngữ cảnh hoặc mở phòng thi cùng bạn bè.' },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/"><BrandMark size={32} /> IELTS Vocab</Link>
        <nav className={styles.navigation} aria-label="Trên trang Giới thiệu">
          <a href="#eng">Về ENG</a>
          <a href="#cach-hoc">Cách học</a>
        </nav>
      </header>
      <main className={styles.content} id="main-content">
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>Học từ vựng IELTS cùng bạn bè</h1>
            <p className={styles.lead}>Chọn từ theo trình độ của bạn, ôn bằng flashcard và luyện cùng bạn bè ngay trên IELTS Vocab.</p>
            <Link className="btn-brutal" href="/">Mở IELTS Vocab <ArrowRightRegular aria-hidden="true" /></Link>
          </div>
          <EngCredit variant="about" />
        </header>

        <section className={styles.learning} id="cach-hoc" aria-labelledby="about-learning">
          <h2 id="about-learning">Cách học trên IELTS Vocab</h2>
          <ul className={styles.activities}>
            {activities.map(({ icon: Icon, title, detail }) => (
              <li key={title}>
                <span className={styles.activityIcon}><Icon aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{detail}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.club} id="eng" aria-labelledby="about-eng">
          <div className={styles.clubCopy}>
            <h2 id="about-eng">Về câu lạc bộ ENG</h2>
            <p>ENG là câu lạc bộ học thuật tiếng Anh, nơi những người yêu thích tiếng Anh có thể gặp gỡ, chia sẻ cách học và thực hành cùng nhau.</p>
            <a href="https://www.facebook.com/E4newgen" className={styles.clubLink}>
              Theo dõi ENG trên Facebook <ArrowUpRightRegular aria-hidden="true" />
            </a>
          </div>
          <div className={styles.values}>
            <h3>Triết lý cốt lõi của ENG</h3>
            <dl>
              {engValues.map(({ name, meaning }) => (
                <div key={name}>
                  <dt lang="en">{name}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
