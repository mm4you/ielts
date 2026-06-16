'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col pb-16 md:pb-0">
      <Header />
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-10 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}