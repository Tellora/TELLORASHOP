'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const LogoSVGWhite = () => (
  <img src="/tellora-logo.png" alt="TelloraShop Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subMsg, setSubMsg] = useState('');
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setSubMsg(data.message || 'Subscribed!');
      setEmail('');
      setTimeout(() => setSubMsg(''), 3000);
    } catch {
      setSubMsg('Error. Try again.');
    }
  };

  return (
    <>
      {/* Newsletter */}
      <section className="newsletter" style={{ background: 'var(--accent-purple)' }}>
        <div className="container newsletter-content">
          <div>
            <h2 style={{ color: '#fff', WebkitTextStroke: '2px #000', textShadow: '3px 3px 0px #000' }}>JOIN THE MOVEMENT</h2>
            <p className="newsletter-desc" style={{ color: '#fff' }}>Get exclusive deals, new arrivals & raw content. No spam, ever.</p>
            {subMsg && <p style={{ color: 'var(--accent-yellow)', fontWeight: 700, marginTop: '0.5rem' }}>{subMsg}</p>}
          </div>
          <form className="newsletter-form" onSubmit={handleSubscribe} style={{ border: '3px solid #000', borderRadius: '8px', overflow: 'hidden' }}>
            <input
              className="newsletter-input"
              type="email"
              placeholder="YOUR.EMAIL@DOMAIN."
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ padding: '1rem', border: 'none', borderRight: '3px solid #000', outline: 'none', fontSize: '0.85rem', fontWeight: 700 }}
            />
            <button type="submit" className="btn btn-dark" style={{ border: 'none', borderRadius: 0, margin: 0, padding: '0 2rem' }}>
              SUBSCRIBE →
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" style={{ background: '#000', color: '#fff', borderTop: '4px solid #000', padding: '4rem 0 3rem' }}>
        <div className="container">
          <div className="footer-grid">
            
            {/* Brand column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{
                  background: '#111',
                  border: '3px solid #fff',
                  boxShadow: '3px 3px 0px var(--accent-purple)',
                  padding: '0.35rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-3deg) scale(0.9)',
                  borderRadius: '8px'
                }}>
                  <LogoSVGWhite />
                </div>
                <span className="font-brutal-title" style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                  TELLORA<span style={{ color: 'var(--accent-purple)' }}>SHOP</span>
                </span>
              </div>
              <p className="footer-desc" style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Bold shopping. Raw style. We curate products that refuse to blend in — just like you.
              </p>
              <div className="footer-socials" style={{ display: 'flex', gap: '0.5rem' }}>
                <a href="#" className="footer-social" style={{ borderColor: '#333' }}>𝕏</a>
                <a href="#" className="footer-social" style={{ borderColor: '#333' }}>IG</a>
                <a href="#" className="footer-social" style={{ borderColor: '#333' }}>LN</a>
                <a href="#" className="footer-social" style={{ borderColor: '#333' }}>YT</a>
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h4 className="footer-heading" style={{ color: 'var(--accent-yellow)', marginBottom: '1.25rem' }}>SHOP</h4>
              <ul className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li><Link href="/shop" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>ALL PRODUCTS</Link></li>
                <li><Link href="/shop?category=electronics" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>ELECTRONICS</Link></li>
                <li><Link href="/shop?category=clothing" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>CLOTHING</Link></li>
                <li><Link href="/shop?category=home-living" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>HOME & LIVING</Link></li>
                <li><Link href="/shop?category=accessories" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>ACCESSORIES</Link></li>
              </ul>
            </div>

            {/* Help Links */}
            <div>
              <h4 className="footer-heading" style={{ color: 'var(--accent-purple)', marginBottom: '1.25rem' }}>HELP</h4>
              <ul className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li><Link href="/page/about" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>ABOUT US</Link></li>
                <li><Link href="/page/contact" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>CONTACT</Link></li>
                <li><Link href="/page/shipping-policy" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>SHIPPING POLICY</Link></li>
                <li><Link href="/page/return-policy" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>RETURN POLICY</Link></li>
              </ul>
            </div>

            {/* Account Links */}
            <div>
              <h4 className="footer-heading" style={{ color: 'var(--accent-green)', marginBottom: '1.25rem' }}>ACCOUNT</h4>
              <ul className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                <li><Link href="/login" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>LOGIN</Link></li>
                <li><Link href="/register" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>REGISTER</Link></li>
                <li><Link href="/account" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>MY ACCOUNT</Link></li>
                <li><Link href="/account/orders" style={{ color: '#ccc', fontWeight: 700, fontSize: '0.85rem' }}>ORDER HISTORY</Link></li>
              </ul>
            </div>

          </div>

          <hr style={{ borderColor: '#222', margin: '3rem 0 2rem' }} />

          {/* Footer bottom bar */}
          <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>
              © 2026 TELLORASHOP. ALL RIGHTS RESERVED. PART OF TELLORA MEDIA NETWORKS.
            </span>
            <div style={{
              background: '#222',
              border: '2px solid #fff',
              padding: '0.25rem 0.75rem',
              transform: 'rotate(-1deg)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#fff'
            }}>
              VIBE CHECK: PASSED
            </div>
          </div>
        </div>
      </footer>

      {/* Floating CORE INTEL Widget (Screenshot 1 bottom right) */}
      {showScroll && (
        <div className="floating-core-intel">
          <div className="core-intel-panel">
            <span className="core-intel-status-dot" />
            <span>CORE INTEL</span>
            <span style={{ color: '#666' }}>|</span>
            <span style={{ color: 'var(--accent-yellow)' }}>PHASE: 04</span>
            <span style={{ color: '#666' }}>|</span>
            <span style={{ color: 'var(--accent-green)' }}>READY TO SCALP</span>
          </div>
          <button className="scroll-top-btn" onClick={scrollToTop} title="Scroll to Top">
            ↑
          </button>
        </div>
      )}
    </>
  );
}
