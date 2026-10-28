import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { RoomError } from './engine';

export async function roomIdentity(request: Request) {
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    if (origin) {
      const target = new URL(request.url);
      // Next may use an internal hostname; Host retains the browser-facing authority.
      const authority = request.headers.get('host') || target.host;
      let source: URL;
      try { source = new URL(origin); } catch { throw new RoomError('Yêu cầu không hợp lệ.', 403); }
      if (!['http:', 'https:'].includes(source.protocol) || source.host !== authority) throw new RoomError('Yêu cầu không hợp lệ.', 403);
    }
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new RoomError('Cần dữ liệu JSON.', 415);
    if (Number(request.headers.get('content-length') || 0) > 2048) throw new RoomError('Yêu cầu quá lớn.', 413);
  }
  const session = await auth();
  if (!session?.user?.id) throw new RoomError('Đăng nhập để tham gia phòng.', 401);
  return { id: session.user.id, name: session.user.name };
}
export function roomCode(value: string) {
  const code = value.toUpperCase();
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) throw new RoomError('Mã phòng gồm 6 ký tự.', 400);
  return code;
}
export async function roomBody(request: Request) {
  const text = await request.text();
  if (text.length > 2048) throw new RoomError('Yêu cầu quá lớn.', 413);
  try { return JSON.parse(text) as unknown; } catch { throw new RoomError('Dữ liệu không hợp lệ.'); }
}
export function roomResponse(data: unknown) { return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } }); }
export function roomFailure(error: unknown) {
  if (error instanceof RoomError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error('Room request failed', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json({ error: 'Chưa kết nối được phòng. Vui lòng thử lại.' }, { status: 503 });
}
