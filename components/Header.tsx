"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useSession, signIn, signOut } from "next-auth/react";
import Image from 'next/image';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { 
      href: '/', 
      label: 'Nhà', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
    { 
      href: '/review', 
      label: 'Ôn tập', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    },
    { 
      href: '/swipe', 
      label: 'Lọc thẻ', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    },
    { 
      href: '/speedrun', 
      label: 'Tốc chiến', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    { 
      href: '/library', 
      label: 'Thư viện', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-[var(--paper)] border-b-[3px] border-[var(--line)] z-20 shadow-[0_4px_0_var(--line)]">
        <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center group transition-transform hover:-translate-y-0.5">
            <Image 
              src="/logo.png" 
              alt="IELTS Vocab Logo" 
              width={140} 
              height={40} 
              className="object-contain h-10 w-auto" 
              priority 
            />
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
            {session ? (
              <div className="flex items-center gap-4 border-l-2 border-dashed border-[var(--line)] pl-4">
                <span className="text-sm font-bold truncate max-w-[100px]" title={session.user?.email || ''}>{session.user?.name || 'User'}</span>
                {(session.user as any)?.role === 'admin' && (
                  <Link href="/admin" className="bg-[var(--yellow)] text-[var(--ink)] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[var(--line)] hover:-translate-y-0.5 transition-transform">
                    ADMIN
                  </Link>
                )}
                <button onClick={() => signOut()} className="btn-brutal bg-[var(--red)] text-white text-xs px-3 py-1.5 uppercase hover:translate-y-0.5">Đăng xuất</button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l-2 border-dashed border-[var(--line)] pl-4">
                <button onClick={() => signIn('google')} className="btn-brutal bg-[var(--blue)] text-white text-xs px-4 py-1.5 uppercase hover:translate-y-0.5 whitespace-nowrap shadow-[2px_2px_0_var(--blue)]">
                  Đăng nhập
                </button>
              </div>
            )}
          </div>

          {/* Mobile Theme Toggle (Nav is at bottom) */}
          {/* Mobile Auth & Theme Toggle */}
          <div className="md:hidden flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[var(--yellow)] border-2 border-[var(--line)] flex items-center justify-center font-bold text-[var(--ink)] text-xs shadow-[2px_2px_0_var(--line)]">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
                {(session.user as any)?.role === 'admin' && (
                  <Link href="/admin" className="text-xs font-bold text-[var(--blue)] underline">Admin</Link>
                )}
                <button onClick={() => signOut()} className="text-xs font-bold underline text-[var(--red)]">Thoát</button>
              </div>
            ) : (
              <button onClick={() => signIn('google')} className="btn-brutal bg-[var(--blue)] text-white text-[10px] px-2 py-1 uppercase shadow-[2px_2px_0_var(--blue)]">
                Đăng nhập
              </button>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--paper)] border-t-[3px] border-[var(--line)] z-30 pb-safe shadow-[0_-4px_0_var(--line)]">
        <div className="flex items-center justify-between h-[72px] px-2 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 h-full transition-all ${
                  isActive 
                    ? 'text-[var(--blue)] -translate-y-1' 
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:-translate-y-0.5'
                }`}
              >
                <div className={`relative ${isActive ? 'drop-shadow-md' : ''}`}>
                  {item.icon}
                  {isActive && <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[var(--blue)] rounded-full"></div>}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
