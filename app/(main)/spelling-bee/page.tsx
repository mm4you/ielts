import RecallGame from '@/components/RecallGame';
import { studyQuery } from '@/lib/study-query';
export default async function SpellingBeePage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const query=studyQuery(await searchParams);
  return <RecallGame key={query} initialQuery={query} mode="spelling-bee" />;
}
