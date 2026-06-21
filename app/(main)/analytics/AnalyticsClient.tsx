'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  userName
}: AnalyticsClientProps) {
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
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--ink)] mb-2">
          📊 Thống kê học tập
        </h1>
        <p className="text-[var(--muted)] font-bold">
          Chào mừng trở lại, <span className="text-[var(--blue)]">{userName}</span>! Dưới đây là hành trình chinh phục từ vựng của bạn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* Streak Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-black uppercase text-[var(--muted)] mb-1">Chuỗi liên tục</p>
            <p className="text-4xl font-black text-[var(--ink)] flex items-baseline gap-1">
              {streak} <span className="text-base font-bold">ngày</span>
            </p>
            <p className="text-xs font-bold text-[var(--muted)] mt-2">
              {hasActivityToday ? '🎉 Hôm nay đã học' : '🔥 Học ngay hôm nay để giữ chuỗi!'}
            </p>
          </div>
          <div className="text-5xl animate-bounce">🔥</div>
        </div>

        {/* Total Learned Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-black uppercase text-[var(--muted)] mb-1">Đã tương tác</p>
            <p className="text-4xl font-black text-[var(--ink)] flex items-baseline gap-1">
              {learnedWords} <span className="text-base font-bold">/ {totalWords} từ</span>
            </p>
            <p className="text-xs font-bold text-[var(--muted)] mt-2">
              Chinh phục được {overallPercent}% kho từ vựng
            </p>
          </div>
          <div className="text-5xl">📚</div>
        </div>

        {/* Mastered Card */}
        <div className="panel flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-black uppercase text-[var(--muted)] mb-1">Đã thuộc lòng</p>
            <p className="text-4xl font-black text-[var(--green)] flex items-baseline gap-1">
              {masteredCount} <span className="text-base font-bold text-[var(--ink)]">từ</span>
            </p>
            <p className="text-xs font-bold text-[var(--muted)] mt-2">
              Đã ghi nhớ vào trí nhớ dài hạn
            </p>
          </div>
          <div className="text-5xl">🧠</div>
        </div>
      </div>

      {/* Memory Progress Section */}
      <div className="panel p-6 mb-8">
        <h2 className="text-lg font-black uppercase mb-4 text-[var(--ink)]">🧠 Tiến trình ghi nhớ từ vựng</h2>
        
        {/* Progress Bar Container */}
        <div className="h-8 w-full border-[3px] border-[var(--line)] rounded-xl overflow-hidden flex mb-6 shadow-[2px_2px_0_var(--line)]">
          {masteredCount > 0 && (
            <div 
              style={{ width: `${masteredPercent}%` }} 
              className="bg-[var(--green)] h-full border-r-[2px] border-[var(--line)] flex items-center justify-center text-xs font-black text-white"
              title={`Đã thuộc: ${masteredCount} từ`}
            >
              {masteredPercent >= 10 && `${masteredPercent}%`}
            </div>
          )}
          {learningCount > 0 && (
            <div 
              style={{ width: `${learningPercent}%` }} 
              className="bg-[var(--blue)] h-full border-r-[2px] border-[var(--line)] flex items-center justify-center text-xs font-black text-white"
              title={`Đang học: ${learningCount} từ`}
            >
              {learningPercent >= 10 && `${learningPercent}%`}
            </div>
          )}
          {newCount > 0 && (
            <div 
              style={{ width: `${newPercent}%` }} 
              className="bg-[var(--yellow)] h-full flex items-center justify-center text-xs font-black text-[#111827]"
              title={`Chưa học: ${newCount} từ`}
            >
              {newPercent >= 10 && `${newPercent}%`}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--green)] border-2 border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-[var(--ink)]">Đã thuộc (Mastered)</p>
              <p className="text-sm font-bold text-[var(--muted)]">{masteredCount} từ ({masteredPercent}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--blue)] border-2 border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-[var(--ink)]">Đang học (Learning)</p>
              <p className="text-sm font-bold text-[var(--muted)]">{learningCount} từ ({learningPercent}%)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl">
            <div className="w-5 h-5 bg-[var(--yellow)] border-2 border-[var(--line)] rounded-md shrink-0" />
            <div>
              <p className="text-xs font-black uppercase text-[var(--ink)]">Chưa học (New)</p>
              <p className="text-sm font-bold text-[var(--muted)]">{newCount} từ ({newPercent}%)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="panel p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
          <h2 className="text-lg font-black uppercase text-[var(--ink)]">📅 Biểu đồ nhiệt hoạt động</h2>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--muted)]">
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
        <div className="overflow-x-auto scrollbar-none pb-2">
          <div className="flex gap-2 min-w-[720px] select-none">
            {/* Day of Week Labels Column */}
            <div className="grid grid-rows-7 gap-[3px] pr-2 text-[10px] font-black text-[var(--muted)] text-right h-[122px] justify-between pt-[2px]">
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
                      className={`w-[14px] h-[14px] rounded-[3px] transition-colors ${colorClass}`} 
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[var(--ink)] text-[var(--paper)] text-[10px] font-black py-1 px-2.5 rounded-lg border-2 border-[var(--line)] whitespace-nowrap z-30 shadow-[2px_2px_0_var(--line)]">
                      {count > 0 ? `🔥 Đã học ${count} từ` : 'Nhàn rỗi'} vào {formattedVN}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-[var(--muted)] font-bold mt-3 text-right">
          * Biểu đồ hiển thị hoạt động học tập trong 12 tháng qua.
        </p>
      </div>

      {/* Game Highscores Grid */}
      <div className="panel p-6">
        <h2 className="text-lg font-black uppercase mb-4 text-[var(--ink)]">🏆 Kỷ lục trò chơi</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Block Blast */}
          <div className="bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl p-4 shadow-[2px_2px_0_var(--line)] flex items-center gap-4">
            <div className="text-3xl">🧩</div>
            <div>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">Xếp hình (Block Blast)</p>
              <p className="text-xl font-black text-[var(--ink)]">{highScores.blockblast} điểm</p>
            </div>
          </div>

          {/* Speedrun */}
          <div className="bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl p-4 shadow-[2px_2px_0_var(--line)] flex items-center gap-4">
            <div className="text-3xl">⚡</div>
            <div>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">Tốc chiến (Speedrun)</p>
              <p className="text-xl font-black text-[var(--ink)]">{highScores.speedrun} điểm</p>
            </div>
          </div>

          {/* Sniper */}
          <div className="bg-[var(--bg)] border-2 border-[var(--line)] rounded-xl p-4 shadow-[2px_2px_0_var(--line)] flex items-center gap-4">
            <div className="text-3xl">🎯</div>
            <div>
              <p className="text-[10px] font-black uppercase text-[var(--muted)]">Thiện xạ (Sniper)</p>
              <p className="text-xl font-black text-[var(--ink)]">{highScores.sniper} điểm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
