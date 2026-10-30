import type { Metadata } from 'next';
import TypingGame from './TypingGame';
import RecallGame from '@/components/RecallGame';
import { studyQuery } from '@/lib/study-query';
export const metadata: Metadata = { title: 'Chíu chíu luyện gõ — IELTS Vocab', description: 'Gõ đúng từ để bắn mục tiêu và luyện phản xạ bàn phím.' };
export default async function TypingPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const params=await searchParams,query=studyQuery(params);
  return params.stageId ? <RecallGame key={query} initialQuery={query} mode="typing" /> : <TypingGame key={query} initialQuery={query} />;
}
