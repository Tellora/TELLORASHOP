import type { MetadataRoute } from 'next';
import { getAllSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default function manifest(): MetadataRoute.Manifest {
  const s = getAllSettings();
  return {
    name: s.store_name || 'Store',
    short_name: s.store_name || 'Store',
    description: s.store_tagline || '',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFDF9',
    theme_color: '#E5E535',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
