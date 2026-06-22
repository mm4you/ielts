'use client';

import dynamic from 'next/dynamic';

const SniperClient = dynamic(() => import('./SniperClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="panel max-w-md w-full text-center">
        <p className="text-xl font-bold animate-pulse">Đang nạp đạn...</p>
      </div>
    </div>
  ),
});

export default function SniperWrapper({ collectionId }: { collectionId?: string }) {
  return <SniperClient collectionId={collectionId} />;
}
