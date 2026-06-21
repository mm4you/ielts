'use client';

import { useState, useEffect } from 'react';

interface LeaderboardUser {
  name: string;
  score: number;
}

interface LeaderboardData {
  blockblast: LeaderboardUser[];
  speedrun: LeaderboardUser[];
  sniper: LeaderboardUser[];
  mastered: LeaderboardUser[];
}

export default function LeaderboardSidebar() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [activeTab, setActiveTab] = useState<'blockblast' | 'speedrun' | 'sniper' | 'mastered'>('mastered');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Không thể tải bảng xếp hạng:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="panel p-6 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl bg-[var(--paper)] w-full h-[400px] animate-pulse flex flex-col justify-between">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="space-y-4 flex-1 mt-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  const currentList = data ? data[activeTab] : [];

  const tabLabels = {
    mastered: { label: 'Chăm chỉ', color: 'bg-[var(--green)]' },
    speedrun: { label: 'Tốc chiến', color: 'bg-[var(--red)]' },
    blockblast: { label: 'Xếp hình', color: 'bg-[#8b5cf6]' },
    sniper: { label: 'Thiện xạ', color: 'bg-[var(--ink)] text-[var(--paper)]' }
  };

  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-[var(--yellow)] text-[var(--ink)] border-[var(--line)] scale-105 shadow-[2px_2px_0_var(--line)]';
      case 1:
        return 'bg-gray-200 text-[var(--ink)] border-[var(--line)]';
      case 2:
        return 'bg-[#ffca28]/30 text-[var(--ink)] border-[var(--line)]';
      default:
        return 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]';
    }
  };

  return (
    <div className="panel p-6 border-[3px] border-[var(--line)] shadow-[6px_6px_0_var(--line)] rounded-2xl bg-[var(--paper)] w-full flex flex-col select-none">
      {/* Title */}
      <div className="flex items-center gap-2 mb-6 border-b-2 border-dashed border-[var(--line)] pb-3">
        <div className="w-9 h-9 bg-[var(--yellow)] border-2 border-[var(--line)] rounded-lg shadow-[1.5px_1.5px_0_var(--line)] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[var(--ink)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-black uppercase text-[var(--ink)]">Bảng Xếp Hạng</h3>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 mb-6 bg-[var(--bg)] p-1 rounded-xl border-2 border-[var(--line)]">
        {(Object.keys(tabLabels) as Array<keyof typeof tabLabels>).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 px-1 rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? `${tabLabels[tab].color} border-2 border-[var(--line)] shadow-[1px_1px_0_var(--line)] scale-102`
                : 'text-[var(--muted)] hover:text-[var(--ink)] bg-transparent border-2 border-transparent'
            }`}
          >
            {tabLabels[tab].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3.5 flex-1">
        {currentList.length === 0 ? (
          <div className="text-center py-10 font-bold text-sm text-[var(--muted)]">
            Chưa có dữ liệu xếp hạng...
          </div>
        ) : (
          currentList.map((user, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-3 border-2 rounded-xl transition-all ${getRankStyle(idx)}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Number Badge */}
                <span className="w-6 h-6 rounded-full border-2 border-[var(--line)] flex items-center justify-center text-xs font-black shrink-0 bg-[var(--paper)]">
                  {idx + 1}
                </span>

                {/* Avatar Icon */}
                <div className="w-8 h-8 rounded-full border-2 border-[var(--line)] flex items-center justify-center font-extrabold text-sm shrink-0 bg-[var(--paper)] text-[var(--ink)]">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <span className="font-extrabold text-sm truncate text-[var(--ink)]">
                  {user.name}
                </span>
              </div>

              {/* Score */}
              <span className="font-black text-sm text-right shrink-0 text-[var(--ink)] ml-2">
                {user.score.toLocaleString()} {activeTab === 'mastered' ? 'từ' : 'đ'}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
