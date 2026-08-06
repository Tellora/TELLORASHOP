'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';

const adminNavSections = [
  {
    title: 'MAIN OVERVIEW',
    links: [
      { href: '/admin', label: 'Dashboard', icon: 'DSH', badge: null },
    ],
  },
  {
    title: 'CATALOG MANAGEMENT',
    links: [
      { href: '/admin/products', label: 'Products', icon: 'PRD', badge: '12' },
      { href: '/admin/categories', label: 'Categories', icon: 'CAT', badge: '6' },
    ],
  },
  {
    title: 'SALES & ORDERS',
    links: [
      { href: '/admin/orders', label: 'Orders', icon: 'ORD', badge: 'NEW' },
      { href: '/admin/customers', label: 'Customers', icon: 'USR', badge: null },
    ],
  },
  {
    title: 'MARKETING & PROMO',
    links: [
      { href: '/admin/coupons', label: 'Discounts', icon: 'DSC', badge: '3' },
      { href: '/admin/reviews', label: 'Reviews', icon: 'REV', badge: '4' },
    ],
  },
  {
    title: 'SYSTEM & CONTENT',
    links: [
      { href: '/admin/pages', label: 'Pages (CMS)', icon: 'CMS', badge: null },
      { href: '/admin/settings', label: 'Store Settings', icon: 'SET', badge: null },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [authorized, setAuthorized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin') {
        showToast('Access denied: Admins only', 'error');
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    }
  }, [user, loading, router, showToast]);

  const handleLogout = async () => {
    await logout();
    showToast('Logged out of admin panel');
    router.push('/login');
  };

  if (loading || !authorized) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Ticker marquee */}
      <div className="marquee" style={{ background: '#000', color: 'var(--accent-yellow)', borderBottom: '2px solid #000' }}>
        <div className="marquee-inner">
          {[1, 2].map(i => (
            <React.Fragment key={i}>
              <span className="marquee-item">TELLORASHOP CONTROL CENTER</span>
              <span className="marquee-item">REAL-TIME SALES & INVENTORY TRACKER</span>
              <span className="marquee-item">DATABASE ENGINE: ACTIVE</span>
              <span className="marquee-item">ROLE: ADMINISTRATOR</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Admin Header Navbar */}
      <header className="navbar" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#000', color: '#FFF', borderBottom: '3px solid #FFF' }}>
        <div className="container navbar-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="d-mobile-only btn btn-sm btn-primary"
              style={{ padding: '0.35rem 0.65rem' }}
            >
              {mobileOpen ? '✕' : '☰ MENU'}
            </button>

            <Link href="/admin" className="navbar-logo" style={{ color: '#FFF' }}>
              <span className="navbar-logo-box" style={{ background: 'var(--accent-pink)', color: '#FFF', transform: 'rotate(-3deg)' }}>ADM</span>
              Tellora<span style={{ color: 'var(--accent-yellow)' }}>Admin</span>
            </Link>

            <span className="d-desktop-only badge badge-green" style={{ transform: 'none', fontSize: '0.7rem' }}>
              ONLINE // v2.6
            </span>
          </div>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="d-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#222', border: '2px solid #FFF', padding: '0.3rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block' }} />
              <span>{user?.name || 'Admin'}</span>
            </div>

            <Link href="/" className="btn btn-sm btn-yellow" style={{ boxShadow: '2px 2px 0px #FFF' }}>
              STORE FRONT ➔
            </Link>

            <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ boxShadow: '2px 2px 0px #FFF' }}>
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="admin-layout" style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>
        {/* Sidebar Navigation */}
        <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`} style={{ width: '260px', background: '#FFF', borderRight: '3.5px solid #000', padding: '1.5rem 1rem', flexShrink: 0 }}>
          {adminNavSections.map((sec, idx) => (
            <div key={idx} className="admin-sidebar-section" style={{ marginBottom: '1.75rem' }}>
              <div className="admin-sidebar-label" style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '0.65rem', borderBottom: '2px solid #EEE', paddingBottom: '0.35rem' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {sec.links.map(link => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        border: '2.5px solid',
                        borderColor: isActive ? '#000' : 'transparent',
                        background: isActive ? 'var(--accent-yellow)' : 'transparent',
                        boxShadow: isActive ? '3px 3px 0px #000' : 'none',
                        fontWeight: isActive ? 900 : 700,
                        fontSize: '0.85rem',
                        color: '#000',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 900, background: isActive ? '#000' : 'var(--bg-secondary)', color: isActive ? '#FFF' : '#000', padding: '0.15rem 0.35rem', borderRadius: '4px', border: '1.5px solid #000' }}>
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                      </div>
                      {link.badge && (
                        <span className={`badge ${isActive ? 'badge-dark' : 'badge-pink'}`} style={{ transform: 'none', fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Content Panel */}
        <main className="admin-content" style={{ flex: 1, padding: '2rem 2.5rem', background: '#FFFDF9', overflowX: 'auto' }}>
          {children}
        </main>
      </div>
    </>
  );
}

