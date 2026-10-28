'use client';

import { Button, Field, Select } from '@fluentui/react-components';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PronounceRoast = dynamic(() => import('./PronounceRoast'), {
  ssr: false,
  loading: () => <LoadingState label="Đang chuẩn bị phát âm" />
});

export default function RoastDemoPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <RoastDemoContent />
    </Suspense>
  );
}

function RoastDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';

  const [wordData, setWordData] = useState<{ id: number; word: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRandomWord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/word/random?level=${level}`);
      const data = await res.json();
      if (res.ok) {
        setWordData(data);
      } else {
        setErrorMsg(data.error || 'Lỗi lấy từ vựng');
        setWordData(null);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Không thể tải từ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch when level changes or component mounts
  useEffect(() => {
    fetchRandomWord();
  }, [level]);

  const CEFR_LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="pronunciation-page">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--line)] pb-2">
        <h1 className="text-2xl sm:text-3xl font-semibold flex items-center gap-3">
          Luyện phát âm
        </h1>
        <button
          onClick={() => router.push(exitRoute)}
          className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm md:text-base"
          title={exitLabel}
         aria-label="Đóng">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></button>
      </div>

      <p className="mb-6 text-base sm:text-lg font-semibold text-[var(--muted)]">
        Đọc từ để nhận điểm và phản hồi phát âm.
      </p>

      <div className="panel bg-[var(--paper)] border border-[var(--line)] mb-8 p-4 sm:p-6 text-center">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <label htmlFor="pronunciation-level" className="text-sm text-[var(--muted)]">Cấp độ</label>
          <select id="pronunciation-level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="input-brutal w-full sm:w-auto text-center font-semibold bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
          >
            {CEFR_LEVELS.map(l => (
              <option key={l} value={l}>{l === 'ALL' ? 'Tất cả cấp độ' : l}</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchRandomWord}
          disabled={loading}
          className={`btn-brutal w-full sm:w-auto px-8 py-3 text-xl font-semibold ${loading ? 'bg-[var(--muted)] text-[var(--paper)]' : 'bg-[var(--blue)] text-white hover:brightness-110'}`}
        >
          {loading ? 'Đang tải' : 'Đổi từ'}
        </button>
        {errorMsg && <p className="text-red-500 font-semibold mt-4">{errorMsg}</p>}
      </div>

      {!loading && wordData && (
        <div className="space-y-8">
          <div>
            <PronounceRoast
              key={`pronounce-${wordData.id}`}
              wordId={wordData.id}
              wordText={wordData.word}
            />
          </div>
        </div>
      )}
    </div>
  );
}
