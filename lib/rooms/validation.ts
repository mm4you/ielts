import { z } from 'zod';
import { MAX_ROOM_PLAYERS, DEFAULT_ROOM_PLAYERS, ROOM_MODES, ROOM_DURATIONS, ROOM_QUESTION_COUNTS } from './settings';
import { TOPICS } from '@/types';
const fields={
  maxPlayers:z.number().int().min(2).max(MAX_ROOM_PLAYERS).default(DEFAULT_ROOM_PLAYERS),
  mode:z.enum(ROOM_MODES).default('quiz'),
  topic:z.enum(['all',...TOPICS]).default('all'),sourceKind:z.enum(['all','collection']).default('all'),collectionId:z.string().min(1).max(100).optional(),
  durationSeconds:z.number().int().refine(n=>ROOM_DURATIONS.some(d=>d===n)).default(90),
  level:z.enum(['all','A1','A2','B1','B2','C1','C2']),
  questionCount:z.number().int().refine(n=>ROOM_QUESTION_COUNTS.some(c=>c===n)),
  secondsPerQuestion:z.union([z.literal(10),z.literal(15),z.literal(20)]),
};
const validSource=(v:{sourceKind:string;collectionId?:string})=>v.sourceKind!=='collection'||!!v.collectionId;
export const roomSettingsSchema=z.object(fields).refine(validSource,{message:'Chọn bộ từ của bạn.'});
export const createRoomSchema=z.object({...fields,title:z.string().trim().min(1).max(60)}).refine(validSource,{message:'Chọn bộ từ của bạn.'});
