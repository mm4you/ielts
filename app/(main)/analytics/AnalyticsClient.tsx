'use client';



import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { FireRegular as FluentFireRegular } from '@fluentui/react-icons/svg/fire';
import { BookOpenRegular } from '@fluentui/react-icons/svg/book-open';
import { CheckmarkCircleRegular } from '@fluentui/react-icons/svg/checkmark-circle';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { FlashRegular } from '@fluentui/react-icons/svg/flash';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';
import { TrophyRegular } from '@fluentui/react-icons/svg/trophy';
import { useState } from 'react';
import Link from 'next/link';

interface LeaderboardUser {
  name: string;
  score: number;
}

interface AnalyticsClientProps {
  totalWords: number;
  learnedWords: number;
  masteredCount: number;
  learningCount: number;
  newCount: number;
  streak: number;
  hasActivityToday: boolean;
  heatmapData: Record<string, number>;
  highScores: {
    blockblast: number;
    speedrun: number;
    sniper: number;
  };
  userName: string;
  leaderboard: {
    blockblast: LeaderboardUser[];
    speedrun: LeaderboardUser[];
    sniper: LeaderboardUser[];
    mastered: LeaderboardUser[];
  };
}

export default function AnalyticsClient({
  totalWords,
  learnedWords,
  masteredCount,
  learningCount,
  newCount,
  streak,
  hasActivityToday,
  heatmapData,
  highScores,
  userName,
  leaderboard
}: AnalyticsClientProps) {
  const [activeTab, setActiveTab] = useState<'blockblast' | 'speedrun' | 'sniper' | 'mastered'>('mastered');

  // Tính tỷ lệ phần trăm
  const masteredPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const learningPercent = totalWords > 0 ? Math.round((learningCount / totalWords) * 100) : 0;
  const newPercent = totalWords > 0 ? Math.round((newCount / totalWords) * 100) : 0;
  const overallPercent = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;

  // Sinh danh sách ngày cho Heatmap (365 ngày qua)
  const getHeatmapDays = () => {
    const days: Date[] = [];
    const today = new Date();

    // Tìm ngày Chủ Nhật cách đây 52 tuần
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);
    const startDayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - startDayOfWeek); // Lùi về Chủ Nhật đầu tiên

    // Ngày kết thúc là Thứ Bảy của tuần hiện tại để lưới vuông vức
    const endDate = new Date(today);
    const endDayOfWeek = endDate.getDay();
    endDate.setDate(today.getDate() + (6 - endDayOfWeek)); // Tiến tới Thứ Bảy cuối cùng

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return days;
  };

  const heatmapDays = getHeatmapDays();

  // Helper định dạng ngày Việt Nam
  const formatDateVN = (d: Date) => {
    const date = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${date}/${month}/${year}`;
  };

  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  // Lấy màu sắc ô Heatmap dựa trên số từ học
  const getHeatmapColorClass = (count: number) => {
    if (!count || count === 0) return 'bg-[var(--bg)] dark:bg-zinc-800/50 border border-[var(--border)] opacity-30';
    if (count <= 5) return 'bg-[#dcfce7] dark:bg-[#064e3b] text-[#15803d] border border-[#bbf7d0] dark:border-[#065f46]';
    if (count <= 15) return 'bg-[#bbf7d0] dark:bg-[#065f46] text-[#166534] border border-[#86efac] dark:border-[#047857]';
    if (count <= 30) return 'bg-[#86efac] dark:bg-[#047857] text-[#15803d] border border-[#4ade80] dark:border-[#065f46]';
    return 'bg-[#22c55e] dark:bg-[#10b981] text-white border border-[#16a34a] shadow-[0_0_8px_rgba(34,197,94,0.4)]';
  };

  // Phân chia danh sách ngày theo hàng Thứ (Chủ Nhật = hàng 0, Thứ Hai = hàng 1...)
  // Vì ta hiển thị grid-rows-7 và grid-flow-col, thứ tự điền là cột-trước, nên ta cứ render mảng phẳng.
  // CSS grid-rows-7 và grid-flow-col sẽ tự động xếp 7 ngày đầu tiên vào cột 1, 7 ngày tiếp theo vào cột 2...

  const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="analytics-page">
      <header className="page-heading"><div><h1>Thống kê học tập</h1><p>{userName}</p></div></header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Streak Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-1">Chuỗi liên tục</p>
            <p className="text-4xl font-semibold text-[var(--ink)] flex items-baseline gap-1">
              {streak} <span className="text-base font-semibold">ngày</span>
            </p>
            <p className="text-xs font-semibold text-[var(--muted)] mt-2">
              {hasActivityToday ? 'Đã học hôm nay' : 'Chưa học hôm nay'}
            </p>
          </div>
          <div className="w-12 h-12 bg-[var(--red)] border border-[var(--line)] rounded-xl flex items-center justify-center shrink-0">
            <FluentFireRegular aria-hidden="true" className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Total Learned Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-1">Đã tương tác</p>
            <p className="text-4xl font-semibold text-[var(--ink)] flex items-baseline gap-1">
              {learnedWords} <span className="text-base font-semibold">/ {totalWords} từ</span>
            </p>
            <p className="text-xs font-semibold text-[var(--muted)] mt-2">
              Đã học {overallPercent}% kho từ vựng
            </p>
          </div>
          <div className="w-12 h-12 bg-[var(--blue)] border border-[var(--line)] rounded-xl flex items-center justify-center shrink-0">
            <BookOpenRegular aria-hidden="true" className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Mastered Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)] mb-1">Đã thuộc lòng</p>
            <p className="text-4xl font-semibold text-[var(--green)] flex items-baseline gap-1">
              {masteredCount} <span className="text-base font-semibold text-[var(--ink)]">từ</span>
            </p>
            <p className="text-xs font-semibold text-[var(--muted)] mt-2">
              Ôn tập đều để ghi nhớ lâu hơn
            </p>
          </div>
          <div className="w-12 h-12 bg-[var(--green)] border border-[var(--line)] rounded-xl flex items-center justify-center shrink-0">
            <CheckmarkCircleRegular aria-hidden="true" className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Memory Progress Section */}
      <div className="panel p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-[var(--ink)]">Tiến trình ghi nhớ từ vựng</h2>

        {/* Progress Bar Container */}
        <div className="h-8 w-full border border-[var(--line)] rounded-xl overflow-hidden flex mb-6 ">
          {masteredCount > 0 && (
            <div
              style={{ width: `${masteredPercent}%` }}
              className="bg-[var(--green)] h-full border-r-[2px] border-[var(--line)] flex items-center justify-center text-xs font-semibold text-white"
              title={`Đã thuộc: ${masteredCount} từ`}
            >
              {masteredPercent >= 10 && `${masteredPercent}%`}
            </div>
          )}
          {learningCount > 0 && (
            <div
              style={{ width: `${learningPercent}%` }}
              className="bg-[var(--blue)] h-full border-r-[2px] border-[var(--line)] flex items-center justify-center text-xs font-semibold text-white"
              title={`Đang học: ${learningCount} từ`}
            >
              {learningPercent >= 10 && `${learningPercent}%`}
            </div>
          )}
          {newCount > 0 && (
            <div
              style={{ width: `${newPercent}%` }}
              className="bg-[var(--yellow)] h-full flex items-center justify-center text-xs font-semibold text-[#111827]"
              title={`Chưa học: ${newCount} từ`}
            >
              {newPercent >= 10 && `${newPercent}%`}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--green)] border border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--ink)]">Đã thuộc</p>
              <p className="text-sm font-semibold text-[var(--muted)]">{masteredCount} từ ({masteredPercent}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--blue)] border border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--ink)]">Đang học</p>
              <p className="text-sm font-semibold text-[var(--muted)]">{learningCount} từ ({learningPercent}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--yellow)] border border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[var(--ink)]">Chưa học</p>
              <p className="text-sm font-semibold text-[var(--muted)]">{newCount} từ ({newPercent}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="panel p-6 mb-8 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h2 className="text-lg font-semibold text-[var(--ink)]">Hoạt động học tập</h2>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
            <span>Ít</span>
            <div className="w-3 h-3 rounded-sm bg-[var(--bg)] border border-[var(--border)] opacity-30" />
            <div className="w-3 h-3 rounded-sm bg-[#dcfce7] dark:bg-[#064e3b]" />
            <div className="w-3 h-3 rounded-sm bg-[#bbf7d0] dark:bg-[#065f46]" />
            <div className="w-3 h-3 rounded-sm bg-[#86efac] dark:bg-[#047857]" />
            <div className="w-3 h-3 rounded-sm bg-[#22c55e] dark:bg-[#10b981]" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Heatmap Outer Wrapper for horizontal scrolling on mobile */}
        <div className="overflow-x-auto overflow-y-visible scrollbar-none pb-8">
          <div className="flex gap-2 min-w-[720px] select-none">
            {/* Day of Week Labels Column */}
            <div className="grid grid-rows-7 gap-[3px] pr-2 text-[10px] font-semibold text-[var(--muted)] text-right h-[122px] justify-between pt-[2px]">
              {dayLabels.map((label, idx) => (
                <div key={idx} className="h-[14px] flex items-center justify-end">
                  {idx % 2 === 1 && label}
                </div>
              ))}
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-rows-7 grid-flow-col gap-[3px] h-[122px]">
              {heatmapDays.map((day, idx) => {
                const key = formatDateKey(day);
                const count = heatmapData[key] || 0;
                const colorClass = getHeatmapColorClass(count);
                const formattedVN = formatDateVN(day);

                return (
                  <div key={idx} className="group relative">
                    <div
                      className={`w-[14px] h-[14px] rounded-[3px] transition-colors cursor-pointer ${colorClass}`}
                    />
                    {/* Tooltip - hiển thị bên dưới ô để không bị che */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 hidden group-hover:block bg-[var(--ink)] text-[var(--paper)] text-[10px] font-semibold py-1 px-2.5 rounded-lg border border-[var(--line)] whitespace-nowrap z-50 pointer-events-none">
                      {count > 0 ? `Đã học ${count} từ` : 'Chưa có hoạt động'} — {formattedVN}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[var(--muted)] font-semibold mt-3 text-right">
          * Biểu đồ hiển thị hoạt động học tập trong 12 tháng qua.
        </p>
      </div>

      {/* Game Highscores Grid */}
      <div className="panel p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--ink)]">Kỷ lục trò chơi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Block Blast */}
          <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--blue)] border border-[var(--line)] rounded-lg flex items-center justify-center shrink-0">
              <GridRegular aria-hidden="true" className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--muted)]">Xếp hình (Block Blast)</p>
              <p className="text-xl font-semibold text-[var(--ink)]">{highScores.blockblast} điểm</p>
            </div>
          </div>

          {/* Speedrun */}
          <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--red)] border border-[var(--line)] rounded-lg flex items-center justify-center shrink-0">
              <FlashRegular aria-hidden="true" className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--muted)]">Tốc chiến (Speedrun)</p>
              <p className="text-xl font-semibold text-[var(--ink)]">{highScores.speedrun} điểm</p>
            </div>
          </div>

          {/* Sniper */}
          <div className="bg-[var(--bg)] border border-[var(--line)] rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--ink)] border border-[var(--line)] rounded-lg flex items-center justify-center shrink-0">
              <TargetArrowRegular aria-hidden="true" className="w-5 h-5 text-[var(--paper)]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[var(--muted)]">Thiện xạ (Sniper)</p>
              <p className="text-xl font-semibold text-[var(--ink)]">{highScores.sniper} điểm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Community Leaderboard Panel */}
      <div className="panel p-6 mt-8 border border-[var(--line)] rounded-2xl bg-[var(--paper)] w-full flex flex-col select-none">
        {/* Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-solid border-[var(--line)] pb-3">
          <div className="w-9 h-9 bg-[var(--yellow)] border border-[var(--line)] rounded-lg flex items-center justify-center shrink-0">
            <TrophyRegular aria-hidden="true" className="w-5 h-5 text-[var(--ink)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--ink)]">Bảng xếp hạng</h2>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 p-1 bg-[var(--bg)] rounded-xl border border-[var(--line)]">
          {[
            { id: 'mastered', label: 'Chăm chỉ', color: 'bg-[var(--brand-soft)] text-[var(--blue)]' },
            { id: 'speedrun', label: 'Tốc chiến', color: 'bg-[var(--brand-soft)] text-[var(--blue)]' },
            { id: 'blockblast', label: 'Xếp hình', color: 'bg-[var(--brand-soft)] text-[var(--blue)]' },
            { id: 'sniper', label: 'Thiện xạ', color: 'bg-[var(--brand-soft)] text-[var(--blue)]' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${ activeTab === tab.id ? `${tab.color} border border-[var(--line)] ` : 'text-[var(--muted)] hover:text-[var(--ink)] bg-transparent border border-transparent' }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3.5">
          {leaderboard[activeTab].length === 0 ? (
            <div className="text-center py-10 font-semibold text-sm text-[var(--muted)]">
              Chưa có dữ liệu xếp hạng
            </div>
          ) : (
            leaderboard[activeTab].map((user, idx) => {
              const getRankStyle = (index: number) => {
                switch (index) {
                  case 0:
                    return 'bg-[var(--yellow)] text-[var(--ink)] border-[var(--line)] ';
                  case 1:
                    return 'bg-[var(--surface-hover)] text-[var(--ink)] border-[var(--line)]';
                  case 2:
                    return 'bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]';
                  default:
                    return 'bg-[var(--bg)] text-[var(--muted)] border-[var(--line)]';
                }
              };

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${getRankStyle(idx)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <span className="w-7 h-7 rounded-full border border-[var(--line)] flex items-center justify-center text-xs font-semibold shrink-0 bg-[var(--paper)] text-[var(--ink)]">
                      {idx + 1}
                    </span>

                    {/* Avatar Letter */}
                    <div className="w-8 h-8 rounded-full border border-[var(--line)] flex items-center justify-center font-semibold text-sm shrink-0 bg-[var(--paper)] text-[var(--ink)]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Username */}
                    <span className="font-semibold text-sm truncate text-[var(--ink)]">
                      {user.name}
                    </span>
                  </div>

                  {/* Score */}
                  <span className="font-semibold text-sm text-right shrink-0 text-[var(--ink)] ml-2">
                    {user.score.toLocaleString()} {activeTab === 'mastered' ? 'từ đã thuộc' : 'điểm'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
