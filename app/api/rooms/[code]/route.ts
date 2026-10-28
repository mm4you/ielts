import { z } from 'zod';
import { actOnRoom, getRoom } from '@/lib/rooms/store';
import { roomBody, roomCode, roomFailure, roomIdentity, roomResponse } from '@/lib/rooms/http';
import { RoomError } from '@/lib/rooms/engine';
import { MAX_ROOM_QUESTIONS } from '@/lib/rooms/settings';

type Context = { params: Promise<{ code: string }> };
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('join') }), z.object({ action: z.literal('start') }), z.object({ action: z.literal('leave') }),
  z.object({ action: z.literal('ready'), ready: z.boolean() }),
  z.object({ action: z.literal('answer'), question: z.number().int().min(0).max(MAX_ROOM_QUESTIONS - 1), choice: z.number().int().min(0).max(3) }),
]);
export async function GET(request: Request, context: Context) {
  try { return roomResponse(await getRoom(await roomIdentity(request), roomCode((await context.params).code))); }
  catch (error) { return roomFailure(error); }
}
export async function POST(request: Request, context: Context) {
  try {
    const user = await roomIdentity(request), code = roomCode((await context.params).code);
    const result = actionSchema.safeParse(await roomBody(request));
    if (!result.success) throw new RoomError('Thao tác không hợp lệ.');
    return roomResponse(await actOnRoom(user, code, result.data));
  } catch (error) { return roomFailure(error); }
}
