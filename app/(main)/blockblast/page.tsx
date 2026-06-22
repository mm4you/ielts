import { Suspense } from 'react';
import BlockBlastWrapper from './BlockBlastWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Block Blast - IELTS Vocab',
  description: 'Trí Tuệ Sinh Tồn',
};

export default function BlockBlastPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <p className="text-xl font-bold animate-pulse">Đang tải xếp hình...</p>
        </div>
      </div>
    }>
      <BlockBlastWrapper />
    </Suspense>
  );
}
