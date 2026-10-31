import { z } from 'zod';
import { actOnRoom, getRoom } from '@/lib/rooms/store';
import { roomBody, roomCode, roomFailure, roomIdentity, roomResponse } from '@/lib/rooms/http';
import { RoomError } from '@/lib/rooms/engine';
import { MAX_ROOM_QUESTIONS } from '@/lib/rooms/settings';
import { roomSettingsSchema } from '@/lib/rooms/validation';

type Context = { params: Promise<{ code: string }> };
const actionSchema = z.union([
  z.object({ action: z.literal('join') }), z.object({ action: z.literal('start') }), z.object({ action: z.literal('leave') }),
  z.object({ action: z.literal('ready'), ready: z.boolean() }),
  z.object({action:z.literal('settings'),settings:roomSettingsSchema}),z.object({action:z.literal('rematch'),settings:roomSettingsSchema.optional()}),
  z.object({action:z.enum(['kick','transfer']),targetId:z.string().min(1).max(100)}),
  z.object({ action: z.literal('answer'), question: z.number().int().min(0).max(MAX_ROOM_QUESTIONS - 1), choice: z.number().int().min(0).max(3) }),
  z.object({ action: z.literal('play'), revision: z.number().int().min(0).max(10000), kind: z.literal('choice'), choice: z.number().int().min(0).max(3) }),
  z.object({ action: z.literal('play'), revision: z.number().int().min(0).max(10000), kind: z.literal('type'), text: z.string().min(1).max(40) }),
  z.object({ action: z.literal('play'), revision: z.number().int().min(0).max(10000), kind: z.literal('flip'), card: z.number().int().min(0).max(11) }),
  z.object({ action: z.literal('play'), revision: z.number().int().min(0).max(10000), kind: z.literal('place'), piece: z.number().int().min(0).max(2), row: z.number().int().min(0).max(7), column: z.number().int().min(0).max(7) }),
]).and(z.object({roundId:z.string().min(1).max(100).optional()}));
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
