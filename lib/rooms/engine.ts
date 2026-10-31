import type { RoomState, RoomView, RoomPhase } from './types';
import { RoomError } from './error';
import { expireGames, gameDeadline, gameMode, gameView } from './games';
import { roomCapacity } from './settings';
import { roomRoundId } from './round';
import { logRoomWord } from './learning';
export { RoomError } from './error';

/** Called only while the store holds the room row lock. Reconnect is idempotent. */
export function joinRoomPlayer(state: RoomState, user: {id:string;name?:string|null}, now:number) {
  const phase=phaseAt(state,now).phase;
  if(state.removedIds?.includes(user.id))throw new RoomError('Chủ phòng đã mời bạn ra khỏi phòng.',410);
  if(phase==='closed')throw new RoomError('Chủ phòng đã đóng phòng.',410);
  const existing=state.players.find(p=>p.id===user.id);
  if(existing){existing.left=false;return;}
  if(phase!=='waiting')throw new RoomError('Trận đấu đã bắt đầu.',409);
  if(state.players.length>=roomCapacity(state.settings))throw new RoomError('Phòng đã đầy.',409);
  state.players.push({id:user.id,name:user.name?.trim().slice(0,60)||'Người chơi',ready:false,left:false});
}

export function phaseAt(state: RoomState, now: number): { phase: RoomPhase; index: number; nextAt: number | null } {
  if (state.closed) return { phase: 'closed', index: 0, nextAt: null };
  if(state.finishedAt!==undefined)return {phase:'finished',index:Math.max(0,state.questions.length-1),nextAt:null};
  if (state.startedAt === null) return { phase: 'waiting', index: 0, nextAt: null };
  if (now < state.startedAt) return { phase: 'countdown', index: 0, nextAt: state.startedAt };
  if (gameMode(state) !== 'quiz') {
    const finished = now >= gameDeadline(state) || state.players.filter(p => !p.left).every(p => state.games?.[p.id]?.finished);
    return { phase: finished ? 'finished' : 'question', index: 0, nextAt: finished ? null : gameDeadline(state) };
  }
  const round = state.settings.secondsPerQuestion * 1000 + 3000;
  const index = Math.floor((now - state.startedAt) / round);
  if (index >= state.questions.length) return { phase: 'finished', index: state.questions.length - 1, nextAt: null };
  const deadline = state.startedAt + index * round + state.settings.secondsPerQuestion * 1000;
  return { phase: now < deadline ? 'question' : 'reveal', index, nextAt: now < deadline ? deadline : state.startedAt + (index + 1) * round };
}

export function answerQuestion(state: RoomState, userId: string, index: number, choice: number, now: number) {
  if (gameMode(state) !== 'quiz') throw new RoomError('Phòng này không dùng trả lời trắc nghiệm theo vòng.');
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) throw new RoomError('Đáp án không hợp lệ.');
  const player = state.players.find(p => p.id === userId && !p.left);
  if (!player) throw new RoomError('Bạn chưa tham gia phòng.', 403);
  const current = phaseAt(state, now);
  if (current.phase !== 'question' || current.index !== index) throw new RoomError('Câu hỏi đã kết thúc.', 409);
  const answers = state.answers[index] ??= {};
  if (answers[userId]) throw new RoomError('Bạn đã trả lời câu này.', 409);
  const duration = state.settings.secondsPerQuestion * 1000;
  const remaining = Math.max(0, (current.nextAt! - now) / duration);
  answers[userId] = { choice, points: choice === state.questions[index].correctIndex ? 100 + Math.floor(remaining * 50) : 0 };
  logRoomWord(state,userId,index,choice===state.questions[index].correctIndex?'correct':'wrong',state.questions[index].choices[choice]);
}

export function assertRoomMember(state:RoomState,userId:string){
 if(state.removedIds?.includes(userId))throw new RoomError('Chủ phòng đã mời bạn ra khỏi phòng.',410);
 if(!state.players.some(p=>p.id===userId&&!p.left))throw new RoomError('Bạn chưa tham gia phòng.',403);
}
export function settleRoom(state:RoomState,now:number){
 let changed=expireGames(state,now);
 if(state.startedAt!==null&&state.finishedAt===undefined&&phaseAt(state,now).phase==='finished'){state.finishedAt=now;changed=true;}
 return changed;
}
export function rankedPlayers(state:RoomState,now:number,through?:number){
 const current=phaseAt(state,now);const published=through??(current.phase==='reveal'||current.phase==='finished'?current.index:current.index-1);
 const players=state.players.map(p=>{const progress=state.games?.[p.id];let score=0,correct=0;
 if(gameMode(state)!=='quiz')return {...p,score:progress?.score??0,correct:progress?.correct??0,answered:!!progress?.finished};
 for(let i=0;i<=published;i++){const a=state.answers[i]?.[p.id];if(a){score+=a.points;if(a.points>0)correct++;}}
 return {...p,score,correct,answered:!!state.answers[current.index]?.[p.id]};}).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
 return players.map(p=>({...p,rank:players.findIndex(other=>other.score===p.score)+1}));
}

export function roomView(code: string, state: RoomState, meId: string, now: number): RoomView {
  assertRoomMember(state,meId);
  const { phase, index, nextAt } = phaseAt(state, now);
  const publishedThrough = phase === 'reveal' || phase === 'finished' ? index : index - 1;
  const before=gameMode(state)==='quiz'?Object.fromEntries(rankedPlayers(state,now,publishedThrough-1).map(p=>[p.id,p.rank])):state.previousRanks??{};
  const players=rankedPlayers(state,now).map(p=>({...p,rankDelta:(before[p.id]??p.rank)-p.rank}));
  const q = gameMode(state) === 'quiz' && (phase === 'question' || phase === 'reveal') ? state.questions[index] : null;
  return {
    code, title: state.title, hostId: state.hostId, meId, settings: { ...state.settings, maxPlayers: roomCapacity(state.settings) },
    phase, serverNow: now, nextAt, questionNumber: state.startedAt === null ? 0 : index + 1, players,
    roundId:roomRoundId(state),sourceLabel:state.sourceLabel||'Kho từ vựng',rankingEvent:gameMode(state)==='quiz'?'Sau câu '+Math.max(0,publishedThrough+1):'Lượt ghi điểm gần nhất',
    ...(state.lastFinishedRoundId&&state.lastFinishedParticipants?.includes(meId)?{previousReviewSessionId:'room:'+code+':'+state.lastFinishedRoundId+':'+meId}:{}),
    question: q ? { word: q.word, choices: q.choices, ...(phase === 'reveal' ? { correctIndex: q.correctIndex } : {}), ...(state.answers[index]?.[meId] ? { myChoice: state.answers[index][meId].choice } : {}) } : null,
    ...(gameMode(state) !== 'quiz' ? { game: gameView(state, meId, now) } : {}),
  };
}
