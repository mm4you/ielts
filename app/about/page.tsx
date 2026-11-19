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
import StudyBackdrop from '@/components/StudyBackdrop';
import { engValues } from '@/lib/eng-values';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Giới thiệu | IELTS Vocab',
  description: 'Tìm hiểu IELTS Vocab và ENG, câu lạc bộ học thuật tiếng Anh kết nối những người muốn cùng học và thực hành.',
};

const activities = [
  { icon: BookOpenRegular, title: 'Chọn nhóm từ muốn học', detail: 'Lọc thư viện theo chủ đề và cấp độ. Lưu những từ bạn muốn học vào bộ sưu tập riêng hoặc chọn một bộ IELTS có sẵn để luyện theo chặng.' },
  { icon: ArrowRepeatAllRegular, title: 'Ôn lại khi đến hạn', detail: 'Thử nhớ nghĩa trước khi lật flashcard. Mục Học tiếp đưa bạn về thẻ đến hạn, từ từng trả lời sai hoặc chặng đang học dở.' },
  { icon: GamesRegular, title: 'Thử lại trong trò chơi', detail: 'Nghe rồi gõ với Ong Chính Tả, nhìn nghĩa tiếng Việt với Mưa Từ Vựng hoặc rủ bạn vào phòng thi đấu. Sau lượt luyện, bạn có thể xem lại những từ làm sai.' },
];

const practiceFormats = [
  { name: 'Nghe và viết lại', detail: 'Ong Chính Tả giúp bạn đối chiếu âm với cách viết. Nghe từ, gõ đáp án rồi xem từ đúng để nhận ra phần dễ nhầm.' },
  { name: 'Nhớ từ từ nghĩa tiếng Việt', detail: 'Mưa Từ Vựng cho bạn nhìn nghĩa và tự gõ từ tiếng Anh. Hợp với lúc bạn hiểu nghĩa khi đọc nhưng chưa tự nhớ được từ để dùng.' },
  { name: 'Dùng từ trong câu', detail: 'Ghép cụm từ giúp bạn nhận ra những từ thường đi cùng nhau. Điền từ theo ngữ cảnh giúp bạn chọn cách diễn đạt phù hợp với cả câu.' },
  { name: 'Luyện cùng bạn bè', detail: 'Trong phòng thi đấu, chủ phòng chọn cách chơi và thời lượng, rồi chia sẻ mã phòng. Sau trận, người chơi có thể xem kết quả và luyện lại những từ cần ôn.' },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pagePattern} aria-hidden="true">
        <div><StudyBackdrop patternId="about-study-top" /></div>
        <div><StudyBackdrop patternId="about-study-bottom" /></div>
      </div>
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
            <h1>Học từ vựng IELTS cùng bạn bè</h1>
            <p className={styles.lead}>Tìm nhóm từ bạn cần, ôn lại bằng flashcard và thử dùng từ trong câu, trò chơi hoặc một trận cùng bạn bè.</p>
            <Link className="btn-brutal" href="/">Mở IELTS Vocab <ArrowRightRegular aria-hidden="true" /></Link>
          </div>
          <div className={styles.signature}><EngCredit variant="about" /></div>
        </header>

        <section className={styles.story} aria-labelledby="about-project">
          <h2 id="about-project">Vì sao có IELTS Vocab?</h2>
          <p>Bạn có thể nhận ra một từ trong bài đọc nhưng lại quên nó khi viết, hoặc hiểu nghĩa khi nghe mà vẫn chưa chắc cách đánh vần. IELTS Vocab giúp bạn quay lại cùng một nhóm từ qua nhiều cách luyện, từ đọc ví dụ và lật thẻ đến tự gõ đáp án.</p>
          <p>Nếu đang học một chủ đề cho IELTS, hãy tạo bộ sưu tập từ thư viện để giữ các từ liên quan ở cùng một chỗ. Nếu muốn có sẵn trình tự để bắt đầu, chọn một bộ IELTS theo chặng. Khi trở lại, mục <strong>Học tiếp</strong> giúp bạn tìm các thẻ đến hạn, từ sai cần ôn hoặc chặng đang học dở.</p>
        </section>

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

        <section className={styles.formats} aria-labelledby="about-formats">
          <h2 id="about-formats">Chọn cách luyện theo điều bạn hay nhầm</h2>
          <dl>
            {practiceFormats.map(({ name, detail }) => (
              <div key={name}><dt>{name}</dt><dd>{detail}</dd></div>
            ))}
          </dl>
        </section>

        <section className={styles.example} aria-labelledby="about-example">
          <div>
            <h2 id="about-example">Thử một lượt với chủ đề Môi trường</h2>
            <ol>
              <li><strong>Chọn từ.</strong> Lọc chủ đề Môi trường trong Thư viện và lưu những từ bạn muốn ôn cùng nhau.</li>
              <li><strong>Tự nhớ.</strong> Đọc câu ví dụ, đoán nghĩa rồi thử đặt một câu về nơi bạn sống. Khi ôn flashcard, tự nhắc lại nghĩa trước khi lật thẻ.</li>
              <li><strong>Quay lại.</strong> Xem mục Học tiếp khi đăng nhập lần sau. Nếu một từ vẫn hay nhầm, ưu tiên ôn lại từ đó trước khi thêm từ mới.</li>
            </ol>
          </div>
          <figure className={styles.note}>
            <figcaption>Từ minh họa</figcaption>
            <p className={styles.noteWord} lang="en">sustainable</p>
            <p>bền vững</p>
            <blockquote lang="en">The city is investing in more sustainable public transport.</blockquote>
            <p>Thành phố đang đầu tư vào phương tiện giao thông công cộng bền vững hơn.</p>
          </figure>
        </section>

        <section className={styles.club} id="eng" aria-labelledby="about-eng">
          <div className={styles.clubCopy}>
            <h2 id="about-eng">Về câu lạc bộ ENG</h2>
            <p>ENG là câu lạc bộ học thuật tiếng Anh, nơi những người yêu thích tiếng Anh có thể gặp gỡ, chia sẻ cách học và thực hành cùng nhau.</p>
            <p>IELTS Vocab do một thành viên Ban Chủ nhiệm ENG thực hiện. Bạn có thể dùng một bộ từ để tự ôn, rồi dùng phòng thi đấu để luyện cùng nhóm. Nếu muốn tìm hiểu thêm về câu lạc bộ và các hoạt động của ENG, bạn có thể xem fanpage.</p>
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
