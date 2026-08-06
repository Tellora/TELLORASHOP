'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string; name: string; slug: string; price: number; compare_at_price: number;
  images: string; category_name: string; category_slug: string; avg_rating: number;
  review_count: number; is_featured: number; quantity: number;
}

interface Category {
  id: string; name: string; slug: string; description: string; product_count: number;
}

// Category cards mapping style directly to Screenshot 5 "Core Skills" colors
const categoryCardStyles: Record<string, { bg: string; iconBg: string; textColor: string; btnBg: string; btnColor: string }> = {
  electronics: { bg: '#FFFFFF', iconBg: '#FFF', textColor: '#000000', btnBg: 'var(--accent-purple)', btnColor: '#FFF' },
  clothing: { bg: 'var(--accent-yellow)', iconBg: '#000', textColor: '#000000', btnBg: '#000000', btnColor: '#FFF' },
  'home-living': { bg: 'var(--accent-green)', iconBg: '#FFF', textColor: '#000000', btnBg: '#FFFFFF', btnColor: '#000' },
  sports: { bg: 'var(--accent-purple)', iconBg: '#FFF', textColor: '#FFFFFF', btnBg: 'var(--accent-yellow)', btnColor: '#000' },
  books: { bg: '#FFFFFF', iconBg: 'var(--accent-green)', textColor: '#000000', btnBg: '#000000', btnColor: '#FFF' },
  accessories: { bg: '#000000', iconBg: '#000', textColor: '#FFFFFF', btnBg: 'var(--accent-yellow)', btnColor: '#000' },
};

const categoryIcons: Record<string, string> = {
  electronics: 'ELEC',
  clothing: 'WEAR',
  'home-living': 'HOME',
  sports: 'SPRT',
  books: 'READ',
  accessories: 'ACCS',
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products?featured=true&limit=8').then(r => r.json()),
      fetch('/api/products?sort=newest&limit=4').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([feat, newest, cats]) => {
      setFeaturedProducts(feat.products || []);
      setNewProducts(newest.products || []);
      setCategories(cats.categories || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <>
      {/* SECTION 1: HERO (Brutalist style matching Screenshot 1 colors & buttons) */}
      <section className="hero" style={{ background: 'var(--accent-yellow)', padding: '6rem 0', overflow: 'hidden', borderBottom: '3px solid #000' }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '1.5rem', transform: 'rotate(-2deg)' }}>
            SUMMER COLLECTION 2026
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 7.5vw, 5.8rem)', lineHeight: '0.9', margin: '0 0 2rem 0', fontStyle: 'italic', fontWeight: 900, textTransform: 'uppercase', WebkitTextStroke: '1px #000' }}>
            BOLD SHOPPING.<br />RAW STYLE.
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: '550px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.4' }}>
            We curate products that refuse to blend in. Premium quality meets unapologetic design.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn btn-dark btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>
              SHOP NOW →
            </Link>
            <Link href="/shop?featured=true" className="btn btn-lg" style={{ background: '#fff', color: '#000', boxShadow: '4px 4px 0px #000' }}>
              FEATURED
            </Link>
          </div>
        </div>
        
        {/* Background slanted shapes from reference UI style */}
        <div className="hero-shapes" style={{ opacity: 0.85 }}>
          <div className="hero-shape hero-shape-1" style={{ border: '3px solid #000', borderRadius: '16px', background: 'var(--accent-purple)' }} />
          <div className="hero-shape hero-shape-2" style={{ border: '3px solid #000', borderRadius: '50%', background: 'var(--accent-blue)' }} />
          <div className="hero-shape hero-shape-3" style={{ border: '3px solid #000', borderRadius: '16px', background: 'var(--accent-red)' }} />
        </div>
      </section>

      {/* SECTION 2: GUARANTEES BAR */}
      <div className="features-bar" style={{ background: '#000', color: '#fff', borderBottom: '3px solid #000' }}>
        <div className="container features-bar-inner" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', padding: '0.5rem 0' }}>
          <div className="feature-item" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}><span className="feature-icon">//</span> FREE SHIPPING $75+</div>
          <div className="feature-item" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}><span className="feature-icon">//</span> 30-DAY RETURNS</div>
          <div className="feature-item" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}><span className="feature-icon">//</span> SECURE CHECKOUT</div>
          <div className="feature-item" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}><span className="feature-icon">//</span> 24/7 SUPPORT</div>
        </div>
      </div>

      {/* SECTION 3: SHOP BY CATEGORY (Screenshot 5 "Core Skills" design style mapping) */}
      <section className="section" style={{ background: '#FFFDF9', borderBottom: '3px solid #000' }}>
        <div className="container">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div className="brutal-badge-slanted brutal-badge-green" style={{ marginBottom: '1.25rem' }}>
                CATEGORY COLLECTION
              </div>
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', margin: 0, fontStyle: 'italic', fontWeight: 900, lineHeight: '0.9' }}>
                SHOP BY <span style={{ color: 'var(--accent-yellow)' }}>CATEGORY</span>
              </h2>
            </div>
            
            <div style={{ maxWidth: '400px' }}>
              <p style={{ fontWeight: 700, color: '#333', fontSize: '0.95rem', lineHeight: '1.4', marginBottom: '1.25rem' }}>
                WE DON'T DO BORING. WE DO HIGH-IMPACT, CUSTOM-MADE SHIPPED UTILITIES DESIGNED TO LAST.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, border: '3px solid #000', boxShadow: '3px 3px 0px #000' }}>←</button>
                <button className="btn" style={{ borderRadius: '50%', width: '42px', height: '42px', padding: 0, border: '3px solid #000', boxShadow: '3px 3px 0px #000', background: 'var(--accent-yellow)' }}>→</button>
              </div>
            </div>
          </div>

          <div className="grid grid-3">
            {categories.map((cat) => {
              const theme = categoryCardStyles[cat.slug] || { bg: '#FFFFFF', iconBg: '#FFF', textColor: '#000', btnBg: 'var(--accent-purple)', btnColor: '#FFF' };
              const icon = categoryIcons[cat.slug] || 'ITEM';
              return (
                <div
                  key={cat.id}
                  className="card card-hover"
                  style={{
                    background: theme.bg,
                    color: theme.textColor,
                    border: '3px solid #000',
                    boxShadow: '5px 5px 0px #000',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    minHeight: '260px'
                  }}
                >
                  {/* Icon Circle Container */}
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    border: '3px solid #000',
                    background: theme.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    marginBottom: '1.75rem',
                    boxShadow: '2px 2px 0px #000'
                  }}>
                    {icon}
                  </div>

                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    marginBottom: '0.5rem',
                    color: theme.textColor
                  }}>
                    {cat.name.toUpperCase()}
                  </h3>
                  
                  <p style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    lineHeight: '1.4',
                    color: theme.textColor === '#FFFFFF' ? '#DCDCE6' : '#555',
                    flex: 1
                  }}>
                    {cat.description || `DISCOVER OUR SELECTION OF PREMIUM ${cat.name.toUpperCase()} CURATED TO STAND OUT.`}
                  </p>

                  {/* Arrow at bottom right linking to category shop page */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <Link href={`/shop?category=${cat.slug}`} className="scroll-top-btn" style={{
                      width: '32px',
                      height: '32px',
                      boxShadow: '2px 2px 0px #000',
                      fontSize: '0.75rem',
                      background: theme.btnBg,
                      color: theme.btnColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none'
                    }}>
                      →
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 4: FEATURED PRODUCTS (Screenshot 4 "THE RESULTS" design style) */}
      <section className="section" style={{ background: 'var(--bg-secondary)', borderBottom: '3px solid #000' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
            <div className="brutal-badge-slanted brutal-badge-yellow" style={{ marginBottom: '1.25rem' }}>
              CURRENT STOCK SHINE
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1.5rem' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', margin: 0, fontStyle: 'italic', fontWeight: 900, lineHeight: '0.9' }}>
                FEATURED <span style={{ color: 'var(--accent-red)' }}>PRODUCTS</span>
              </h2>
              
              <Link href="/shop?featured=true" className="btn btn-sm" style={{ background: '#fff', border: '3px solid #000', boxShadow: '3px 3px 0px #000' }}>
                SEE ALL PRODUCTS →
              </Link>
            </div>
          </div>

          <div className="grid grid-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: PROMO BANNER (Screenshot 2 style Yellow Card CTA) */}
      <section style={{ background: 'var(--accent-blue)', borderBottom: '3px solid #000', padding: '4rem 0' }}>
        <div className="container">
          <div className="card" style={{
            background: '#FFFFFF',
            border: '3px solid #000',
            boxShadow: '6px 6px 0px #000',
            padding: '3rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '2rem',
            borderRadius: '16px'
          }}>
            <div>
              <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '0.75rem', transform: 'rotate(-1.5deg)' }}>
                LIMITED TIME DISCOUNTS
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.5rem', fontStyle: 'italic', color: '#000' }}>
                GET 10% OFF YOUR FIRST ORDER
              </h2>
              <p style={{ fontWeight: 700, color: '#444' }}>
                Use coupon code{' '}
                <strong style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--bg-dark)',
                  color: 'var(--accent-yellow)',
                  padding: '0.2rem 0.75rem',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '0.25rem'
                }}>
                  WELCOME10
                </strong>{' '}
                at checkout
              </p>
            </div>
            <Link href="/shop" className="btn btn-dark btn-lg" style={{ boxShadow: '4px 4px 0px #000' }}>
              CLAIM OFFER →
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6: NEW ARRIVALS */}
      <section className="section" style={{ background: '#FFFDF9', borderBottom: '3px solid #000' }}>
        <div className="container">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
            <div className="brutal-badge-slanted brutal-badge-purple" style={{ marginBottom: '1.25rem' }}>
              NEW DROPS
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', flexWrap: 'wrap', gap: '1.5rem' }}>
              <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', margin: 0, fontStyle: 'italic', fontWeight: 900, lineHeight: '0.9' }}>
                NEW <span style={{ color: 'var(--accent-purple)' }}>ARRIVALS</span>
              </h2>
              
              <Link href="/shop?sort=newest" className="btn btn-sm" style={{ background: '#fff', border: '3px solid #000', boxShadow: '3px 3px 0px #000' }}>
                VIEW ALL ARRIVALS →
              </Link>
            </div>
          </div>

          <div className="grid grid-4">
            {newProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: WHY CHOOSE US */}
      <section className="section" style={{ background: 'var(--bg-dark)', color: 'var(--text-on-dark)' }}>
        <div className="container">
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontStyle: 'italic', color: 'var(--accent-yellow)', textAlign: 'center', marginBottom: '3.5rem' }}>
            WHY TELLORASHOP?
          </h2>
          <div className="grid grid-4">
            {[
              { icon: '01', title: 'Curated Selection', desc: 'Every product is hand-picked for quality and uniqueness. No generic stuff.' },
              { icon: '02', title: 'Premium Quality', desc: 'We partner with the best brands and artisans for products that last.' },
              { icon: '03', title: 'Fast & Free Shipping', desc: 'Free shipping on orders over $75. Express delivery available.' },
              { icon: '04', title: 'Easy Returns', desc: '30-day hassle-free returns. No questions asked.' },
            ].map((item, i) => (
              <div key={i} className="card" style={{ padding: '2rem', border: '3px solid #333', background: '#111', color: '#fff', borderRadius: '12px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{item.icon}</div>
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem', fontStyle: 'italic', color: 'var(--accent-yellow)' }}>{item.title}</h3>
                <p style={{ color: '#aaa', fontSize: '0.85rem', fontWeight: 700, lineHeight: '1.4' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
