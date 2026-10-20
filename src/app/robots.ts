import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/account', '/cart', '/checkout', '/order-confirmation', '/reset-password'] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
