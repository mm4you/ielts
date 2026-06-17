'use client';

import { useState, useEffect } from 'react';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';
import Card from '@/components/Card';
import RecentWordsList from '@/components/RecentWordsList';
import Link from 'next/link';

export default function LibraryPage() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    const fetchWords = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedTopic) params.set('topic', selectedTopic);
        if (selectedLevel) params.set('level', selectedLevel);

        const res = await fetch(`/api/words?${params.toString()}`);
        const data = await res.json();
        setWords(data);
      } catch (error) {
        console.error('Failed to fetch words:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWords();
  }, [search, selectedTopic, selectedLevel]);

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-4 mb-2">
            <h1 className="text-4xl font-bold font-serif">Thư viện từ vựng</h1>
            <span className="text-xl text-[var(--ink)] font-bold bg-[var(--paper)] px-3 py-1 rounded-full border-2 border-[var(--line)]">
              {words.length} từ
            </span>
          </div>
          <p className="text-[var(--muted)]">Khám phá và tra cứu toàn bộ từ vựng trong hệ thống.</p>
        </div>

        <Link 
          href="/pronounce-challenge" 
          className="btn-brutal bg-[#ff3b30] text-white px-6 py-3 shadow-[4px_4px_0_#8b0000] hover:shadow-[6px_6px_0_#8b0000] border-[#8b0000] flex items-center gap-2 font-black text-lg animate-pulse"
        >
          🎙️ THỬ THÁCH PHÁT ÂM AI
        </Link>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {words.map((word) => (
            <Card key={word.id} word={word} />
          ))}
        </div>
      )}
    </div>
  );
}