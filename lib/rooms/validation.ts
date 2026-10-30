import { z } from 'zod';
import { MAX_ROOM_PLAYERS, DEFAULT_ROOM_PLAYERS, ROOM_MODES, ROOM_DURATIONS, ROOM_QUESTION_COUNTS } from './settings';
export const createRoomSchema=z.object({
  maxPlayers:z.number().int().min(2).max(MAX_ROOM_PLAYERS).default(DEFAULT_ROOM_PLAYERS),
  title:z.string().trim().min(1).max(60),mode:z.enum(ROOM_MODES).default('quiz'),
  durationSeconds:z.number().int().refine(n=>ROOM_DURATIONS.some(d=>d===n)).default(90),
  level:z.enum(['all','A1','A2','B1','B2','C1','C2']),
  questionCount:z.number().int().refine(n=>ROOM_QUESTION_COUNTS.some(c=>c===n)),
  secondsPerQuestion:z.union([z.literal(10),z.literal(15),z.literal(20)]),
});
