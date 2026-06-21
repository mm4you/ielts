'use client';

import { useState, useRef } from 'react';

export default function SeedBotPage() {
  const [status, setStatus] = useState<string>('Bot đang ngủ...');
  const [insertedCount, setInsertedCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 50));
  };

  const stopBot = () => {
    setIsRunning(false);
    isRunningRef.current = false;
  };

  const startBot = async () => {
    setIsRunning(true);
    isRunningRef.current = true;
    setStatus('Bot đang chạy...');
    let totalInserted = 0;

    // Run 100 times max to prevent infinite loops, each time adds ~5 words
    for (let i = 0; i < 100; i++) {
      if (!isRunningRef.current) break;
      
      try {
        addLog(`Đang tìm kiếm từ vựng mới nhóm [${selectedGroup.toUpperCase()}]... (Lượt ${i + 1}/100)`);
        const res = await fetch(`/api/seed-more?group=${selectedGroup}`);
        const data = await res.json();
        
        if (data.inserted > 0) {
          totalInserted += data.inserted;
          setInsertedCount(totalInserted);
          addLog(`✅ Vừa cướp được ${data.inserted} từ chủ đề ${data.topic}: ${data.words?.join(', ')}`);
        } else {
          addLog(`⚠️ Không tìm được từ mới ở chủ đề ${data.topic}, bot đang thử lại...`);
        }
        
      } catch (error) {
        addLog(`❌ Lỗi: ${String(error)}`);
      }
    }
    
    setIsRunning(false);
    isRunningRef.current = false;
    setStatus('Bot đã dừng. Tổng thu hoạch: ' + totalInserted + ' từ.');
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <div className="panel">
        <h1 className="text-3xl font-black mb-6 uppercase text-center">Bơm Từ Vựng Bằng Bot AI</h1>
        <p className="text-[var(--muted)] font-bold mb-8 text-center">
          Con Bot này sẽ tự động chạy rảo quanh các từ điển (GRE, SAT, Idioms, Lóng...) để bốc từ vựng mới tinh, xịn xò về kho cho bạn!
        </p>

        <div className="mb-8">
          <label className="block text-sm font-black uppercase mb-3 text-[var(--ink)]">
            Chọn nhóm trình độ nạp từ:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { id: 'all', label: 'Tất Cả', desc: 'Trải đều A1-C2' },
              { id: 'A', label: 'Nhóm A', desc: 'Cơ bản (A1-A2)' },
              { id: 'B', label: 'Nhóm B', desc: 'Trung cấp (B1-B2)' },
              { id: 'C', label: 'Nhóm C', desc: 'Cao cấp (C1-C2)' }
            ].map(g => (
              <button
                key={g.id}
                disabled={isRunning}
                onClick={() => setSelectedGroup(g.id)}
                className={`p-3 border-[3px] border-[var(--line)] rounded-xl font-bold transition-all text-left flex flex-col justify-between shadow-[3px_3px_0_var(--line)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_var(--line)] disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedGroup === g.id
                    ? 'bg-[var(--yellow)] text-[#111827] border-[var(--line)]'
                    : 'bg-[var(--paper)] text-[var(--ink)]'
                }`}
              >
                <span className="text-sm font-black uppercase">{g.label}</span>
                <span className="text-[10px] font-semibold opacity-75 mt-1">{g.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl font-black text-[var(--green)] mb-2">+{insertedCount}</div>
          <div className="text-xl font-bold text-[var(--ink)]">{status}</div>
        </div>

        <button 
          onClick={isRunning ? stopBot : startBot} 
          className={`btn-brutal w-full py-4 text-xl uppercase text-white mb-8 ${isRunning ? 'bg-[var(--red)]' : 'bg-[var(--blue)]'}`}
        >
          {isRunning ? 'Dừng Bot Ngay!' : 'Khởi Động Bot 🚀'}
        </button>

        <div className="bg-[var(--paper)] border-[3px] border-[var(--line)] rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-2 pb-2 border-b border-[var(--line)] border-dashed last:border-b-0 text-[var(--ink)]">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-[var(--muted)] text-center mt-10">Lịch sử hoạt động của Bot sẽ hiện ở đây...</div>}
        </div>
      </div>
    </div>
  );
}
