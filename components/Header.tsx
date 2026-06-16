import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const navItems = [
    { href: '/', label: 'Trang chủ' },
    { href: '/review', label: 'Ôn tập' },
    { href: '/library', label: 'Thư viện' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/30 backdrop-blur-md border-b border-[var(--border)] z-20">
      <nav className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold text-[var(--primary)]">
          IELTS Vocab
        </Link>
        <div className="flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
