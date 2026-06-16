import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-[3px] border-[var(--line)] bg-[var(--paper)] mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-col md:flex-row items-center justify-between text-sm font-bold text-[var(--muted)]">
        <p>
          © 2026 GitHub:{' '}
          <Link href="https://github.com/mm4you" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:text-[var(--blue)] underline underline-offset-2 transition-colors">
            @mm4you
          </Link>
        </p>
        <p>Hệ thống Học & Thi Trắc Nghiệm Từ Vựng IELTS</p>
      </div>
    </footer>
  );
}
