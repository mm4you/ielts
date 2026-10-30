import { createRoomSchema } from '@/lib/rooms/validation';
import { createRoom } from '@/lib/rooms/store';
import { roomBody, roomFailure, roomIdentity, roomResponse } from '@/lib/rooms/http';
import { RoomError } from '@/lib/rooms/engine';

const schema=createRoomSchema;
export async function POST(request: Request) {
  try {
    const user = await roomIdentity(request);
    const result = schema.safeParse(await roomBody(request));
    if (!result.success) throw new RoomError('Kiểm tra tên phòng và cài đặt.');
    const { title, ...settings } = result.data;
    return roomResponse(await createRoom(user, title, settings));
  } catch (error) { return roomFailure(error); }
}
