'use client';

import { useState, useEffect } from 'react';
import { ActivityCalendar } from 'react-activity-calendar';
import { subYears, format, parseISO } from 'date-fns';

interface Activity {
  date: string;
  wordsLearned: number;
}

export default function HeatmapClient() {
  const [data, setData] = useState<{ date: string; count: number; level: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity');
        const activities: Activity[] = await res.json();
        
        if (Array.isArray(activities)) {
          // Generate 365 days of empty data to ensure the calendar looks full
          const today = new Date();
          const oneYearAgo = subYears(today, 1);
          
          const calendarData = [];
          for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = format(d, 'yyyy-MM-dd');
            const found = activities.find(a => a.date.startsWith(dateStr));
            
            let count = found ? found.wordsLearned : 0;
            
            // Calculate level (0-4) based on count
            let level = 0;
            if (count > 0 && count <= 10) level = 1;
            else if (count > 10 && count <= 30) level = 2;
            else if (count > 30 && count <= 50) level = 3;
            else if (count > 50) level = 4;

            calendarData.push({
              date: dateStr,
              count,
              level,
            });
          }
          setData(calendarData);
        } else {
          // Fallback if API fails
          const today = format(new Date(), 'yyyy-MM-dd');
          setData([{ date: today, count: 0, level: 0 }]);
        }
      } catch (e) {
        console.error(e);
        // Fallback if network fails
        const today = format(new Date(), 'yyyy-MM-dd');
        setData([{ date: today, count: 0, level: 0 }]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return <div className="h-40 w-full bg-[var(--paper)] rounded-xl animate-pulse border-2 border-[var(--line)]"></div>;
  }

  return (
    <div className="panel p-6 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] w-full mb-8 overflow-hidden bg-white">
      <h3 className="text-xl font-serif font-black mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[var(--red)] shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
        <span>Lưới Cày Cuốc</span>
      </h3>
      <div className="w-full overflow-x-auto pb-4">
        <ActivityCalendar 
          data={data} 
          theme={{
            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
            dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
          }}
          labels={{
            legend: {
              less: 'Lười',
              more: 'Chăm',
            },
            months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
            weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            totalCount: 'Tổng cộng {{count}} từ trong năm qua',
          }}
          showWeekdayLabels={true}
        />
      </div>
    </div>
  );
}
