'use client';
import ChoiceSelect from '@/components/ChoiceSelect';

import PageHeader from '@/components/PageHeader';
import { Button, Field, Spinner, MessageBar } from '@fluentui/react-components';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { ArrowLeftRegular } from '@fluentui/react-icons/svg/arrow-left';
import { ArrowSwapRegular } from '@fluentui/react-icons/svg/arrow-swap';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';

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
      <PageHeader title="Luyện phát âm" description="Đọc từ để nhận điểm và phản hồi phát âm." actions={<Button as="a" href={exitRoute} appearance="subtle" icon={<ArrowLeftRegular />}>Quay lại</Button>} />
      <section className="panel pronunciation-toolbar" aria-label="Cài đặt luyện phát âm"><Field label="Cấp độ"><ChoiceSelect value={level} onChange={e=>setLevel(e.target.value)}>{CEFR_LEVELS.map(l=><option key={l} value={l}>{l==='ALL'?'Tất cả cấp độ':l}</option>)}</ChoiceSelect></Field><Button onClick={fetchRandomWord} appearance="primary" disabled={loading} icon={loading?<Spinner size="tiny" />:<ArrowSwapRegular />}>{loading?'Đang tải':'Đổi từ'}</Button></section>
      {errorMsg && <MessageBar intent="error">{errorMsg}</MessageBar>}
      {loading && <LoadingState label="Đang tải từ vựng" />}

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
