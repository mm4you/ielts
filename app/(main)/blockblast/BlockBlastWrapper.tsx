'use client';


import AppLoading from '@/components/AppLoading';
import dynamic from 'next/dynamic';

const BlockBlastClient = dynamic(() => import('./BlockBlastClient'), {
  ssr: false,
  loading: () => <AppLoading contained label="Đang chuẩn bị trò chơi" />,
});

export default function BlockBlastWrapper() {
  return <BlockBlastClient />;
}
