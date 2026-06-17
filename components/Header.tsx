"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      href: '/blockblast', 
      label: 'Xếp hình', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    { 
      href: '/sniper', 
      label: 'Thiện xạ', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-md border-2 border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-[0_0_0_var(--line)] transition-all"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Toggleable Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[64px] bg-[var(--bg)] z-30 overflow-y-auto pb-safe">
          <div className="p-4 flex flex-col gap-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`panel flex items-center gap-4 p-4 transition-all ${
                    isActive 
                      ? 'border-[var(--blue)] shadow-[4px_4px_0_var(--blue)] bg-[var(--paper)]' 
                      : 'hover:-translate-y-1 hover:shadow-[4px_4px_0_var(--ink)] bg-[var(--paper)] opacity-90'
                  }`}
                >
                  <div className={`${isActive ? 'text-[var(--blue)]' : 'text-[var(--ink)]'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-lg font-black uppercase tracking-wide ${isActive ? 'text-[var(--blue)]' : 'text-[var(--ink)]'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
