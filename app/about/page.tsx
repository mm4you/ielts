import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import { ArrowUpRightRegular } from '@fluentui/react-icons/svg/arrow-up-right';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { ArrowRepeatAllRegular } from '@fluentui/react-icons/svg/arrow-repeat-all';
import BrandMark from '@/components/BrandMark';
import EngCredit from '@/components/EngCredit';
import Footer from '@/components/Footer';
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

const engValues = [
  { name: 'Education', meaning: 'Giáo dục' },
  { name: 'Enlightenment', meaning: 'Khai mở nhận thức' },
  { name: 'Evolution', meaning: 'Không ngừng phát triển' },
  { name: 'Empowerment', meaning: 'Trao quyền' },
  { name: 'Exploration', meaning: 'Khám phá' },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/"><BrandMark size={32} /> IELTS Vocab</Link>
        <nav className={styles.navigation} aria-label="Trên trang Giới thiệu">
          <a href="#cach-hoc">Cách học</a>
          <a href="#eng">Về ENG</a>
        </nav>
      </header>
      <main className={styles.content} id="main-content">
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>Giới thiệu IELTS Vocab</p>
            <h1>Học từ mới.<br /><em>Nhớ lâu hơn.</em></h1>
            <p className={styles.lead}>Chọn bộ từ hợp với mục tiêu IELTS của bạn, luyện một chút mỗi ngày và ôn lại đúng lúc.</p>
            <Link className="btn-primary" href="/">Mở IELTS Vocab <ArrowRightRegular aria-hidden="true" /></Link>
          </div>
          <div className={styles.art}>
            <Image
              src="/about-study.webp"
              alt=""
              fill
              preload
              sizes="(max-width: 700px) 92vw, (max-width: 1160px) 46vw, 520px"
            />
          </div>
        </header>

        <section className={styles.learning} id="cach-hoc" aria-labelledby="about-learning">
          <h2 id="about-learning">Bạn có thể học gì ở đây?</h2>
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
          <div className={styles.clubBrand}><EngCredit variant="about" /></div>
          <div className={styles.clubCopy}>
            <h2 id="about-eng">Gặp gỡ ENG</h2>
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
