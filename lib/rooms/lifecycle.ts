import type { RoomSettings, RoomState } from './types';
import { RoomError } from './error';
import { phaseAt } from './engine';
import { roomRoundId } from './round';
import { roomCapacity } from './settings';
export function manageRoom(state:RoomState,actorId:string,action:'kick'|'transfer',targetId:string,now:number){
 if(state.hostId!==actorId)throw new RoomError('Chỉ chủ phòng được quản lý người chơi.',403);
 const target=state.players.find(p=>p.id===targetId&&!p.left)??state.observers?.find(p=>p.id===targetId);
 if(!target||targetId===actorId)throw new RoomError('Chọn một người chơi khác trong phòng.');
 if(action==='kick'){
  if(!['waiting','finished'].includes(phaseAt(state,now).phase))throw new RoomError('Bạn có thể mời người ra ở sảnh hoặc sau trận.',409);
  state.removedIds=[...new Set([...(state.removedIds??[]),targetId])];state.players=state.players.filter(p=>p.id!==targetId);state.observers=state.observers?.filter(p=>p.id!==targetId);
  }else{
  if(state.hostOnly){
    if(!['waiting','finished'].includes(phaseAt(state,now).phase))throw new RoomError('Chuyển chủ phòng ở sảnh hoặc sau trận để không gián đoạn người chơi.',409);
    state.observers=[...(state.observers??[]).filter(p=>p.id!==targetId&&p.id!==actorId),{id:actorId,name:state.hostName??'Chủ phòng'}];
    state.players=state.players.filter(p=>p.id!==targetId);state.hostName=target.name;
  }
  state.hostId=targetId;if('ready' in target)target.ready=true;
 }
}
export function resetRoom(state:RoomState,actorId:string,settings:RoomSettings,roundId:string,label:string,now:number){
 if(state.hostId!==actorId)throw new RoomError('Chỉ chủ phòng được chuẩn bị trận mới.',403);
 if(!['waiting','finished'].includes(phaseAt(state,now).phase))throw new RoomError('Chờ trận hiện tại kết thúc nhé.',409);
 const players=state.players.filter(p=>!p.left&&p.id!==state.hostId);
 state.hostName=state.hostName??state.players.find(p=>p.id===state.hostId)?.name??'Chủ phòng';state.hostOnly=true;
 if(players.length>roomCapacity(settings))throw new RoomError('Sức chứa mới nhỏ hơn số người đang trong phòng.');
 if(phaseAt(state,now).phase==='finished'&&state.questions.some(q=>q.wordId)){state.lastFinishedRoundId=roomRoundId(state);state.lastFinishedParticipants=state.finishedParticipants??state.players.map(p=>p.id);}
 state.previousRoundId=roomRoundId(state);state.roundId=roundId;state.settings=settings;state.sourceLabel=label;state.players=players.map(p=>({...p,ready:p.id===state.hostId}));
 state.startedAt=null;state.questions=[];state.answers={};state.learning={};state.rankRevision=0;
 delete state.finishedAt;delete state.finishedParticipants;delete state.games;delete state.decks;delete state.previousRanks;
}
