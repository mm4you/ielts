import type { Metadata } from 'next';
import RoomClient from './RoomClient';
import { notFound } from 'next/navigation';
export const metadata: Metadata = { title: 'Thi đấu từ vựng — IELTS Vocab' };
export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-HJ-NP-Z2-9]{6}$/i.test(code)) notFound();
  return <RoomClient code={code.toUpperCase()} />;
}
