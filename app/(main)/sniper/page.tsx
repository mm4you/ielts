import SniperClient from '@/components/SniperClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sniper Mode - IELTS Vocab',
  description: 'Bắn Hạ Từ Vựng',
};

export default function SniperPage() {
  return <SniperClient />;
}
