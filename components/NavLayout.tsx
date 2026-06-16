'use client';

import Header from '@/components/Header';

export default function NavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 pt-24 pb-10">{children}</main>
    </div>
  );
}