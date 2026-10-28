'use client';

import AppLoading from '@/components/AppLoading';
import dynamic from 'next/dynamic';

const SniperClient = dynamic(() => import('./SniperClient'), {
  ssr: false,
  loading: () => <AppLoading contained label="Đang chuẩn bị trò chơi" />,
});

export default function SniperWrapper({ collectionId }: { collectionId?: string }) {
  return <SniperClient collectionId={collectionId} />;
}
