import {config} from 'dotenv';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {buildVocabularyImportPlan,type VocabularyImportSource,type LibraryImportWord} from '../lib/vocabulary-import-plan';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
async function main(){
 const args=process.argv.slice(2),allowed=new Set(['--source','--library','--database','--out']);
 for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw Error('Unsupported argument. This tool cannot apply changes.');if(args[i]!=='--database'){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing argument value.');i++;}}
 const value=(key:string)=>{const index=args.indexOf(key);return index<0?undefined:args[index+1];};
 const sourcePath=value('--source');if(!sourcePath||!!value('--library')===args.includes('--database'))throw Error('Use --source and exactly one of --library or --database.');
 const out=resolve(value('--out')??'.drafts/parroto/import-plan.json'),draftRoot=resolve('.drafts');
 const outputRelative=relative(draftRoot,out);if(outputRelative.startsWith('..')||isAbsolute(outputRelative)||!out.endsWith('.json')||out===resolve(sourcePath)||out===resolve(value('--library')??''))throw Error('Output must be a new JSON artifact inside .drafts, distinct from inputs.');
 const source=JSON.parse(readFileSync(sourcePath,'utf8')) as VocabularyImportSource;
 let library:LibraryImportWord[];
 if(value('--library'))library=JSON.parse(readFileSync(value('--library')!,'utf8')) as LibraryImportWord[];
 else{
  const url=new URL(process.env.DATABASE_URL??'');
  if(url.protocol!=='postgresql:'||!/^ep-plain-sunset-ao8bb4jy(?:-pooler)?\.c-2\.ap-southeast-1\.aws\.neon\.tech$/.test(url.hostname)||url.pathname!=='/neondb')throw Error('Database target does not match the known project library.');
  const db=new PrismaClient({datasources:{db:{url:url.toString()}}});
  try{library=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');const rows=await tx.word.findMany({select:{id:true,word:true,pos:true,level:true,topic:true,contentReview:{select:{status:true}}},orderBy:{id:'asc'}});return rows.map(({contentReview,...row})=>({...row,reviewStatus:contentReview?.status??null}));},{maxWait:10000,timeout:30000});}finally{await db.$disconnect();}
 }
 const plan=buildVocabularyImportPlan(source,library);
 const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
 const artifact={generatedAt:new Date().toISOString(),sourceFileSha256:hash(readFileSync(sourcePath,'utf8')),librarySnapshotSha256:hash(JSON.stringify(library)),sourceFile:relative(process.cwd(),resolve(sourcePath)),...plan};
 mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(artifact,null,2));
 const s=plan.summary;
 writeFileSync(out.replace(/\.json$/,'-summary.md'),[
 '# Đối chiếu từ vựng — chỉ đọc',
 '',
 '- Thư viện hiện tại: '+s.libraryRows+' bản ghi; '+s.libraryDuplicateTerms+' nhóm từ có nhiều bản ghi.',
 '- Nguồn: '+s.sourceOccurrences+' lượt thẻ, '+s.uniqueSourceCards+' ID thẻ, '+s.uniqueSourceTerms+' tên từ/cụm từ riêng biệt.',
 '- Đơn vị từ + từ loại: '+s.sourceLexemes+'.',
 '- Ứng viên dùng lại ID hiện có: '+s.reuseCandidates+'. Cần kiểm tra đúng nghĩa trước khi công bố.',
 '- Cần đối chiếu thủ công vì trùng bản ghi, khác/thiếu từ loại: '+s.manualReview+'.',
 '- Từ chưa có trong thư viện, chỉ lập bản nháp: '+s.newDrafts+' mục từ + từ loại ('+s.newDistinctTerms+' tên từ/cụm từ).',
 '- Lập quan hệ '+s.decks+' bộ / '+s.groups+' nhóm; không chèn Word lặp lại giữa các bộ.',
 '- Thao tác ghi database: **0**. Không sửa nghĩa, IPA, chủ đề, lịch SRS hoặc tiến độ.',
 '',
 'Các nhóm dự kiến có candidateWordIds và pendingEntryKeys riêng. suggestedStages chia tối đa 10 ID dùng lại mỗi chặng nhưng publishable luôn false. Không bỏ các mục đang chờ duyệt rồi giả vờ bộ đã đầy đủ.',
 'Bộ dữ liệu ngoài chỉ có tên từ/từ loại/nguồn. Từ đồng hình cùng từ loại vẫn có thể khác nghĩa: một ID khớp chưa phải nội dung đã duyệt.',
 ].join('\n')+'\n');
 console.log(JSON.stringify({...s,mode:plan.mode,artifact:relative(process.cwd(),out)}));
}
main().catch((error:unknown)=>{console.error('Không lập được bản đối chiếu. Kiểm tra tham số, dữ liệu nguồn hoặc kết nối chỉ đọc.',error instanceof Error?error.name:'UnknownError');process.exitCode=1;});
