'use client';
import { Button } from '@fluentui/react-components';

import { useState } from 'react';

export default function MigratePage() {
  const [status, setStatus] = useState<string>('Đang chờ...');
  const [processed, setProcessed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const startMigration = async () => {
    setIsRunning(true);
    setStatus('Đang bắt đầu quét...');
    let totalProcessed = 0;
    let isDone = false;

    while (!isDone) {
      try {
        const res = await fetch('/api/migrate-pos-datamuse');
        const data = await res.json();

        if (data.done) {
          isDone = true;
          setStatus('Hoàn tất! Đã quét và phân loại toàn bộ từ vựng.');
        } else {
          totalProcessed += data.processed;
          setProcessed(totalProcessed);
          setStatus(`Đang quét... đã phân loại ${totalProcessed} từ`);
        }
      } catch (error) {
        setStatus(`Lỗi: ${String(error)}`);
        isDone = true;
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <div className="panel text-center">
        <h1 className="text-3xl font-semibold mb-6 ">Cập nhật Loại từ hàng loạt</h1>
        <p className="text-[var(--muted)] font-semibold mb-8">
          Hệ thống sẽ tự động quét toàn bộ hơn 4000 từ vựng cũ và dùng AI (Datamuse) để phân loại thành Danh từ, Động từ, Tính từ, Trạng từ. Quá trình này có thể mất vài phút.
        </p>

        <div className="text-5xl font-semibold text-[var(--blue)] mb-8">
          {processed} <span className="text-lg text-[var(--muted)] block mt-2">{status}</span>
        </div>

        <Button
          onClick={startMigration}
          disabled={isRunning}
          className={` w-full py-4 text-xl text-white ${isRunning ? 'bg-gray-400' : 'bg-[var(--green)]'}`}
        >
          {isRunning ? 'Đang chạy...' : 'Bắt đầu quét 4000 từ'}
        </Button>
      </div>
    </div>
  );
}
