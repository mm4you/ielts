'use client';

import dynamic from 'next/dynamic';

const BlockBlastClient = dynamic(() => import('./BlockBlastClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="panel max-w-md w-full text-center">
        <p className="text-xl font-bold animate-pulse">Đang tải xếp hình...</p>
      </div>
    </div>
  ),
});

export default function BlockBlastWrapper() {
  return <BlockBlastClient />;
}
