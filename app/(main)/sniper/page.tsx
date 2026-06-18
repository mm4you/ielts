import SniperClient from './SniperClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sniper Mode - IELTS Vocab',
  description: 'Bắn Hạ Từ Vựng',
};

export default async function SniperPage({ searchParams }: { searchParams: Promise<{ collectionId?: string }> }) {
  const resolvedParams = await searchParams;
  return <SniperClient collectionId={resolvedParams.collectionId} />;
}
