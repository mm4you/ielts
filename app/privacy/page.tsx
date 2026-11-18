import Link from 'next/link';
import { PRIVACY_CONTACT, VOICE_CONSENT_PURPOSE } from '@/lib/privacy';

export const metadata = { title: 'Quyền riêng tư | IELTS Vocab' };

export default function PrivacyPage() {
  return <main className="privacy-page">
    <Link href="/">Về IELTS Vocab</Link>
    <h1>Quyền riêng tư</h1>
    <p>Đội vận hành IELTS Vocab tiếp nhận yêu cầu về dữ liệu tại <a href={'mailto:' + PRIVACY_CONTACT}>{PRIVACY_CONTACT}</a>.</p>
    <h2>Dữ liệu dùng cho tài khoản và học tập</h2>
    <p>Chúng mình dùng tên hiển thị, email và mật khẩu đã băm để tạo, xác thực hoặc khôi phục tài khoản. Nếu bạn chọn Google, dịch vụ nhận thông tin hồ sơ và dữ liệu liên kết đăng nhập từ Google. Cookie phiên giữ trạng thái đăng nhập. Một số biểu mẫu dùng địa chỉ IP để giới hạn gửi liên tục.</p>
    <p>Tiến độ, lượt ôn, từ đã lưu và kết quả luyện giúp bạn học tiếp. Trong phòng thi đấu, thành viên thấy biệt danh và điểm của nhau. Hãy dùng biệt danh khi chơi và tránh đưa thông tin riêng vào tên phòng hay bộ từ chia sẻ.</p>
    <h2>Ghi âm và góp ý</h2>
    <p>{VOICE_CONSENT_PURPOSE} Bạn có thể nghe lại hoặc bỏ bản thu ngay trong trình duyệt. Bạn có thể bỏ qua bước gửi và tiếp tục nghe mẫu.</p>
    <p>Góp ý được chuyển qua email cho đội vận hành. Bạn có thể chủ động để lại email hoặc số điện thoại để nhận phản hồi.</p>
    <h2>Yêu cầu về dữ liệu</h2>
    <p>Bạn có thể yêu cầu xem, nhận bản sao, sửa, xóa, hạn chế xử lý hoặc rút lại sự đồng ý. Hãy gửi email từ địa chỉ gắn với tài khoản và nêu rõ yêu cầu. Đội vận hành có thể đề nghị xác minh trước khi xử lý. Người đại diện hợp pháp có thể dùng cùng đầu mối để thực hiện quyền của trẻ. Vui lòng tránh gửi mật khẩu hoặc giấy tờ qua email đầu tiên.</p>
    <p>Tiến độ học được giữ cùng tài khoản để bạn học tiếp. Nếu muốn biết thời hạn lưu của một loại dữ liệu cụ thể hoặc yêu cầu xóa, hãy liên hệ đội vận hành qua địa chỉ trên.</p>
  </main>;
}
