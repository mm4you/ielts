import { z } from 'zod';
import { createRoom } from '@/lib/rooms/store';
import { roomBody, roomFailure, roomIdentity, roomResponse } from '@/lib/rooms/http';
import { RoomError } from '@/lib/rooms/engine';
import { ROOM_QUESTION_COUNTS } from '@/lib/rooms/settings';

const schema = z.object({ title: z.string().trim().min(1).max(60), level: z.enum(['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']), questionCount: z.number().int().refine(value => ROOM_QUESTION_COUNTS.some(count => count === value)), secondsPerQuestion: z.union([z.literal(10), z.literal(15), z.literal(20)]) });
export async function POST(request: Request) {
  try {
    const user = await roomIdentity(request);
    const result = schema.safeParse(await roomBody(request));
    if (!result.success) throw new RoomError('Kiểm tra tên phòng và cài đặt.');
    const { title, ...settings } = result.data;
    return roomResponse(await createRoom(user, title, settings));
  } catch (error) { return roomFailure(error); }
}
