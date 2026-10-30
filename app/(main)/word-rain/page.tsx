import RecallGame from '@/components/RecallGame';
import { studyQuery } from '@/lib/study-query';
export default async function WordRainPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const query=studyQuery(await searchParams);
  return <RecallGame key={query} initialQuery={query} mode="word-rain" />;
}
