import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { Suspense } from 'react';
import BlockBlastWrapper from './BlockBlastWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Block Blast - IELTS Vocab',
  description: 'Trí Tuệ Sinh Tồn',
};

export default function BlockBlastPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <BlockBlastWrapper />
    </Suspense>
  );
}
