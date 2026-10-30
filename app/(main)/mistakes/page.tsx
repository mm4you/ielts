import type { Word } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Button, MessageBar } from '@fluentui/react-components';
import PageHeader from '@/components/PageHeader';
import { parseMeaning } from '@/lib/parse';
type Mistake={wordId:number;mode:string;word:Word};
const modes=[
  {id:'typing',name:'Luyện Gõ',href:'/typing',unit:'từ'},
  {id:'word-rain',name:'Nhớ nghĩa — Mưa Từ Vựng',href:'/word-rain',unit:'từ'},
  {id:'spelling-bee',name:'Nghe và viết — Ong Chính Tả',href:'/spelling-bee',unit:'từ'},
  {id:'collocations',name:'Ghép cụm từ',href:'/collocations',unit:'câu'},
  {id:'context',name:'Điền từ theo ngữ cảnh',href:'/context-practice',unit:'câu'},
  {id:'spelling-hunt',name:'Săn lỗi chính tả',href:'/spelling-hunt',unit:'câu'},
];
export default async function MistakesPage(){
  const session=await auth();if(!session?.user?.id)redirect('/');
  const [words,exercises]=await Promise.allSettled([
    prisma.wordMistake.findMany({where:{userId:session.user.id,resolvedAt:null},include:{word:true},orderBy:{lastWrongAt:'desc'}}),
    prisma.exerciseMistake.findMany({where:{userId:session.user.id,resolvedAt:null},include:{word:true},orderBy:{lastWrongAt:'desc'}}),
  ]);
  const rows:Mistake[]=[...(words.status==='fulfilled'?words.value:[]),...(exercises.status==='fulfilled'?exercises.value:[])];
  return <section><PageHeader title="Thử lại, nhớ lâu hơn" description="Những từ và câu cần thêm một chút luyện tập. Lịch sử của bạn vẫn được giữ sau khi luyện lại đúng."/>{[words,exercises].some(r=>r.status==='rejected')&&<MessageBar intent="warning">Một phần danh sách chưa tải được. Bạn vẫn có thể luyện các mục bên dưới.</MessageBar>}<div className="study-deck-grid">{modes.map(mode=>{
    const items=rows.filter(r=>r.mode===mode.id),unique=[...new Map(items.map(r=>[r.wordId,r])).values()];
    return <article className="panel study-deck" key={mode.id}><h2>{mode.name}</h2><p>{items.length} {mode.unit} cần luyện lại</p>{items.length?<><Button as="a" appearance="primary" href={mode.href+'?source=mistakes'}>Luyện lại {items.length} {mode.unit}</Button><ul className="study-result-list">{unique.map(r=><li key={r.wordId}><a href={'/word/'+r.wordId}>{r.word.word}</a><span>{parseMeaning(r.word.meaning_vi,r.word.pos).vi||parseMeaning(r.word.meaning_vi,r.word.pos).en}</span></li>)}</ul></>:<p>Chưa có mục cần luyện lại ở cách học này.</p>}</article>;
  })}</div></section>;
}
