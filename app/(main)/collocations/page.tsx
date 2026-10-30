import ExerciseGame from '@/components/ExerciseGame';
import { studyQuery } from '@/lib/study-query';
export const metadata={title:'Ghép cụm từ — IELTS Vocab'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query=studyQuery(await searchParams);
  return <ExerciseGame key={query} mode="collocations" initialQuery={query}/>;
}
