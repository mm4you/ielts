import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-0 md:border-t-[3px] border-[var(--line)] bg-transparent md:bg-[var(--paper)] mt-auto w-full pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between text-xs md:text-sm font-bold text-[var(--muted)] gap-2 text-center md:text-left">
        <p>
          © 2026 <span className="text-[var(--ink)]">IELTS Vocab</span>
          {' | '}
          <Link href="https://github.com/mm4you" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:text-[var(--blue)] underline underline-offset-2 transition-colors font-black">
            GitHub
          </Link>
          {' | '}
          <Link href="https://www.facebook.com/agug103" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:text-[var(--green)] underline underline-offset-2 transition-colors font-black">
            Góp ý
          </Link>
        </p>
        <p>Hệ thống Học & Thi Trắc Nghiệm Từ Vựng IELTS</p>
      </div>
    </footer>
  );
}
