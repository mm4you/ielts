import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const navItems = [
    { href: '/', label: 'Trang chủ' },
    { href: '/review', label: 'Ôn tập' },
    { href: '/swipe', label: 'Lọc thẻ' },
    { href: '/speedrun', label: 'Tốc chiến' },
    { href: '/library', label: 'Thư viện' },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-[var(--paper)] border-b-[3px] border-[var(--line)] z-20 shadow-[0_4px_0_var(--line)]">
        <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-2xl font-bold font-serif tracking-tight text-[var(--ink)] flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-6 h-6 bg-[var(--blue)] border-2 border-[var(--line)] rounded-md transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-[var(--yellow)] border-2 border-[var(--line)] rounded-md"></div>
            </div>
            <span className="group-hover:text-[var(--blue)] transition-colors">IELTS Vocab</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-[var(--ink)] hover:text-[var(--blue)] transition-colors uppercase tracking-wide"
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>

          {/* Mobile Theme Toggle (Nav is at bottom) */}
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--paper)] border-t-[3px] border-[var(--line)] z-30 pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex justify-center text-xs font-bold text-[var(--ink)] hover:text-[var(--blue)] uppercase tracking-wide py-2"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
