import type { RoomState } from './types';
export const roomRoundId=(state:RoomState)=>state.roundId??'legacy-'+(state.startedAt??'waiting');
