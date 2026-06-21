'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';
import Card from '@/components/Card';
import RecentWordsList from './RecentWordsList';

function LibraryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialTopic = searchParams.get('topic') || '';
  const initialLevel = searchParams.get('level') || '';

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedLevel, setSelectedLevel] = useState(initialLevel);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  };

  // Sync state changes to URL query parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedTopic) params.set('topic', selectedTopic);
    if (selectedLevel) params.set('level', selectedLevel);
    if (currentPage > 1) params.set('page', currentPage.toString());

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [search, selectedTopic, selectedLevel, currentPage, router, pathname]);

  // Fetch words based on filters & pagination
  useEffect(() => {
    const fetchWords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedTopic) params.set('topic', selectedTopic);
        if (selectedLevel) params.set('level', selectedLevel);
        params.set('page', currentPage.toString());
        params.set('limit', '30');

        const res = await fetch(`/api/words?${params.toString()}`);
        const data = await res.json();
        setWords(data.words || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        console.error('Failed to fetch words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [search, selectedTopic, selectedLevel, currentPage]);

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-4 border-[var(--line)] pb-4">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-bold font-serif">Thư viện từ vựng</h1>
            <span className="text-xl text-[var(--ink)] font-bold bg-[var(--paper)] px-3 py-1 rounded-full border-2 border-[var(--line)]">
              {totalCount} từ
            </span>
          </div>
          <p className="text-[var(--muted)]">Khám phá và tra cứu toàn bộ từ vựng trong hệ thống.</p>
        </div>
        <Link 
          href="/" 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm md:text-base self-start md:self-auto select-none"
          title="Về Trang Chủ"
        >
          X
        </Link>
      </div>

      <RecentWordsList />

      <div className="panel mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm từ..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1 px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold"
        />

        <select
          value={selectedTopic}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold appearance-none cursor-pointer"
        >
          <option value="">Tất cả chủ đề</option>
          {TOPICS.map((topic) => (
            <option key={topic} value={topic}>
              {TOPIC_LABELS[topic]}
            </option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold appearance-none cursor-pointer"
        >
          <option value="">Tất cả mức</option>
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted)] font-bold animate-pulse">Đang tải dữ liệu...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="panel text-center py-20">
          <p className="text-[var(--muted)] font-bold text-lg">Không tìm thấy từ nào phù hợp!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word) => (
              <Card key={word.id} word={word} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-16 bg-[var(--paper)] p-5 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl w-full">
              <p className="text-sm font-bold text-[var(--muted)]">
                Hiển thị từ <span className="text-[var(--ink)] font-black">{(currentPage - 1) * 30 + 1}</span> - <span className="text-[var(--ink)] font-black">{Math.min(currentPage * 30, totalCount)}</span> trên <span className="text-[var(--ink)] font-black">{totalCount}</span> từ vựng
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Prev Button */}
                <button
                  disabled={currentPage === 1 || loading}
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                  title="Trang trước"
                >
                  &lt;
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-bold text-[var(--muted)]">
                        ...
                      </span>
                    );
                  }

                  const isCurrent = p === currentPage;
                  return (
                    <button
                      key={`page-${p}`}
                      disabled={loading}
                      onClick={() => {
                        setCurrentPage(p as number);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--blue)] text-white shadow-[2px_2px_0_var(--line)]'
                          : 'bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] hover:bg-[var(--yellow)]/10'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  disabled={currentPage === totalPages || loading}
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 flex items-center justify-center border-2 border-[var(--line)] rounded-lg font-bold bg-[var(--bg)] text-[var(--ink)] shadow-[2px_2px_0_var(--line)] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--line)] active:translate-y-0.5 active:shadow-[1px_1px_0_var(--line)] transition-all cursor-pointer"
                  title="Trang sau"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <p className="text-[var(--muted)] font-bold animate-pulse">Đang tải thư viện...</p>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}