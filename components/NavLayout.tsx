'use client';

import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Trang chủ' },
  { href: '/review', label: 'Ôn tập' },
  { href: '/library', label: 'Thư viện' },
];

export default function NavLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <nav className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg border-b border-[var(--border)] z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-[var(--primary)]">
            IELTS Vocab
          </Link>
          <div className="flex gap-1 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-20 pt-24">
        {children}
      </main>
    </div>
  );
}