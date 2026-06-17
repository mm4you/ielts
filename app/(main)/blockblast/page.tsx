import BlockBlastClient from '@/components/BlockBlastClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Block Blast - IELTS Vocab',
  description: 'Trí Tuệ Sinh Tồn',
};

export default function BlockBlastPage() {
  return <BlockBlastClient />;
}
