'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

const LogoSVG = () => (
  <img src="/tellora-logo.png" alt="TelloraShop Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
);

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products: Array<{ id: string; name: string; slug: string; price: number; images: string }>;
    categories: Array<{ id: string; name: string; slug: string }>;
  }>({ products: [], categories: [] });
  
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults({ products: [], categories: [] });
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getFirstImage = (images: string) => {
    try {
      const arr = JSON.parse(images || '[]');
      return arr[0];
    } catch {
      return null;
    }
  };

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="marquee">
        <div className="marquee-inner">
          {[1, 2].map(i => (
            <React.Fragment key={i}>
              <span className="marquee-item">TELLORASHOP 2026 OUT NOW</span>
              <span className="marquee-item">FREE SHIPPING ON ORDERS OVER $75</span>
              <span className="marquee-item">PREMIUM RAW QUALITY</span>
              <span className="marquee-item">CODE WELCOME10 FOR 10% OFF</span>
              <span className="marquee-item">TELLORASHOP 2026 OUT NOW</span>
              <span className="marquee-item">FREE SHIPPING ON ORDERS OVER $75</span>
              <span className="marquee-item">PREMIUM RAW QUALITY</span>
              <span className="marquee-item">CODE WELCOME10 FOR 10% OFF</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg-primary)', borderBottom: '3px solid #000', padding: '0.75rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', position: 'relative' }}>
          
          {/* Logo Section */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: '#fff',
              border: '3px solid #000',
              boxShadow: '3px 3px 0px var(--accent-purple)',
              padding: '0.35rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'rotate(-3deg) scale(0.95)',
              borderRadius: '8px'
            }}>
              <LogoSVG />
            </div>
            <span className="font-brutal-title" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em' }}>
              TELLORA<span style={{ color: 'var(--accent-purple)' }}>SHOP</span>
            </span>
          </Link>

          {/* Navigation Pill (Desktop) */}
          <nav className="navbar-links brutal-header-pill" style={{ display: 'flex' }}>
            <Link href="/" className={`navbar-link ${isActive('/')}`}>HOME</Link>
            <Link href="/shop" className={`navbar-link ${pathname === '/shop' ? 'active' : ''}`}>SHOP</Link>
            <Link href="/shop?category=electronics" className="navbar-link">ELECTRONICS</Link>
            <Link href="/shop?category=clothing" className="navbar-link">CLOTHING</Link>
            <Link href="/page/about" className={`navbar-link ${isActive('/page/about')}`}>ABOUT</Link>
          </nav>

          {/* Actions (Search, Account, Cart, Mobile Menu) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Styled Autocomplete Search */}
            <div className="search-bar" ref={searchRef} style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              border: '3px solid #000',
              borderRadius: '8px',
              background: '#fff',
              padding: '0.4rem 0.8rem',
              boxShadow: '3px 3px 0px #000',
              width: '200px',
              transition: 'all 0.2s ease'
            }}>
              <svg style={{ marginRight: '0.4rem', width: '14px', height: '14px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="SEARCH..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  width: '100%',
                  textTransform: 'uppercase'
                }}
              />
              {searchOpen && (searchResults.products.length > 0 || searchResults.categories.length > 0) && (
                <div className="search-results" style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  minWidth: '260px',
                  background: '#fff',
                  border: '3px solid #000',
                  boxShadow: '5px 5px 0px #000',
                  zIndex: 200,
                  marginTop: '0.5rem',
                  borderRadius: '8px',
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}>
                  {searchResults.categories.map(cat => (
                    <div
                      key={cat.id}
                      className="search-result-item"
                      onClick={() => { router.push(`/shop?category=${cat.slug}`); setSearchOpen(false); setSearchQuery(''); }}
                      style={{ padding: '0.75rem', borderBottom: '2px solid #000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.7rem', background: 'var(--accent-yellow)', padding: '0.15rem 0.4rem', border: '2px solid #000', borderRadius: '4px' }}>CAT</span>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{cat.name.toUpperCase()}</strong>
                        <br />
                        <small style={{ color: '#888' }}>CATEGORY</small>
                      </div>
                    </div>
                  ))}
                  {searchResults.products.map(product => {
                    const imgUrl = getFirstImage(product.images);
                    return (
                      <div
                        key={product.id}
                        className="search-result-item"
                        onClick={() => { router.push(`/product/${product.slug}`); setSearchOpen(false); setSearchQuery(''); }}
                        style={{ padding: '0.65rem 0.75rem', borderBottom: '2px solid #000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.65rem' }}
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={product.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', border: '2px solid #000' }} />
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.65rem', background: 'var(--accent-green)', padding: '0.2rem 0.4rem', border: '2px solid #000', borderRadius: '4px' }}>PRD</span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name.toUpperCase()}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-purple)' }}>${product.price.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Profile Action */}
            {user ? (
              <Link href={isAdmin ? '/admin' : '/account'} className="navbar-icon-btn" style={{ borderRadius: '8px', border: '3px solid #000' }} title="Account">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            ) : (
              <Link href="/login" className="navbar-icon-btn" style={{ borderRadius: '8px', border: '3px solid #000' }} title="Login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
            )}

            {/* Cart Action Button (Styled Purple COLAB-style Button) */}
            <button
              onClick={toggleCart}
              className="btn btn-purple"
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                boxShadow: '3px 3px 0px #000',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Cart"
            >
              CART ({totalItems})
            </button>

            {/* Shop Now Action Button (Styled Yellow FREE AUDIT-style Button) */}
            <Link
              href="/shop"
              className="btn btn-primary d-desktop-only"
              style={{
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                boxShadow: '3px 3px 0px #000',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                color: '#000'
              }}
            >
              SHOP NOW →
            </Link>

            {/* Logout Trigger (If Logged In) */}
            {user && (
              <button className="navbar-icon-btn" style={{ borderRadius: '8px', border: '3px solid #000' }} onClick={logout} title="Logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            )}

            {/* Hamburger (Mobile) */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'none',
                width: '42px',
                height: '42px',
                background: 'var(--accent-yellow)',
                border: '3px solid #000',
                boxShadow: '3px 3px 0px #000',
                borderRadius: '8px',
                fontSize: '1.25rem',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="mobile-menu-container" style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'var(--bg-primary)',
            borderBottom: '3px solid #000',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            zIndex: 99
          }}>
            <Link href="/" className="btn btn-full" onClick={() => setMobileOpen(false)}>HOME</Link>
            <Link href="/shop" className="btn btn-full btn-primary" onClick={() => setMobileOpen(false)}>SHOP</Link>
            <Link href="/shop?category=electronics" className="btn btn-full" onClick={() => setMobileOpen(false)}>ELECTRONICS</Link>
            <Link href="/shop?category=clothing" className="btn btn-full" onClick={() => setMobileOpen(false)}>CLOTHING</Link>
            <Link href="/page/about" className="btn btn-full" onClick={() => setMobileOpen(false)}>ABOUT</Link>
          </div>
        )}
      </header>
    </>
  );
}
