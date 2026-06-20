'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-16 md:pb-0">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <Header />
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12 pt-24 pb-10 flex-1 relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}