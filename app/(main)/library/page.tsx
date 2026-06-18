'use client';

import { useState, useEffect } from 'react';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';
import Card from '@/components/Card';
import RecentWordsList from '@/components/RecentWordsList';

export default function LibraryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    // Reset to page 1 whenever filters change
    setCurrentPage(1);
  }, [search, selectedTopic, selectedLevel]);

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
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-bold font-serif">Thư viện từ vựng</h1>
            <span className="text-xl text-[var(--ink)] font-bold bg-[var(--paper)] px-3 py-1 rounded-full border-2 border-[var(--line)]">
              {totalCount} từ
            </span>
          </div>
          <p className="text-[var(--muted)]">Khám phá và tra cứu toàn bộ từ vựng trong hệ thống.</p>
        </div>
      </div>

      <RecentWordsList />

      <div className="panel mb-8 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Tìm kiếm từ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 border-[3px] border-[var(--line)] rounded-xl bg-[var(--paper)] focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_var(--line)] transition-shadow font-bold"
        />

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
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
          onChange={(e) => setSelectedLevel(e.target.value)}
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
            <div className="flex justify-center items-center gap-4 mt-12 bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-xl max-w-md mx-auto">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => {
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-brutal bg-[var(--bg)] text-[var(--ink)] px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                ◀ Trang trước
              </button>
              <span className="font-bold text-base text-[var(--ink)]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => {
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn-brutal bg-[var(--bg)] text-[var(--ink)] px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                Trang sau ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}