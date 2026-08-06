'use client';
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string; name: string; slug: string; price: number; compare_at_price: number;
  images: string; category_name: string; category_slug: string; avg_rating: number;
  review_count: number; is_featured: number; quantity: number;
}

interface Category {
  id: string; name: string; slug: string; product_count: number;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const featured = searchParams.get('featured') || '';

  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '12');
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (featured) params.set('featured', featured);

    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, category, sort, search, minPrice, maxPrice, featured]);

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    if (key !== 'page') params.set('page', '1');
    router.push(`/shop?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localMinPrice) params.set('minPrice', localMinPrice); else params.delete('minPrice');
    if (localMaxPrice) params.set('maxPrice', localMaxPrice); else params.delete('maxPrice');
    params.set('page', '1');
    router.push(`/shop?${params.toString()}`);
  };

  return (
    <>
      {/* Header Banner */}
      <div style={{ background: 'var(--accent-yellow)', borderBottom: '4px solid #000', padding: '2.5rem 0' }}>
        <div className="container">
          <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '0.75rem', transform: 'rotate(-2deg)' }}>
            COLLECTION 2026
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontStyle: 'italic', fontWeight: 900 }}>
            {category ? categories.find(c => c.slug === category)?.name?.toUpperCase() || 'SHOP' : search ? `SEARCH: "${search.toUpperCase()}"` : featured ? 'FEATURED PRODUCTS' : 'ALL PRODUCTS'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            Showing {pagination.total} raw curated items
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '2.5rem 0 5rem' }}>
        
        {/* Active Filter Chips */}
        {(category || search || minPrice || maxPrice || featured) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', background: '#FFF', padding: '1rem', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000' }}>
            <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>ACTIVE FILTERS:</span>
            {category && (
              <span className="badge badge-purple" style={{ cursor: 'pointer' }} onClick={() => updateFilter('category', '')}>
                CAT: {category.toUpperCase()} ✕
              </span>
            )}
            {search && (
              <span className="badge badge-blue" style={{ cursor: 'pointer' }} onClick={() => updateFilter('search', '')}>
                SEARCH: &quot;{search}&quot; ✕
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="badge badge-green" style={{ cursor: 'pointer' }} onClick={() => { setLocalMinPrice(''); setLocalMaxPrice(''); updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}>
                PRICE: ${minPrice || '0'} - ${maxPrice || '∞'} ✕
              </span>
            )}
            {featured && (
              <span className="badge badge-yellow" style={{ cursor: 'pointer' }} onClick={() => updateFilter('featured', '')}>
                FEATURED ONLY ✕
              </span>
            )}
            <button className="btn btn-sm btn-danger" onClick={() => router.push('/shop')} style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem' }}>
              CLEAR ALL
            </button>
          </div>
        )}

        <div className="shop-layout">
          {/* SIDEBAR FILTERS */}
          <aside className="shop-sidebar">
            {/* Categories */}
            <div className="filter-group" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', overflow: 'hidden' }}>
              <div className="filter-group-header" style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000', padding: '0.75rem 1rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Categories</div>
              <div className="filter-group-body" style={{ padding: '0.75rem 1rem' }}>
                <label className="filter-option" onClick={() => updateFilter('category', '')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: !category ? 800 : 500 }}>
                  <input type="radio" name="category" checked={!category} readOnly /> All Categories
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="filter-option" onClick={() => updateFilter('category', cat.slug)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontWeight: category === cat.slug ? 800 : 500 }}>
                    <input type="radio" name="category" checked={category === cat.slug} readOnly />
                    {cat.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#666', marginLeft: 'auto' }}>({cat.product_count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="filter-group mt-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', overflow: 'hidden' }}>
              <div className="filter-group-header" style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000', padding: '0.75rem 1rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Price Range</div>
              <div className="filter-group-body" style={{ padding: '1rem' }}>
                <div className="price-range-inputs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input className="input" type="number" placeholder="Min $" value={localMinPrice} onChange={e => setLocalMinPrice(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.85rem' }} />
                  <span>—</span>
                  <input className="input" type="number" placeholder="Max $" value={localMaxPrice} onChange={e => setLocalMaxPrice(e.target.value)} style={{ padding: '0.5rem', fontSize: '0.85rem' }} />
                </div>
                <button className="btn btn-sm btn-primary btn-full mt-1" onClick={applyPriceFilter} style={{ boxShadow: '2px 2px 0px #000' }}>APPLY FILTER</button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="filter-group mt-2" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', overflow: 'hidden' }}>
              <div className="filter-group-header" style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000', padding: '0.75rem 1rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic' }}>Quick Filters</div>
              <div className="filter-group-body" style={{ padding: '1rem' }}>
                <label className="filter-option" onClick={() => updateFilter('featured', featured ? '' : 'true')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <input type="checkbox" checked={!!featured} readOnly /> Featured Only
                </label>
              </div>
            </div>

            {/* Clear Filters */}
            <button className="btn btn-full btn-sm mt-2 btn-danger" onClick={() => router.push('/shop')} style={{ boxShadow: '3px 3px 0px #000' }}>
              RESET ALL FILTERS
            </button>
          </aside>

          {/* PRODUCTS GRID */}
          <div>
            <div className="shop-toolbar" style={{ background: '#FFF', border: '3px solid #000', borderRadius: '8px', boxShadow: '3px 3px 0px #000', padding: '0.75rem 1.25rem', marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <span className="shop-toolbar-count" style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                Showing {products.length} of {pagination.total} products
              </span>
              <div className="shop-toolbar-sort" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>SORT BY:</label>
                <select className="input" value={sort} onChange={e => updateFilter('sort', e.target.value)} style={{ padding: '0.4rem 2rem 0.4rem 0.8rem', fontSize: '0.8rem', width: 'auto', boxShadow: 'none' }}>
                  <option value="newest">Newest Arrivals</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name_asc">Name: A → Z</option>
                  <option value="name_desc">Name: Z → A</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-spinner"><div className="spinner" /></div>
            ) : products.length === 0 ? (
              <div className="empty-state card" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#FFF', border: '3px solid #000', boxShadow: '5px 5px 0px #000', borderRadius: '16px' }}>
                <div className="empty-state-icon" style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '2.5rem', color: '#CCC', marginBottom: '1rem' }}>NO MATCH</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>NO PRODUCTS FOUND</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try broadening your search query or price range.</p>
                <button className="btn btn-primary" onClick={() => router.push('/shop')} style={{ boxShadow: '3px 3px 0px #000' }}>CLEAR FILTERS</button>
              </div>
            ) : (
              <>
                <div className="grid grid-3">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                    <button className="pagination-btn" disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))} style={{ border: '3px solid #000', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', background: '#FFF' }}>← PREV</button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => updateFilter('page', String(p))} style={{ border: '3px solid #000', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', background: p === page ? 'var(--accent-yellow)' : '#FFF', boxShadow: p === page ? '3px 3px 0px #000' : 'none' }}>
                        {p}
                      </button>
                    ))}
                    <button className="pagination-btn" disabled={page >= pagination.totalPages} onClick={() => updateFilter('page', String(page + 1))} style={{ border: '3px solid #000', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', background: '#FFF' }}>NEXT →</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="loading-spinner"><div className="spinner" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
