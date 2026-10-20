import type { MetadataRoute } from 'next';
import { getDb } from '@/lib/db';
import { siteUrl } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const db = getDb();
  const products = db.prepare('SELECT slug, updated_at FROM products WHERE is_active = 1').all() as Array<{ slug: string; updated_at: string }>;
  const categories = db.prepare('SELECT slug FROM categories WHERE is_active = 1').all() as Array<{ slug: string }>;
  const pages = db.prepare('SELECT slug, updated_at FROM pages WHERE is_published = 1').all() as Array<{ slug: string; updated_at: string }>;

  const stamp = (s?: string) => (s ? new Date(s.replace(' ', 'T') + 'Z') : undefined);
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/track-order`, changeFrequency: 'yearly', priority: 0.3 },
    ...categories.map(c => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ...products.map(p => ({ url: `${base}/product/${p.slug}`, lastModified: stamp(p.updated_at), changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...pages.map(p => ({ url: `${base}/page/${p.slug}`, lastModified: stamp(p.updated_at), changeFrequency: 'yearly' as const, priority: 0.3 })),
  ];
}
