import Link from 'next/link';
import EngCredit from './EngCredit';

export default function Footer() {
  return (
    <footer className="app-footer">
      <EngCredit variant="footer" />
      <nav className="app-footer-links" aria-label="Liên kết chân trang">
        <Link href="/about">Giới thiệu</Link>
        <Link href="/privacy">Quyền riêng tư</Link>
        <Link href="https://ungnhutkhang.id.vn">Contact</Link>
      </nav>
    </footer>
  );
}
