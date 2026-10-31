export type LibraryImportWord = {id:number;word:string;pos:string|null;level?:string;topic?:string;reviewStatus?:string|null};
export type ExternalImportCard = {id:string;word:string;type:string;deckId:string;groupId:string;sourceUrl:string};
export type ExternalImportDeck = {id:string;name:string;nameVi?:string;url:string;isPro:boolean;groups:{id:string;name:string;totalCards?:number}[]};
export type VocabularyImportSource = {decks:ExternalImportDeck[];words:ExternalImportCard[]};
const aliases:Record<string,string>={n:'noun',noun:'noun','danh từ':'noun',v:'verb',verb:'verb','động từ':'verb',adj:'adjective',adjective:'adjective','tính từ':'adjective',adv:'adverb',adverb:'adverb','trạng từ':'adverb',pron:'pronoun',pronoun:'pronoun','đại từ':'pronoun',prep:'preposition',preposition:'preposition','giới từ':'preposition',conj:'conjunction',conjunction:'conjunction','liên từ':'conjunction',det:'determiner',determiner:'determiner','từ hạn định':'determiner',interjection:'interjection','thán từ':'interjection',phrase:'phrase','cụm từ':'phrase','phrasal verb':'phrasal verb','cụm động từ':'phrasal verb',idiom:'idiom','thành ngữ':'idiom',collocation:'collocation','modal verb':'modal verb','auxiliary verb':'auxiliary verb'};
export const normalizeImportTerm=(value:string)=>value.normalize('NFKC').toLowerCase().replace(/[‘’ʼ]/g,"'").trim().replace(/\s+/g,' ');
export function normalizeImportPos(value:string|null|undefined){return value?aliases[normalizeImportTerm(value).replace(/\.$/,'')]??null:null;}
export function buildVocabularyImportPlan(source:VocabularyImportSource,library:LibraryImportWord[]){
 const byTerm=new Map<string,LibraryImportWord[]>(),seenLibraryIds=new Set<number>();
 for(const row of library){if(!Number.isSafeInteger(row.id)||row.id<1||!row.word?.trim()||seenLibraryIds.has(row.id))throw Error('Invalid or duplicate library row ID.');seenLibraryIds.add(row.id);const term=normalizeImportTerm(row.word);byTerm.set(term,[...(byTerm.get(term)??[]),row]);}
 const decks=new Map<string,ExternalImportDeck>();
 for(const deck of source.decks){if(deck.isPro||decks.has(deck.id)||new URL(deck.url).origin!=='https://parroto.app')throw Error('Input must contain distinct, explicitly free Parroto decks.');decks.set(deck.id,deck);}
 const cards=new Map<string,ExternalImportCard>(),memberships=new Map<string,{cardKey:string;entryKey:string;deckId:string;groupId:string}>();
 const entries=new Map<string,{key:string;word:string;pos:string|null;sourceTypes:string[];cardKeys:string[];status:'reuse-candidate'|'manual-review'|'new-draft';reason:string;candidateWordIds:number[];wordId?:number;requiresSenseReview:true}>();
 for(const card of source.words){
  const deck=decks.get(card.deckId),term=normalizeImportTerm(card.word??'');
  if(typeof card.word!=='string'||typeof card.type!=='string'||typeof card.id!=='string')throw Error('Invalid card text or identity.');
  if(!deck||new URL(card.sourceUrl).pathname!==new URL(deck.url).pathname||!deck.groups.some(g=>g.id===card.groupId)||!term||!card.id||new URL(card.sourceUrl).origin!=='https://parroto.app')throw Error('Invalid source card or deck/group provenance.');
  const pos=normalizeImportPos(card.type),entryKey=JSON.stringify([term,pos??'unrecognized:'+normalizeImportTerm(card.type??'')]);
  const cardKey=new URL(card.sourceUrl).origin+'/card/'+encodeURIComponent(card.id),existingCard=cards.get(cardKey);
  if(existingCard&&(normalizeImportTerm(existingCard.word)!==term||normalizeImportPos(existingCard.type)!==pos||normalizeImportTerm(existingCard.type)!==normalizeImportTerm(card.type)))throw Error('Conflicting content for the same external card identity.');
  cards.set(cardKey,card);
  const candidates=byTerm.get(term)??[];
  let entry=entries.get(entryKey);
  if(!entry){
   const candidate=candidates.length===1?candidates[0]:undefined;
   const status=!candidates.length?'new-draft':candidate&&pos&&normalizeImportPos(candidate.pos)===pos?'reuse-candidate':'manual-review';
   const reason=status==='new-draft'?'not-in-library':candidates.length>1?'multiple-library-rows':!pos||!normalizeImportPos(candidate?.pos)?'unknown-part-of-speech':status==='manual-review'?'different-part-of-speech':'exact-term-and-part-of-speech; sense still needs review';
   entry={key:entryKey,word:card.word.trim(),pos,sourceTypes:[],cardKeys:[],status,reason,candidateWordIds:candidates.map(w=>w.id).sort((a,b)=>a-b),...(status==='reuse-candidate'?{wordId:candidate!.id}:{}),requiresSenseReview:true};entries.set(entryKey,entry);
  }
  if(!entry.sourceTypes.includes(card.type))entry.sourceTypes.push(card.type);
  if(!entry.cardKeys.includes(cardKey))entry.cardKeys.push(cardKey);
  const membershipKey=JSON.stringify([cardKey,card.deckId,card.groupId]);memberships.set(membershipKey,{cardKey,entryKey,deckId:card.deckId,groupId:card.groupId});
 }
 const plannedDecks=[...decks.values()].map(deck=>({externalId:deck.id,name:deck.nameVi||deck.name,sourceUrl:deck.url,status:'draft' as const,groups:deck.groups.map(group=>{
  const keys=[...new Set([...memberships.values()].filter(m=>m.deckId===deck.id&&m.groupId===group.id).map(m=>m.entryKey))];
  const candidateWordIds=[...new Set(keys.flatMap(key=>{const e=entries.get(key)!;return e.wordId?[e.wordId]:[];}))];
  return {externalId:group.id,name:group.name,entryKeys:keys,candidateWordIds,pendingEntryKeys:keys.filter(key=>entries.get(key)!.status!=='reuse-candidate'),suggestedStages:Array.from({length:Math.ceil(candidateWordIds.length/10)},(_,index)=>({position:index+1,candidateWordIds:candidateWordIds.slice(index*10,index*10+10),publishable:false}))};
 })}));
 for(const entry of entries.values()){entry.sourceTypes.sort();entry.cardKeys.sort();}
 const sortedEntries=[...entries.values()].sort((a,b)=>a.key.localeCompare(b.key));
 return {version:1,mode:'read-only-dry-run' as const,summary:{libraryRows:library.length,libraryDuplicateTerms:[...byTerm.values()].filter(rows=>rows.length>1).length,sourceOccurrences:source.words.length,uniqueSourceCards:cards.size,uniqueSourceTerms:new Set(source.words.map(c=>normalizeImportTerm(c.word))).size,sourceLexemes:entries.size,newDistinctTerms:new Set([...entries.values()].filter(e=>e.status==='new-draft').map(e=>normalizeImportTerm(e.word))).size,reuseCandidates:sortedEntries.filter(e=>e.status==='reuse-candidate').length,manualReview:sortedEntries.filter(e=>e.status==='manual-review').length,newDrafts:sortedEntries.filter(e=>e.status==='new-draft').length,decks:decks.size,groups:plannedDecks.reduce((n,d)=>n+d.groups.length,0),plannedDatabaseWrites:0},entries:sortedEntries,memberships:[...memberships.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({key,...value})),decks:plannedDecks,policy:{wordUpdates:false,wordDeletes:false,srsUpdates:false,automaticPublish:false,newWordStatus:'draft',reuseRequiresSenseReview:true,sourceRichContentCopied:false}};
}
