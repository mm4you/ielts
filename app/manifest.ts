import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IELTS Vocab',
    short_name: 'Vocab',
    description: 'Học và ôn tập từ vựng IELTS.',
    id: '/',
    scope: '/',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f6f8',
    theme_color: '#0f6cbd',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
