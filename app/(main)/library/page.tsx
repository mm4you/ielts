'use client';

import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';
import Card from '@/components/Card';
import RecentWordsList from './RecentWordsList';
import { Button, Skeleton, SkeletonItem } from '@fluentui/react-components';

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
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
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
    const controller = new AbortController();
    const fetchWords = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedTopic) params.set('topic', selectedTopic);
        if (selectedLevel) params.set('level', selectedLevel);
        params.set('page', currentPage.toString());
        params.set('limit', '30');

        const res = await fetch(`/api/words?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) throw new Error('Could not load vocabulary');
        const data = await res.json();
        setWords(data.words || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } catch (error) {
        if (!controller.signal.aborted) setLoadError('Chưa tải được từ vựng. Thử lại sau.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchWords();
    return () => controller.abort();
  }, [search, selectedTopic, selectedLevel, currentPage, retryKey]);

  return (
    <div>
      <div className="mb-8 border-b border-[var(--line)] pb-4">
        <div className="flex items-start justify-between w-full gap-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-semibold font-sans leading-tight">Thư viện từ vựng</h1>
            <span className="inline-block text-sm md:text-base text-[var(--ink)] font-semibold bg-[var(--paper)] px-3 py-1 rounded-full border border-[var(--line)] whitespace-nowrap shrink-0 self-start sm:self-auto">
              {totalCount} từ
            </span>
          </div>
          <Link
            href="/"
            className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm md:text-base select-none mt-1"
            title="Về Trang Chủ"
           aria-label="Về Trang Chủ">
            <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></Link>
        </div>
        <p className="text-[var(--muted)] mt-2">Khám phá và tra cứu toàn bộ từ vựng trong hệ thống.</p>
      </div>

      <RecentWordsList />

      <div className="panel library-filters">
        <label>Từ khóa<input type="search" placeholder="Tìm từ vựng" value={search} onChange={e=>{setSearch(e.target.value);setCurrentPage(1);}} /></label>
        <label>Chủ đề<select value={selectedTopic} onChange={e=>{setSelectedTopic(e.target.value);setCurrentPage(1);}}><option value="">Tất cả chủ đề</option>{TOPICS.map(topic=><option key={topic} value={topic}>{TOPIC_LABELS[topic]}</option>)}</select></label>
        <label>Cấp độ<select value={selectedLevel} onChange={e=>{setSelectedLevel(e.target.value);setCurrentPage(1);}}><option value="">Tất cả cấp độ</option>{LEVELS.map(level=><option key={level} value={level}>{level}</option>)}</select></label>
      </div>

      {loading ? (
        <Skeleton className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Đang tải từ vựng"><SkeletonItem className="word-skeleton" /><SkeletonItem className="word-skeleton" /><SkeletonItem className="word-skeleton" /><SkeletonItem className="word-skeleton" /><SkeletonItem className="word-skeleton" /><SkeletonItem className="word-skeleton" /></Skeleton>
      ) : loadError ? (
        <div className="panel empty-state" role="alert"><p>{loadError}</p><Button onClick={() => setRetryKey(value => value + 1)}>Thử lại</Button></div>
      ) : words.length === 0 ? (
        <div className="panel empty-state">
          <h2>Không tìm thấy từ phù hợp</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc.</p><Button onClick={() => { setSearch(''); setSelectedLevel(''); setSelectedTopic(''); setCurrentPage(1); }}>Xóa bộ lọc</Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {words.map((word) => (
              <Card key={word.id} word={word} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-16 bg-[var(--paper)] p-5 border border-[var(--line)] rounded-2xl w-full">
              <p className="text-sm font-semibold text-[var(--muted)]">
                Hiển thị từ <span className="text-[var(--ink)] font-semibold">{(currentPage - 1) * 30 + 1}</span> - <span className="text-[var(--ink)] font-semibold">{Math.min(currentPage * 30, totalCount)}</span> trên <span className="text-[var(--ink)] font-semibold">{totalCount}</span> từ vựng
              </p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {/* Prev Button */}
                <button
                  disabled={currentPage === 1 || loading}
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Trang trước"
                >
                  &lt;
                </button>

                {/* Page Numbers */}
                {getPageNumbers().map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`dots-${idx}`} className="w-10 h-10 flex items-center justify-center font-semibold text-[var(--muted)]">
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
                      className={`w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold transition-all cursor-pointer ${ isCurrent ? 'bg-[var(--blue)] text-white ' : 'bg-[var(--bg)] text-[var(--ink)] hover:bg-[var(--yellow)]/10' }`}
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
                  className="w-10 h-10 flex items-center justify-center border border-[var(--line)] rounded-lg font-semibold bg-[var(--bg)] text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
    <Suspense fallback={<AppLoading contained />}>
      <LibraryContent />
    </Suspense>
  );
}
