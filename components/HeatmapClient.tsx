'use client';

import { useState, useEffect } from 'react';
import ActivityCalendar from 'react-activity-calendar';
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
        }
      } catch (e) {
        console.error(e);
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
        <span>🔥</span> Lưới Cày Cuốc
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
