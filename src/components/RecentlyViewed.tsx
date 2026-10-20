'use client';
import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';

const KEY = 'recently_viewed';
const MAX = 8;

type Viewed = React.ComponentProps<typeof ProductCard>['product'];

function read(): Viewed[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Remember a product so it shows up in the "Recently viewed" strip. */
export function trackRecentlyViewed(product: Viewed) {
  const next = [product, ...read().filter(p => p.id !== product.id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export default function RecentlyViewed({ excludeId, title = 'RECENTLY VIEWED' }: { excludeId?: string; title?: string }) {
  const [items, setItems] = useState<Viewed[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(read().filter(p => p.id !== excludeId).slice(0, 4));
  }, [excludeId]);

  if (items.length === 0) return null;

  return (
    <section className="section" style={{ borderTop: '3px solid var(--border-color)' }}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="grid grid-4">
        {items.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
