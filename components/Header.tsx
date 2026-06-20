"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGamesPopupOpen, setIsGamesPopupOpen] = useState(false);

  const navItems = [
    { 
      href: '/', 
      label: 'Nhà', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
    { 
      href: '/library', 
      label: 'Thư viện', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
    },
    { 
      href: '/collections', 
      label: 'Bộ sưu tập', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    },
    { 
      href: '/review', 
      label: 'Ôn tập', 
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    },
  ];

  const gameItems = [
    { 
      href: '/speedrun', 
      label: 'Tốc chiến', 
      colorClass: 'bg-[var(--red)] text-white',
      hoverClass: 'hover:bg-[var(--red)] hover:text-white',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
    { 
      href: '/blockblast', 
      label: 'Xếp hình', 
      colorClass: 'bg-[#8b5cf6] text-white',
      hoverClass: 'hover:bg-[#8b5cf6] hover:text-white',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    },
    { 
      href: '/sniper', 
      label: 'Thiện xạ', 
      colorClass: 'bg-[var(--ink)] text-[var(--paper)]',
      hoverClass: 'hover:bg-[var(--ink)] hover:text-[var(--paper)]',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
    },
    { 
      href: '/match', 
      label: 'Lật thẻ', 
      colorClass: 'bg-[var(--blue)] text-white',
      hoverClass: 'hover:bg-[var(--blue)] hover:text-white',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 00-2 2h8a2 2 0 002-2v-2" /></svg>
    },
    { 
      href: '/pronounce-challenge', 
      label: 'AI Mỏ Hỗn', 
      colorClass: 'bg-[#ff3b30] text-white',
      hoverClass: 'hover:bg-[#ff3b30] hover:text-white',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
    },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-[var(--paper)] border-b-[3px] border-[var(--line)] z-20 shadow-[0_4px_0_var(--line)]">
        <nav className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl md:text-2xl font-bold font-serif tracking-tight text-[var(--ink)] flex items-center gap-2 group shrink-0">
            <div className="relative w-9 h-9 sm:w-8 sm:h-8">
              <div className="absolute top-0 left-0 w-6 h-6 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-[var(--blue)] border-2 border-[var(--line)] rounded-md sm:rounded-sm md:rounded-md transition-transform group-hover:-translate-y-1 group-hover:-translate-x-1"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-[var(--yellow)] border-2 border-[var(--line)] rounded-md sm:rounded-sm md:rounded-md flex items-center justify-center">
                <span className="text-[10px] sm:text-[8px] md:text-[10px] font-black font-serif text-[var(--ink)] leading-none -mt-px">V</span>
              </div>
            </div>
            <span className="hidden sm:inline group-hover:text-[var(--blue)] transition-colors whitespace-nowrap">IELTS Vocab</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs xl:text-sm font-bold transition-colors uppercase tracking-wide ${
                    isActive 
                      ? 'text-[var(--blue)] font-extrabold' 
                      : 'text-[var(--ink)] hover:text-[var(--blue)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Games Dropdown */}
            <div className="relative group py-2">
              <button 
                className={`text-xs xl:text-sm font-bold transition-colors uppercase tracking-wide flex items-center gap-1 cursor-pointer select-none ${
                  gameItems.some(item => pathname === item.href || pathname.startsWith(item.href))
                    ? 'text-[var(--blue)] font-extrabold'
                    : 'text-[var(--ink)] hover:text-[var(--blue)]'
                }`}
              >
                Trò chơi
              </button>
              
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-48 bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 flex flex-col gap-1">
                {gameItems.map((game) => {
                  const isGameActive = pathname === game.href || pathname.startsWith(game.href);
                  return (
                    <Link
                      key={game.href}
                      href={game.href}
                      className={`text-xs font-bold py-2 px-3 rounded-lg text-left transition-colors uppercase flex items-center gap-2 ${
                        isGameActive
                          ? game.colorClass
                          : `text-[var(--ink)] ${game.hoverClass}`
                      }`}
                    >
                      <span className="shrink-0 scale-75">
                        {game.icon}
                      </span>
                      <span>{game.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <ThemeToggle />
            {session ? (
              <div className="relative group border-l-2 border-dashed border-[var(--line)] pl-4 py-2 -my-2">
                <button className="w-9 h-9 rounded-full bg-[var(--yellow)] border-2 border-[var(--line)] flex items-center justify-center font-bold text-[var(--ink)] text-sm shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer select-none">
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-30 flex flex-col gap-2">
                  <div className="pb-2 border-b border-dashed border-[var(--line)] text-left">
                    <p className="font-extrabold text-sm text-[var(--ink)] truncate">{session.user?.name || 'User'}</p>
                    <p className="text-[10px] font-mono text-[var(--muted)] truncate">{session.user?.email || ''}</p>
                  </div>
                  
                  {(session.user as any)?.role === 'admin' && (
                    <Link 
                       href="/admin" 
                      className="text-xs font-bold text-[var(--ink)] bg-[var(--yellow)] hover:bg-yellow-400 border-2 border-[var(--line)] py-1.5 px-2 rounded-lg text-center shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      Trang Admin
                    </Link>
                  )}
                  
                  <button 
                    onClick={() => signOut()} 
                    className="w-full text-xs font-bold text-white bg-[var(--red)] border-2 border-[var(--line)] py-1.5 px-2 rounded-lg text-center shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l-2 border-dashed border-[var(--line)] pl-4">
                <button onClick={() => signIn('google')} className="btn-brutal bg-[var(--blue)] text-white text-xs px-4 py-1.5 uppercase hover:translate-y-0.5 whitespace-nowrap shadow-[2px_2px_0_var(--blue)]">
                  Đăng nhập
                </button>
              </div>
            )}
          </div>

          {/* Mobile Theme Toggle & Profile Dropdown */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle />
            {session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="w-9 h-9 rounded-full bg-[var(--yellow)] border-2 border-[var(--line)] flex items-center justify-center font-bold text-[var(--ink)] text-sm shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer select-none"
                >
                  {session.user?.name?.charAt(0).toUpperCase() || 'U'}
                </button>
                
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl p-3 z-30 flex flex-col gap-2">
                      <div className="pb-2 border-b border-dashed border-[var(--line)] text-left">
                        <p className="font-extrabold text-sm text-[var(--ink)] truncate">{session.user?.name || 'User'}</p>
                        <p className="text-[10px] font-mono text-[var(--muted)] truncate">{session.user?.email || ''}</p>
                      </div>
                      
                      {(session.user as any)?.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          onClick={() => setIsProfileOpen(false)}
                          className="text-xs font-bold text-[var(--ink)] bg-[var(--yellow)] hover:bg-yellow-400 border-2 border-[var(--line)] py-1.5 px-2 rounded-lg text-center shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                          Trang Admin
                        </Link>
                      )}
                      
                      <button 
                        onClick={() => { setIsProfileOpen(false); signOut(); }}
                        className="w-full text-xs font-bold text-white bg-[var(--red)] border-2 border-[var(--line)] py-1.5 px-2 rounded-lg text-center shadow-[2px_2px_0_var(--line)] hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button 
                onClick={() => signIn('google')} 
                className="btn-brutal bg-[var(--blue)] text-white text-xs px-3 py-1.5 uppercase hover:translate-y-0.5 whitespace-nowrap shadow-[2px_2px_0_var(--blue)]"
              >
                Đăng nhập
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--paper)] border-t-[3px] border-[var(--line)] z-30 shadow-[0_-4px_0_var(--line)] flex items-center justify-around h-16 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive ? 'text-[var(--blue)] font-extrabold scale-102' : 'text-[var(--ink)] opacity-80 hover:opacity-100'
              }`}
            >
              <div className={isActive ? 'text-[var(--blue)] scale-110 transition-transform' : 'text-[var(--ink)]'}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${isActive ? 'text-[var(--blue)]' : 'text-[var(--ink)]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        {/* Games Tab */}
        <button
          onClick={() => setIsGamesPopupOpen(!isGamesPopupOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all cursor-pointer select-none ${
            isGamesPopupOpen || gameItems.some(item => pathname === item.href || pathname.startsWith(item.href))
              ? 'text-[var(--blue)] font-extrabold'
              : 'text-[var(--ink)] opacity-80 hover:opacity-100'
          }`}
        >
          <div className={isGamesPopupOpen || gameItems.some(item => pathname === item.href || pathname.startsWith(item.href)) ? 'text-[var(--blue)] scale-110 transition-transform' : 'text-[var(--ink)]'}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.013 14H6m11 0h.01m-.01 0a1 1 0 110-2 1 1 0 010 2zm-12.013 4h12.013c1.1 0 1.987-.9 1.987-2V8c0-1.1-.887-2-1.987-2H4.987C3.887 6 3 6.9 3 8v8c0 1.1.887 2 1.987 2z" />
            </svg>
          </div>
          <span className={`text-[9px] font-black uppercase tracking-wider mt-0.5 ${
            isGamesPopupOpen || gameItems.some(item => pathname === item.href || pathname.startsWith(item.href))
              ? 'text-[var(--blue)]'
              : 'text-[var(--ink)]'
          }`}>
            Trò chơi
          </span>
        </button>
      </div>

      {/* Mobile Games Popup Drawer */}
      {isGamesPopupOpen && (
        <>
          {/* Overlay background */}
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-25" onClick={() => setIsGamesPopupOpen(false)} />
          
          {/* Popup sheet */}
          <div className="lg:hidden fixed bottom-20 left-4 right-4 bg-[var(--paper)] border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl p-4 z-30 flex flex-col gap-2 max-h-[60vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b-2 border-dashed border-[var(--line)] pb-2 mb-2">
              <span className="text-xs font-mono font-black text-[var(--muted)] uppercase tracking-widest">
                Khu Vui Chơi Luyện Phản Xạ
              </span>
              <button 
                onClick={() => setIsGamesPopupOpen(false)}
                className="w-6 h-6 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-md flex items-center justify-center text-xs shadow-[1.5px_1.5px_0_var(--line)]"
              >
                X
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {gameItems.map((game) => {
                const isGameActive = pathname === game.href || pathname.startsWith(game.href);
                return (
                  <Link
                    key={game.href}
                    href={game.href}
                    onClick={() => setIsGamesPopupOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--line)] shadow-[3px_3px_0_var(--line)] hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0_var(--line)] transition-all active:scale-95 ${
                      isGameActive
                        ? `${game.colorClass} border-[var(--line)]`
                        : 'bg-[var(--bg)] text-[var(--ink)] hover:bg-gray-100'
                    }`}
                  >
                    <div className="shrink-0 scale-90">
                      {game.icon}
                    </div>
                    <span className="text-xs font-black uppercase truncate">{game.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
