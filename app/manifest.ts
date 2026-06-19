import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IELTS Vocab - Vũ Trụ Game Học Thuật',
    short_name: 'Vocab',
    description: 'Học từ vựng IELTS với các chế độ game sinh tồn và phương pháp lặp lại ngắt quãng SM2.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f4f0',
    theme_color: '#ef4444',
    icons: [
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
