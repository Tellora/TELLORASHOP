'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const accountLinks = [
  { href: '/account', label: 'Profile', icon: 'USR' },
  { href: '/account/orders', label: 'My Orders', icon: 'ORD' },
  { href: '/account/wishlist', label: 'Wishlist', icon: 'FAV' },
  { href: '/account/addresses', label: 'Addresses', icon: 'ADR' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push(`/login?redirect=${encodeURIComponent(pathname)}`); }
      else { setReady(true); }
    }
  }, [user, loading, router, pathname]);

  if (!ready) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container">
      <div style={{ padding: '2rem 0 1rem' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)' }}>MY ACCOUNT</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, {user?.name}!</p>
      </div>
      <div className="account-layout">
        <nav className="account-nav">
          {accountLinks.map(link => (
            <Link key={link.href} href={link.href} className={`account-nav-link ${pathname === link.href ? 'active' : ''}`}>
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}
          <button className="account-nav-link" onClick={async () => { await logout(); router.push('/'); }} style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}>
            <span>OUT</span> Log out
          </button>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
