import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeftRegular } from '@fluentui/react-icons/svg/arrow-left';
import { MailRegular } from '@fluentui/react-icons/svg/mail';
import BrandMark from '@/components/BrandMark';
import Footer from '@/components/Footer';
import { PRIVACY_CONTACT, VOICE_CONSENT_PURPOSE } from '@/lib/privacy';
import styles from './privacy.module.css';

export const metadata: Metadata = {
  title: 'Quyền riêng tư | IELTS Vocab',
  description: 'Cách IELTS Vocab sử dụng dữ liệu và cách liên hệ về dữ liệu cá nhân của bạn.',
};

const sections = [
  { id: 'tai-khoan', label: 'Tài khoản và phiên đăng nhập' },
  { id: 'hoc-tap', label: 'Tiến độ và nội dung chia sẻ' },
  { id: 'ghi-am', label: 'Ghi âm phát âm' },
  { id: 'gop-y', label: 'Góp ý và hỗ trợ' },
  { id: 'luu-tru', label: 'Lưu giữ dữ liệu' },
  { id: 'yeu-cau', label: 'Yêu cầu về dữ liệu' },
];

const contactHref = 'mailto:' + PRIVACY_CONTACT + '?subject=' + encodeURIComponent('IELTS Vocab – Yêu cầu về dữ liệu');

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <main className={styles.shell} id="main-content">
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="IELTS Vocab, về trang chủ"><BrandMark size={32} /> IELTS Vocab</Link>
          <Link className={styles.back} href="/"><ArrowLeftRegular aria-hidden="true" /> Về trang chủ</Link>
        </header>

        <div className={styles.hero}>
          <h1>Quyền riêng tư</h1>
          <p>IELTS Vocab dùng dữ liệu để bạn đăng nhập, lưu tiến độ và sử dụng các tính năng bạn chọn. Trang này giải thích dữ liệu nào được dùng, khi nào được chia sẻ và cách bạn có thể gửi yêu cầu.</p>
          <a className="btn-brutal" href="#yeu-cau"><MailRegular aria-hidden="true" /> Gửi yêu cầu về dữ liệu</a>
        </div>

        <div className={styles.layout}>
          <nav className={styles.contents} aria-labelledby="privacy-contents">
            <h2 id="privacy-contents">Trên trang này</h2>
            <ul>{sections.map(({ id, label }) => <li key={id}><a href={'#' + id}>{label}</a></li>)}</ul>
          </nav>

          <article className={styles.details} aria-label="Thông tin quyền riêng tư">
            <section id="tai-khoan">
              <h2>Tài khoản và phiên đăng nhập</h2>
              <dl className={styles.facts}>
                <div><dt>Tạo tài khoản bằng email</dt><dd>Tên hiển thị dùng cho hồ sơ. Email giúp tìm đúng tài khoản khi đăng nhập và nhận mã khi xác minh hoặc đặt lại mật khẩu. Hệ thống lưu mật khẩu dưới dạng đã băm để kiểm tra mật khẩu bạn nhập.</dd></div>
                <div><dt>Đăng nhập bằng Google</dt><dd>Nếu bạn chọn cách này, IELTS Vocab nhận tên, email, ảnh hồ sơ và thông tin liên kết cần thiết để nhận ra tài khoản trong những lần đăng nhập sau.</dd></div>
                <div><dt>Cookie của phiên</dt><dd>Trình duyệt gửi cookie phiên khi bạn mở trang hoặc thực hiện thao tác cần đăng nhập. Cookie giúp hệ thống nhận ra phiên của bạn mà không yêu cầu nhập lại mật khẩu trên mỗi trang.</dd></div>
                <div><dt>Giới hạn lượt gửi</dt><dd>Một số biểu mẫu như đăng ký và góp ý dùng địa chỉ IP để hạn chế gửi liên tục trong thời gian ngắn.</dd></div>
              </dl>
            </section>

            <section id="hoc-tap">
              <h2>Tiến độ và nội dung chia sẻ</h2>
              <ul className={styles.bullets}>
                <li><strong>Tiến độ học.</strong> Hệ thống gắn từ đã lưu, lượt ôn, kết quả luyện và từ từng trả lời sai với tài khoản. Những thông tin này giúp hiện thẻ đến hạn, gợi ý Học tiếp và mở lại các câu cần ôn.</li>
                <li><strong>Bộ sưu tập.</strong> Bộ mới mặc định là riêng tư. Khi bạn đặt bộ ở chế độ công khai, người khác có thể xem nội dung bộ từ. Bạn có thể kiểm tra hoặc đổi chế độ chia sẻ trong Bộ sưu tập.</li>
                <li><strong>Phòng thi đấu.</strong> Người trong phòng có thể thấy biệt danh và điểm trên bảng xếp hạng. Hệ thống dùng mã phòng để mở đúng phòng và lưu kết quả theo lượt. Bạn có thể dùng biệt danh khác tên thật và tránh đưa thông tin riêng vào tên phòng.</li>
              </ul>
            </section>

            <section id="ghi-am">
              <h2>Ghi âm phát âm</h2>
              <dl className={styles.facts}>
                <div><dt>Khi bạn ghi âm</dt><dd>Sau khi bạn cho phép dùng micro, trình duyệt giữ bản thu để bạn nghe lại, thu lại hoặc bỏ. Bạn có thể nghe từ mẫu mà không cần gửi bản thu.</dd></div>
                <div><dt>Khi bạn chọn gửi</dt><dd>Nút <strong>Đồng ý gửi Groq để nhận diện</strong> gửi bản thu từ trình duyệt đến IELTS Vocab để xử lý theo mục đích sau. {VOICE_CONSENT_PURPOSE}</dd></div>
                <div><dt>Sau khi nhận diện</dt><dd>IELTS Vocab dùng phần chữ được nhận diện để đối chiếu với từ mẫu và trả phản hồi. Khi bật tính năng lưu xác nhận, hệ thống ghi lại tài khoản, thời điểm và nội dung xác nhận khi gửi.</dd></div>
              </dl>
            </section>

            <section id="gop-y">
              <h2>Góp ý và hỗ trợ</h2>
              <p>Biểu mẫu gửi loại góp ý, nội dung bạn nhập và thông tin liên hệ nếu có qua email cho đội vận hành. Bạn có thể để trống thông tin liên hệ hoặc chủ động để lại email hay số điện thoại nếu muốn nhận phản hồi.</p>
              <p>Khi báo lỗi, hãy nêu trang gặp lỗi, thao tác vừa thực hiện và thông báo bạn thấy. Bạn có thể che hoặc bỏ những thông tin riêng tư xuất hiện trong nội dung gửi.</p>
            </section>

            <section id="luu-tru">
              <h2>Lưu giữ dữ liệu</h2>
              <p>Tiến độ và lịch sử học gắn với tài khoản để bạn có thể xem lại sau khi đăng nhập. Phòng thi đấu có thời điểm hết hạn riêng. Ở bản triển khai có bật tác vụ dọn phòng, phòng được đưa vào diện dọn sau khi hết hạn ít nhất 24 giờ.</p>
              <p>Nếu muốn biết thời hạn lưu của một loại dữ liệu hoặc muốn yêu cầu xóa, hãy cho đội vận hành biết bạn đang hỏi về hồ sơ, lịch sử học, phòng thi đấu, bản thu hay nội dung góp ý.</p>
            </section>

            <section id="yeu-cau">
              <h2>Yêu cầu về dữ liệu</h2>
              <p>Bạn có thể yêu cầu xem, nhận bản sao, chỉnh sửa, xóa, hạn chế xử lý hoặc rút lại sự đồng ý đã cấp.</p>
              <ol className={styles.bullets}>
                <li><strong>Nêu yêu cầu.</strong> Ví dụ, bạn muốn nhận bản sao lịch sử học, sửa tên hiển thị hoặc hỏi về dữ liệu liên quan đến một bản thu.</li>
                <li><strong>Cung cấp thông tin đủ để tìm.</strong> Gửi từ email gắn với tài khoản. Nếu liên quan đến một lượt chơi hoặc một bản thu, có thể ghi ngày gần đúng và tên tính năng.</li>
                <li><strong>Xác minh nếu được yêu cầu.</strong> Đội vận hành có thể đề nghị xác minh danh tính trước khi xử lý. Người đại diện hợp pháp có thể dùng cùng địa chỉ liên hệ để gửi yêu cầu thay mặt trẻ.</li>
              </ol>
              <p>Vui lòng tránh gửi mật khẩu hoặc giấy tờ tùy thân trong email đầu tiên.</p>
              <a className={styles.email} href={contactHref}><MailRegular aria-hidden="true" /> {PRIVACY_CONTACT}</a>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
