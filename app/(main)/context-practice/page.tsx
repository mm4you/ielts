import ExerciseGame from '@/components/ExerciseGame';
import { studyQuery } from '@/lib/study-query';
export const metadata={title:'Điền từ theo ngữ cảnh — IELTS Vocab'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const query=studyQuery(await searchParams);
  return <ExerciseGame key={query} mode="context" initialQuery={query}/>;
}
