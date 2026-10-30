import type { RoomState } from './types';
import { expireGames } from './games';
import { RoomError } from './error';

export type RoomSnapshot = { state: RoomState; now: number };
/** Ordinary polls are snapshot reads. Expiration rechecks fresh state under the row lock. */
export async function pollRoom(
  userId: string,
  read: (lock: boolean) => Promise<RoomSnapshot>,
  save: (state: RoomState) => Promise<unknown>,
): Promise<RoomSnapshot> {
  let row = await read(false);
  const assertMember = () => {
    if (!row.state.players.some(player => player.id === userId)) throw new RoomError('Bạn chưa tham gia phòng.', 403);
  };
  assertMember();
  if (!expireGames(row.state, row.now)) return row;
  row = await read(true);
  assertMember();
  if (expireGames(row.state, row.now)) await save(row.state);
  return row;
}
