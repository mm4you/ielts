import type { RoomState } from './types';
import { assertRoomMember, settleRoom } from './engine';

export type RoomSnapshot = { state: RoomState; now: number };
/** Ordinary polls are snapshot reads. Expiration rechecks fresh state under the row lock. */
export async function pollRoom(
  userId: string,
  read: (lock: boolean) => Promise<RoomSnapshot>,
  save: (state: RoomState) => Promise<unknown>,
): Promise<RoomSnapshot> {
  let row = await read(false);
  const assertMember = () => {
    assertRoomMember(row.state,userId);
  };
  assertMember();
  if (!settleRoom(row.state, row.now)) return row;
  row = await read(true);
  assertMember();
  if (settleRoom(row.state, row.now)) await save(row.state);
  return row;
}
