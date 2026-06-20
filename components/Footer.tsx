"use client";

import Link from 'next/link';
import { openFeedbackModal } from './FeedbackModal';

export default function Footer() {
  return (
    <footer className="hidden md:block border-t-[3px] border-[var(--line)] bg-[var(--paper)] mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex flex-col md:flex-row items-center justify-between text-sm font-bold text-[var(--muted)]">
        <p>
          © 2026 <span className="text-[var(--ink)]">IELTS Vocab</span>
          {' | '}
          <Link href="https://github.com/mm4you" target="_blank" rel="noopener noreferrer" className="text-[var(--ink)] hover:text-[var(--blue)] underline underline-offset-2 transition-colors font-black">
            GitHub
          </Link>
          {' | '}
          <button 
            onClick={() => openFeedbackModal()}
            className="text-[var(--ink)] hover:text-[var(--green)] underline underline-offset-2 transition-colors font-black cursor-pointer bg-transparent border-none p-0 inline font-sans"
          >
            Góp ý
          </button>
        </p>
        <p>Hệ thống Học & Thi Trắc Nghiệm Từ Vựng IELTS</p>
      </div>
    </footer>
  );
}
