'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Word, TOPICS, LEVELS, TOPIC_LABELS } from '@/types';

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
      <h1 className="text-2xl font-bold mb-6">Thư viện từ vựng</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm kiếm từ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
        />

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-4 py-2 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
          className="px-4 py-2 border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
          <p className="text-[var(--muted)]">Đang tải...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted)]">Không tìm thấy từ nào</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {words.map((word) => (
            <Link
              key={word.id}
              href={`/word/${word.id}`}
              className="card hover:border-[var(--primary)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold">{word.word}</span>
                    {word.ipa && (
                      <span className="text-sm text-[var(--muted)]">{word.ipa}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-1 line-clamp-1">
                    {word.meaning_vi}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {word.level}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}