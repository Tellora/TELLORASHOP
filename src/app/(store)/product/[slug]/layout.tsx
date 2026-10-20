import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import { getAllSettings, siteUrl } from '@/lib/settings';
import { normalizeImages } from '@/lib/images';

interface Row {
  name: string; slug: string; short_description: string | null; description: string | null; price: number; quantity: number; track_inventory: number;
  sku: string | null; images: string; seo_title: string | null; seo_description: string | null; category_name: string | null;
  avg_rating: number; review_count: number;
}

function loadProduct(slug: string): Row | undefined {
  return getDb().prepare(`
    SELECT p.name, p.slug, p.short_description, p.description, p.price, p.quantity, p.track_inventory, p.sku, p.images, p.seo_title, p.seo_description,
           c.name AS category_name,
           (SELECT COALESCE(AVG(r.rating), 0) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) AS avg_rating,
           (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) AS review_count
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE (p.slug = ? OR p.id = ?) AND p.is_active = 1
  `).get(slug, slug) as Row | undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = loadProduct(slug);
  if (!p) return { title: 'Product not found', robots: { index: false } };
  const image = normalizeImages(p.images)[0];
  const description = p.seo_description || p.short_description || (p.description || '').slice(0, 160);
  return {
    title: p.seo_title || p.name,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.seo_title || p.name, description, type: 'website', ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = loadProduct(slug);
  if (!p) notFound();

  const settings = getAllSettings();
  const inStock = !p.track_inventory || p.quantity > 0;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.short_description || p.description || undefined,
    sku: p.sku || undefined,
    image: normalizeImages(p.images),
    category: p.category_name || undefined,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl()}/product/${p.slug}`,
      priceCurrency: settings.currency || 'USD',
      price: p.price.toFixed(2),
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(p.review_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.avg_rating.toFixed(1), reviewCount: p.review_count } } : {}),
  };

  return (
    <>
      {/* "<" is escaped so product text can never close the script tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      {children}
    </>
  );
}
